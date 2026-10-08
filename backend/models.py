from typing import Literal

from pydantic import BaseModel, Field


class ProductCard(BaseModel):
    product_id: str
    name: str
    price: float
    short_description: str = ""
    image_file_path: str = ""


class PageContext(BaseModel):
    path: str = ""
    product_id: str | None = None
    product_name: str | None = None
    description: str | None = None
    price: float | None = None
    colors: list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    user_id: int | None = None
    page_context: PageContext | None = None


class CustomerContext(BaseModel):
    user_id: int
    name: str
    first_name: str | None = None
    last_name: str | None = None
    email: str


class ChatHistoryMessage(BaseModel):
    id: int
    role: Literal["user", "assistant"]
    content: str
    products: list[ProductCard] = Field(default_factory=list)
    created_at: str


class ChatHistoryResponse(BaseModel):
    messages: list[ChatHistoryMessage] = Field(default_factory=list)


class ChatReply(BaseModel):
    reply: str
    products: list[ProductCard] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    route: Literal["chat"] = "chat"


class ProductDescriptionResult(BaseModel):
    found: bool
    product_id: str | None = None
    name: str | None = None
    description: str | None = None
    message: str


class ProductPriceResult(BaseModel):
    found: bool
    product_id: str | None = None
    name: str | None = None
    price: float | None = None
    message: str


class InventoryItemResult(BaseModel):
    size: str
    quantity: int
    in_stock: bool
    message: str


class InventoryLookupResult(BaseModel):
    found: bool
    product_id: str | None = None
    name: str | None = None
    requested_size: str | None = None
    items: list[InventoryItemResult] = Field(default_factory=list)
    message: str


class CatalogueSearchResult(BaseModel):
    query: str
    products: list[ProductCard] = Field(default_factory=list)
    message: str
