# Campus Customs Shop + Chatbot

MGT 409 Homework 4 workspace.

## Project status

Pre-assignment workspace setup is complete. Implementation will proceed one problem at a time.

## Local data

The assignment data pack is stored under `data/` locally. The database and product images are excluded from Git by `.gitignore`.

## Planned layout

- `frontend/` — React/Vite/TypeScript site
- `backend/` — FastAPI/PydanticAI agent
- `data/` — local assignment data
- `output/` — harness, design, usability, audit, and testing artifacts
- `AI_prompts.md` — running prompt log

## Run commands

Start the backend from `backend/`:

```bash
uvicorn main:app --reload --port 8000
```

In another terminal, start the frontend from `frontend/`:

```bash
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000` by default. Set `VITE_API_BASE` if the backend runs elsewhere.

The requested agent model is configured as `openai:gpt-6-astra` through `PYDANTICAI_MODEL`. A local no-key run uses the PydanticAI test model/fallback so the server can still start; provide the required model credentials to make live model calls.

The public source repository intentionally does not include `data/campus_customs.db` or `data/products/`. Download the assignment data pack separately and place those files under `data/` before using catalogue and image routes. Copy `.env.example` to `.env` and add local credentials when live agent calls are needed.
