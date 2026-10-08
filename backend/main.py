from pathlib import Path
import sqlite3
import hashlib
import hmac
import secrets
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from agent import run_chat
from models import ChatHistoryResponse, ChatReply, ChatRequest
from tools import get_customer_context, load_chat_history, save_chat_message

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "campus_customs.db"
PRODUCTS_DIR = PROJECT_ROOT / "data"
PRODUCTS_ROOT = PRODUCTS_DIR / "products"

app = FastAPI(title="Campus Customs API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PASSWORD_ALGORITHM = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 600_000
LEGACY_PASSWORD_ITERATIONS = 120_000


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def product_payload(row: sqlite3.Row, connection: sqlite3.Connection) -> dict[str, Any]:
    inventory_rows = connection.execute(
        "SELECT size, quantity FROM inventory WHERE product_id = ? ORDER BY size",
        (row["product_id"],),
    ).fetchall()
    return {
        "product_id": row["product_id"],
        "name": row["name"],
        "garment_type": row["garment_type"],
        "description": row["description"],
        "colors": row["colors"],
        "search_tags": row["search_tags"],
        "image_file_path": row["image_file_path"],
        "price": row["price"],
        "inventory": [dict(item) for item in inventory_rows],
    }


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return "$".join(
        [
            PASSWORD_ALGORITHM,
            str(PASSWORD_ITERATIONS),
            salt.hex(),
            digest.hex(),
        ]
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        parts = stored_hash.split("$")
        if len(parts) == 4:
            algorithm, iterations_text, salt_hex, digest_hex = parts
            iterations = int(iterations_text)
            salts = [bytes.fromhex(salt_hex)]
        elif len(parts) == 3:
            algorithm, salt_hex, digest_hex = parts
            iterations = LEGACY_PASSWORD_ITERATIONS
            salts = [salt_hex.encode("utf-8")]
            try:
                salts.append(bytes.fromhex(salt_hex))
            except ValueError:
                pass
        else:
            return False
        if algorithm != PASSWORD_ALGORITHM:
            return False
        expected = bytes.fromhex(digest_hex)
    except (TypeError, ValueError):
        return False
    return any(
        hmac.compare_digest(
            hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations),
            expected,
        )
        for salt in salts
    )


def public_user(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "name": row["name"],
        "email": row["email"],
        "created_at": row["created_at"],
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatReply)
async def chat(request: ChatRequest) -> ChatReply:
    customer = get_customer_context(request.user_id) if request.user_id is not None else None
    history = load_chat_history(customer.user_id) if customer else []
    if customer:
        save_chat_message(customer.user_id, "user", request.message.strip())
    reply = await run_chat(
        request.message.strip(),
        customer=customer,
        page_context=request.page_context,
        history=history,
    )
    if customer:
        save_chat_message(
            customer.user_id,
            "assistant",
            reply.reply,
            [product.model_dump() for product in reply.products],
        )
    return reply


@app.get("/api/chat/history/{user_id}", response_model=ChatHistoryResponse)
def chat_history(user_id: int) -> ChatHistoryResponse:
    if get_customer_context(user_id) is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ChatHistoryResponse(messages=load_chat_history(user_id))


@app.post("/api/auth/register", status_code=201)
def register(request: RegisterRequest) -> dict[str, Any]:
    first_name = request.first_name.strip()
    last_name = request.last_name.strip()
    email = normalize_email(request.email)
    if not first_name or not last_name or "@" not in email:
        raise HTTPException(status_code=400, detail="Enter a valid name and email.")
    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?", (email,)
        ).fetchone()
        if existing is not None:
            raise HTTPException(status_code=409, detail="An account with that email already exists.")
        cursor = connection.execute(
            """
            INSERT INTO users (name, email, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
            """,
            (f"{first_name} {last_name}", email, hash_password(request.password), first_name, last_name),
        )
        row = connection.execute(
            "SELECT id, first_name, last_name, name, email, created_at FROM users WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return {"message": "Account created.", "user": public_user(row)}


@app.post("/api/auth/login")
def login(request: LoginRequest) -> dict[str, Any]:
    email = normalize_email(request.email)
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
        if row is None or not verify_password(request.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Email or password is incorrect.")
        return {"message": "Login successful.", "user": public_user(row)}


@app.get("/api/products")
def list_products() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM catalogue ORDER BY name"
        ).fetchall()
        return [product_payload(row, connection) for row in rows]


@app.get("/api/products/{product_id}")
def get_product(product_id: str) -> dict[str, Any]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM catalogue WHERE product_id = ?", (product_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return product_payload(row, connection)


@app.get("/images/{image_path:path}")
def get_product_image(image_path: str) -> FileResponse:
    requested = (PRODUCTS_DIR / image_path).resolve()
    products_root = PRODUCTS_ROOT.resolve()
    if products_root not in requested.parents or not requested.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(requested)
