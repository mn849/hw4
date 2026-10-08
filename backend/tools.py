from pathlib import Path
import sqlite3
import json

from models import (
    CatalogueSearchResult,
    ChatHistoryMessage,
    CustomerContext,
    InventoryItemResult,
    InventoryLookupResult,
    ProductDescriptionResult,
    ProductPriceResult,
)


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "campus_customs.db"


def catalogue_count() -> int:
    """Return the number of products currently in the Campus Customs catalogue."""
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute("SELECT COUNT(*) FROM catalogue").fetchone()
    return int(row[0])


def get_customer_context(user_id: int) -> CustomerContext | None:
    """Load safe identity fields for a logged-in customer; never load a password hash."""
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            "SELECT id, name, first_name, last_name, email FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    if row is None:
        return None
    return CustomerContext(
        user_id=row["id"],
        name=row["name"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        email=row["email"],
    )


def load_chat_history(user_id: int, limit: int = 50) -> list[ChatHistoryMessage]:
    """Reload saved history for one known user; guests never call this function."""
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT id, role, content, products_json, created_at
            FROM chat_messages
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (user_id, max(1, min(limit, 100))),
        ).fetchall()
    messages = []
    for row in reversed(rows):
        try:
            products = json.loads(row["products_json"] or "[]")
        except json.JSONDecodeError:
            products = []
        messages.append(
            ChatHistoryMessage(
                id=row["id"],
                role=row["role"],
                content=row["content"],
                products=products if isinstance(products, list) else [],
                created_at=row["created_at"],
            )
        )
    return messages


def save_chat_message(user_id: int, role: str, content: str, products: list[dict] | None = None) -> None:
    """Append one user/assistant message for a logged-in customer."""
    if role not in {"user", "assistant"}:
        raise ValueError("Unsupported chat role")
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            "INSERT INTO chat_messages (user_id, role, content, products_json) VALUES (?, ?, ?, ?)",
            (user_id, role, content, json.dumps(products or [])),
        )
        connection.commit()


def _find_product(connection: sqlite3.Connection, product_query: str):
    """Find a product by exact id first, then by a case-insensitive name match."""
    query = product_query.strip()
    if not query:
        return None
    row = connection.execute(
        "SELECT product_id, name, description, price FROM catalogue WHERE product_id = ?",
        (query,),
    ).fetchone()
    if row is not None:
        return row
    return connection.execute(
        """
        SELECT product_id, name, description, price
        FROM catalogue
        WHERE lower(name) LIKE lower(?)
        ORDER BY name
        LIMIT 1
        """,
        (f"%{query}%",),
    ).fetchone()


def get_product_description(product_query: str) -> ProductDescriptionResult:
    """Look up the real description for one catalogue product by id or name."""
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        row = _find_product(connection, product_query)
    if row is None:
        return ProductDescriptionResult(
            found=False,
            message=f"No catalogue product matched '{product_query}'. Ask the shopper to clarify the product.",
        )
    return ProductDescriptionResult(
        found=True,
        product_id=row["product_id"],
        name=row["name"],
        description=row["description"],
        message="Description found in the catalogue.",
    )


def get_product_price(product_query: str) -> ProductPriceResult:
    """Look up the real price for one catalogue product by id or name."""
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        row = _find_product(connection, product_query)
    if row is None:
        return ProductPriceResult(
            found=False,
            message=f"No catalogue product matched '{product_query}'. Do not guess a price.",
        )
    return ProductPriceResult(
        found=True,
        product_id=row["product_id"],
        name=row["name"],
        price=float(row["price"]),
        message="Price found in the catalogue.",
    )


def normalize_size(size: str | None) -> str | None:
    if not size:
        return None
    aliases = {
        "extra small": "XS", "x-small": "XS", "xs": "XS",
        "small": "S", "s": "S",
        "medium": "M", "m": "M",
        "large": "L", "l": "L",
        "extra large": "XL", "x-large": "XL", "xl": "XL",
        "extra extra large": "XXL", "xx-large": "XXL", "xxl": "XXL",
    }
    normalized = " ".join(size.lower().strip().split())
    return aliases.get(normalized, normalized.upper())


def get_inventory(product_query: str, size: str | None = None) -> InventoryLookupResult:
    """Look up real size-level inventory; zero quantity is explicitly out of stock."""
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        product = _find_product(connection, product_query)
        if product is None:
            return InventoryLookupResult(
                found=False,
                requested_size=size.upper().strip() if size else None,
                message=f"No catalogue product matched '{product_query}'. Do not invent stock.",
            )
        normalized_size = normalize_size(size)
        if normalized_size:
            rows = connection.execute(
                "SELECT size, quantity FROM inventory WHERE product_id = ? AND upper(size) = ? ORDER BY size",
                (product["product_id"], normalized_size),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT size, quantity FROM inventory WHERE product_id = ? ORDER BY size",
                (product["product_id"],),
            ).fetchall()
    if not rows:
        return InventoryLookupResult(
            found=True,
            product_id=product["product_id"],
            name=product["name"],
            requested_size=normalized_size,
            message=f"No inventory record exists for {product['name']} at the requested size. Do not claim it is available.",
        )
    items = [
        InventoryItemResult(
            size=row["size"],
            quantity=int(row["quantity"]),
            in_stock=int(row["quantity"]) > 0,
            message=("In stock." if int(row["quantity"]) > 0 else "Out of stock."),
        )
        for row in rows
    ]
    if normalized_size and items[0].quantity == 0:
        message = f"{product['name']} is out of stock in size {normalized_size}."
    elif normalized_size:
        message = f"{product['name']} has size {normalized_size} in stock."
    else:
        message = f"Inventory found for {product['name']} across the available sizes."
    return InventoryLookupResult(
        found=True,
        product_id=product["product_id"],
        name=product["name"],
        requested_size=normalized_size,
        items=items,
        message=message,
    )


def search_catalogue(query: str, limit: int = 8) -> CatalogueSearchResult:
    """Search real catalogue names, garment types, and tags for product cards."""
    stop_words = {"show", "me", "find", "some", "products", "product", "please", "of", "for", "the", "a", "an", "get", "list", "items"}
    terms = []
    for raw_term in query.lower().split():
        term = "".join(character for character in raw_term if character.isalnum() or character == "-")
        if term in stop_words or len(term) < 2:
            continue
        if term.endswith("s") and not term.endswith("ss"):
            term = term[:-1]
        if term and term not in terms:
            terms.append(term)
    if not terms:
        return CatalogueSearchResult(query=query, message="No searchable product terms were found.")
    groups = []
    params: list[str] = []
    for term in terms:
        groups.append("(lower(name) LIKE ? OR lower(garment_type) LIKE ? OR lower(search_tags) LIKE ?)")
        pattern = f"%{term}%"
        params.extend([pattern, pattern, pattern])
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            f"""
            SELECT product_id, name, price, description, image_file_path
            FROM catalogue
            WHERE {' AND '.join(groups)}
            ORDER BY name
            LIMIT ?
            """,
            (*params, max(1, min(limit, 24))),
        ).fetchall()
    products = [
        {
            "product_id": row["product_id"],
            "name": row["name"],
            "price": float(row["price"]),
            "short_description": row["description"][:150].rstrip() + ("…" if len(row["description"]) > 150 else ""),
            "image_file_path": row["image_file_path"],
        }
        for row in rows
    ]
    message = f"Found {len(products)} catalogue result(s) for '{query}'." if products else f"No catalogue products matched '{query}'."
    return CatalogueSearchResult(query=query, products=products, message=message)
