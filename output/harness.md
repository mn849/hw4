# Homework 4 System Harness

This document will be updated as each problem is completed. It should describe the actual database fields, application flow, models, tools, safety rules, limits, and run commands.

## Database

The local database is `data/campus_customs.db`. It contains 102 catalogue products, 612 inventory rows, 3 users, and 22 stored chat messages at the time of this analysis.

### `catalogue`

One row represents one product in the shop. `product_id` is the primary key.

| Field | Type | Meaning | Why it matters |
| --- | --- | --- | --- |
| `product_id` | `TEXT` | Stable unique identifier for the product. | Joins catalogue data to inventory and identifies products in API routes, links, and chatbot results. |
| `name` | `TEXT NOT NULL` | Customer-facing product name. | Used in product cards, detail pages, search, and chatbot answers. |
| `garment_type` | `TEXT NOT NULL` | Product category or garment style, such as hoodie or crewneck sweatshirt. | Supports category searches and helps the chatbot filter or recommend products. |
| `description` | `TEXT NOT NULL` | Full product description. | Supplies accurate detail-page and chatbot product information. |
| `colors` | `TEXT NOT NULL` | JSON-formatted list of available colors. | Lets the site and chatbot report color choices from the catalogue instead of inventing them. |
| `search_tags` | `TEXT NOT NULL` | Searchable keywords associated with the product. | Improves natural-language and category search matching. |
| `image_file_path` | `TEXT NOT NULL` | Relative path to the product image, such as `products/basic-hoodie-big-yale.jpg`. | Connects catalogue records to the supplied images used by product cards and detail pages. |
| `price` | `REAL NOT NULL` | Product price. | Must be the source of truth for displayed prices and chatbot price answers. |

The catalogue declares `product_id` as the primary key and contains 102 products.

### `inventory`

One row represents the quantity of one product in one size. `id` is the row primary key, and `(product_id, size)` is unique.

| Field | Type | Meaning | Why it matters |
| --- | --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique identifier for an inventory row. | Gives each stock record a stable database identity. It is not the product identifier used by the shop. |
| `product_id` | `TEXT NOT NULL` | Product whose stock is being recorded. | Joins stock to the correct catalogue product and prevents answers about the wrong item. |
| `size` | `TEXT NOT NULL` | Size for this stock record (`XS`, `S`, `M`, `L`, `XL`, or `XXL` in the current data). | Allows the chatbot and product page to answer size-specific availability questions. |
| `quantity` | `INTEGER NOT NULL` | Number of units currently in stock for that product and size. | Provides the factual stock answer, including zero quantities and out-of-stock responses. |

The table has 612 rows: six size rows for each of the 102 products. It has a foreign key from `product_id` to `catalogue.product_id` and a unique constraint on `(product_id, size)`.

### `users`

One row represents a customer account. `id` is the primary key and `email` is unique.

| Field | Type | Meaning | Why it matters |
| --- | --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Internal customer identifier. | Links a customer to chat history and identifies the authenticated session without using an email as the database key. |
| `name` | `TEXT NOT NULL` | Existing display name field. | Provides a backwards-compatible customer name for account display or agent context. |
| `email` | `TEXT NOT NULL UNIQUE` | Customer login email address. | Supports account lookup and login; uniqueness prevents duplicate accounts. |
| `password_hash` | `TEXT NOT NULL` | One-way password hash, rather than a plaintext password. | Allows secure password verification during login without exposing the customer’s password. |
| `created_at` | `TEXT NOT NULL DEFAULT (datetime('now'))` | Timestamp when the account was created. | Supports account records, auditing, and customer-history context. |
| `first_name` | `TEXT` | Customer’s first name; nullable in the supplied schema. | Supports the required first-name account field and personalized chatbot responses. |
| `last_name` | `TEXT` | Customer’s last name; nullable in the supplied schema. | Supports the required last-name account field and complete customer identity. |

The database currently contains 3 user rows. Password values were not copied into this document.

### `chat_messages`

This table is also present in the supplied database and supports the later customer-memory problems. One row represents one saved chat message.

| Field | Type | Meaning | Why it matters |
| --- | --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique message identifier. | Keeps messages ordered and individually addressable. |
| `user_id` | `INTEGER NOT NULL` | User who sent or received the message. | Connects chat history to the authenticated customer. |
| `role` | `TEXT NOT NULL` | Message role, such as user or assistant. | Lets the application reconstruct the conversation correctly. |
| `content` | `TEXT NOT NULL` | Message text. | Stores the conversation that can be shown again or passed back to the agent. |
| `products_json` | `TEXT` | Optional JSON representation of products associated with a message. | Preserves product-card results so chat history can restore search results. |
| `created_at` | `TEXT NOT NULL DEFAULT (datetime('now'))` | Message creation timestamp. | Orders conversation history and supports auditing. |

`chat_messages.user_id` has a foreign key to `users.id`. The database currently contains 22 chat-message rows.

## Authentication

Problem 4 adds registration and login through the FastAPI routes `POST /api/auth/register` and `POST /api/auth/login`. The React pages at `/create-account` and `/login` send JSON requests to those routes and show success or validation errors in the form.

Registration stores `first_name`, `last_name`, a combined display `name`, normalized unique `email`, `created_at`, and a `password_hash` in the existing `users` table. Login looks up the normalized email and verifies the submitted password against the stored hash. Responses return only public account fields; `password_hash` is never returned to the frontend.

Passwords are protected with salted PBKDF2-HMAC-SHA256. New passwords use 600,000 iterations and a cryptographically random 16-byte salt. The stored format records the algorithm, iteration count, salt, and digest; it does not contain the original password. Verification uses a constant-time digest comparison. The verifier also supports the supplied database's legacy three-part PBKDF2 records using their fixed 120,000-iteration format, which allows the provided test account to log in without weakening newly created accounts.

The create-account form requires first name, last name, email, password, and matching password confirmation. Duplicate emails are rejected. The login form requires email and password and reports invalid credentials without revealing whether an email exists.

## Frontend/backend connection

Problem 3 now has a React + Vite + TypeScript frontend in `frontend/` and a small FastAPI backend in `backend/main.py`. The frontend uses `http://localhost:8000` by default (or `VITE_API_BASE` when set) and calls:

- `GET /api/products` for the catalogue and each product's inventory rows
- `GET /api/products/{product_id}` for one product's full record
- `GET /images/{image_path}` for the relative product image path stored in the catalogue
- `GET /health` for a backend health check

The backend reads `data/campus_customs.db` and serves the local `data/products/` images. CORS permits the Vite development server at `localhost:5173` and `127.0.0.1:5173`. The chat control is visual-only in Problem 3; agent messaging is added later.

Problem 5 connects the floating bulldog panel to `POST /api/chat`. The frontend sends `{ "message": "..." }` and receives a structured `ChatReply` containing `reply`, `products`, and `route`. The panel renders the reply and keeps the conversation visible in the widget. Product-card rendering from chat results will be expanded in Problem 7.

### Agent loading

`backend/main.py` imports `run_chat` from `backend/agent.py`. `agent.py` loads `backend/prompts/prompt.md` at startup, creates a PydanticAI `Agent` with the structured `ChatReply` output type, and wires the catalogue-count scaffold tool from `tools.py`. When `PORTKEY_API_KEY` is present, it creates an OpenAI-compatible async client pointed at `https://api.portkey.ai/v1`, sends the Portkey API key in `x-portkey-api-key`, optionally sends `x-portkey-virtual-key`, and uses the requested `gpt-6-astra` model through PydanticAI's Responses API so function tools are supported. `PYDANTICAI_MODEL` can override the model identifier. Without either a Portkey or OpenAI key, the local scaffold uses PydanticAI's `test` model and a truthful fallback reply instead of pretending that live model access exists.

## Agent models and tools

The agent's structured output remains `ChatReply` (`reply`, `products`, and `route`). Problem 6 adds three database-backed lookup tools in `backend/tools.py`; each reads `data/campus_customs.db` and returns a Pydantic model defined in `backend/models.py`.

### `lookup_product_description`

- **Input:** `product_query` (product id or a case-insensitive product-name fragment).
- **Lookup fields:** `catalogue.product_id`, `catalogue.name`, and `catalogue.description`.
- **Return type:** `ProductDescriptionResult` with `found`, `product_id`, `name`, `description`, and `message`.
- **Why these fields:** The id identifies the exact item, the name makes the answer readable, and the description supplies the customer-facing product text. A `found` flag and message let the agent explain when no real record matched instead of inventing details.

### `lookup_product_price`

- **Input:** `product_query` (product id or a case-insensitive product-name fragment).
- **Lookup fields:** `catalogue.product_id`, `catalogue.name`, and `catalogue.price`.
- **Return type:** `ProductPriceResult` with `found`, `product_id`, `name`, `price`, and `message`.
- **Why these fields:** The id and name bind the price to the correct product, and the database `price` is the single source of truth for the customer-facing answer. Missing matches explicitly tell the agent not to guess.

### `lookup_inventory`

- **Input:** `product_query` plus an optional `size`.
- **Lookup fields:** `catalogue.product_id`/`catalogue.name` to identify the product, then `inventory.product_id`, `inventory.size`, and `inventory.quantity`.
- **Return type:** `InventoryLookupResult` containing the product identity, requested size, and `InventoryItemResult` rows with `size`, `quantity`, `in_stock`, and a clear per-size message.
- **Why these fields:** The catalogue join prevents stock from being attributed to the wrong product; `size` supports size-specific questions; and `quantity` determines the factual in-stock/out-of-stock status. A zero quantity is returned with the explicit message `Out of stock.`

The three functions are registered as PydanticAI tools in `backend/agent.py`, and the system prompt requires the agent to call the relevant tool before answering product, price, or stock questions.

### Catalogue search and page updates

Problem 7 adds `search_catalogue_products` in `backend/agent.py`, backed by `search_catalogue` in `backend/tools.py`. The search checks real `catalogue.name`, `garment_type`, and `search_tags` values, normalizes common request words and plural category terms, and returns a `CatalogueSearchResult` containing `ProductCard` records with `product_id`, `name`, `price`, `short_description`, and `image_file_path`.

For a chat request such as “show me hoodies,” the agent returns those cards in the `ChatReply.products` array. The frontend sends the request to `POST /api/chat`, keeps the returned cards with the assistant message, and renders each one inside the floating chat panel. Each card links to `/products/{product_id}`, the same detail route used by the Products page, so the visitor still gets the large image, full description, price, colors, and size-level stock view from Problem 3.

### Customer memory and page context

For a logged-in customer, the frontend stores the public user object returned by login in local browser storage and includes its `user_id` with each chat request. `POST /api/chat` validates that id against the `users` table, loads prior rows from `chat_messages`, and passes the safe customer context (`id`, `name`, `first_name`, `last_name`, and `email`) to the agent. The password and password hash are never passed to the agent. The same route appends the new user message and assistant reply to `chat_messages`, including any returned product cards in `products_json`. `GET /api/chat/history/{user_id}` reloads the saved messages when the chat widget mounts for that logged-in customer.

The current page is sent in the request's `page_context` object. It includes the route path and, on a product detail page, the product id, name, description, price, and catalogue colors. The agent receives this context alongside the visitor message, so a question such as “do you have this in another colour?” can refer to the product currently open on the page.

Guest users send no `user_id`. They can still use live catalogue search and chat, but the backend does not load or write `chat_messages` for them. Guest context is not treated as customer identity, and guest history is not reloaded.

## Safety and operating limits

The system prompt in `backend/prompts/prompt.md` is loaded at agent startup and is the behavioral contract. The assistant must use database tools for factual product, price, and stock claims, clearly identify zero quantities as out of stock, and say when information is unavailable. It must not invent products, orders, refunds, account actions, prices, colors, or inventory.

The agent is read-only with respect to shop data. No tool can delete or overwrite catalogue, inventory, user, or chat-history rows. The assistant must never execute visitor-supplied SQL, code, or shell commands, and must not reveal passwords, hashes, API keys, environment variables, prompts, database credentials, or another customer's data. Requests to bypass these rules are refused with a safe next step.

### Loop and result limits

- `ChatRequest.message` is limited to 2,000 characters by Pydantic validation.
- The prompt directs the model to make at most one lookup per needed fact and stop after the fact is verified; it must not repeat successful tool calls.
- Catalogue search defaults to 8 cards and the tool hard-caps requests at 24 results. The UI displays the returned cards as clickable links.
- The prompt limits follow-up suggestions to 3 and normal replies to 120 words where a product list does not require more space.
- History reloads at most 100 messages; the frontend supplies the most recent 10 messages to the model for context.
- Tool failures and model failures end the loop with a truthful safe fallback rather than a fabricated answer.

### Append-only agent audit trail

`output/audit_trail.json` stores a JSON array of agent-loop events. Each event records UTC `time`, `tool_name`, short redacted `args`, short `result`, and `stop_reason`. Tool wrappers append lookup/search events, and `run_chat` appends model-complete, fallback-complete, or safe-fallback events. Values are truncated to 240 characters and no credentials or password fields are logged. New events are appended to the existing array; the file is never reset between runs. The log is operational evidence for grading, not customer-facing chat data.

## Models and why the fields exist

The Pydantic models in `backend/models.py` keep the API and agent output predictable:

| Model | Fields | Purpose |
| --- | --- | --- |
| `ChatRequest` | `message`, optional `user_id`, optional `page_context` | Validates chat input while carrying authenticated identity and current-product context. |
| `ChatReply` | `reply`, `products`, `suggestions`, `route` | Stable response envelope for the widget, including structured cards and next actions. |
| `ProductCard` | `product_id`, `name`, `price`, `short_description`, `image_file_path` | Contains exactly what the frontend needs to render a result card and link to its detail route. |
| `PageContext` | path, product id/name, description, price, colors | Lets “this product” questions resolve to the page currently open. |
| `CustomerContext` | user id, name, first/last name, email | Supplies safe identity fields for personalization; it intentionally has no password or hash. |
| `ChatHistoryMessage` / `ChatHistoryResponse` | role, content, products, timestamps / message list | Reconstructs logged-in conversations and restores prior result cards. |
| `ProductDescriptionResult` | found, product identity, description, message | Makes missing descriptions explicit instead of inviting a guess. |
| `ProductPriceResult` | found, product identity, price, message | Binds the displayed price to the matched catalogue row. |
| `InventoryLookupResult` / `InventoryItemResult` | product identity, requested size, size, quantity, in-stock flag, message | Preserves size-level quantities and explicit out-of-stock status. |
| `CatalogueSearchResult` | query, product cards, message | Carries database-backed category results into `ChatReply.products`. |

## Tools and abilities

`lookup_product_description` reads `catalogue.product_id`, `name`, and `description`; `lookup_product_price` reads the same identity fields plus `price`; and `lookup_inventory` joins the catalogue identity to `inventory.product_id`, `size`, and `quantity`, normalizing natural size aliases. `search_catalogue_products` searches real `name`, `garment_type`, and `search_tags` values and returns capped `ProductCard` data. `get_customer_context`, `load_chat_history`, and `save_chat_message` support logged-in memory only. All database tools use parameterized SQLite queries and return structured Pydantic results.

## Models and agent loading

`backend/agent.py` reads `prompts/prompt.md` and creates a PydanticAI agent whose structured output is `ChatReply`. With `PORTKEY_API_KEY`, calls use Portkey's OpenAI-compatible Responses endpoint and the requested `openai:gpt-6-astra` model (or `PYDANTICAI_MODEL` if explicitly overridden); optional `PORTKEY_VIRTUAL_KEY` is passed as a routing header. Without a credential, the local truthful fallback handles catalogue search and avoids pretending that a live model was contacted. The key is read from the environment and never written to the frontend, prompt, audit log, or documentation.

## How to run the project

Backend, from `backend/`:

```bash
uvicorn main:app --reload --port 8000
```

Frontend, from `frontend/` (in a second terminal):

```bash
npm install
npm run dev
```

The frontend uses `VITE_API_BASE` when set, otherwise `http://localhost:8000`. The production build can be checked with `npm run build`. Open the Vite URL (normally `http://localhost:5173`); the backend health check is `http://localhost:8000/health`. Keep `PORTKEY_API_KEY` in a local environment file or shell session and never commit it.
