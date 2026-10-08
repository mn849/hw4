# Campus Customs Shop + Chatbot

MGT 409 Homework 4 workspace.

## Project status

Pre-assignment workspace setup is complete. Implementation will proceed one problem at a time.

## Local data

The assignment data pack is excluded from Git by `.gitignore`. After downloading it, place the files at these exact paths:

```text
data/campus_customs.db
data/products/<product-image-files>.jpg
```

The backend reads the SQLite database and image directory from those paths.

## Planned layout

- `frontend/` — React/Vite/TypeScript site
- `backend/` — FastAPI/PydanticAI agent
- `data/` — local assignment data
- `output/` — harness, design, usability, audit, and testing artifacts
- `AI_prompts.md` — running prompt log

## Run the application

After placing the data pack, optionally configure live model access from the project root:

```bash
cp .env.example .env
# edit .env and set PORTKEY_API_KEY
```

Start the backend in one terminal:

```bash
cd backend
python -m pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`. The frontend expects FastAPI at `http://localhost:8000` by default; set `VITE_API_BASE` before starting Vite if the backend runs elsewhere. Check `http://localhost:8000/health` to confirm the backend is running.

To verify the frontend production build:

```bash
cd frontend
npm run build
```

The requested agent model is configured as `openai:gpt-6-astra` through `PYDANTICAI_MODEL`. A local no-key run uses the PydanticAI test model/fallback so the server can still start; provide the required model credentials to make live model calls.

The public source repository intentionally does not include `data/campus_customs.db` or `data/products/`. Download the assignment data pack separately and place those files under `data/` before using catalogue and image routes. Copy `.env.example` to `.env` and add local credentials when live agent calls are needed.
