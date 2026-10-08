# AI Prompts — Homework 4

This running log records the prompts I write while completing each problem.

## Problem 1: Vibe coder prompts
- Initial prompt: "Create AI_prompts.md to document how I am using the AI assistant today. Each problem that I work on today will have its own section in the log. Each section will contain: (1) the problem number and title, (2) the prompt that I use, (3) any follow-up prompts, if I use any, and (4) a sentence explaining why I used a follow-up prompt, if I use one."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt fully specified the required log structure.

## Problem 2: Analyze the database
- Initial prompt: "I want to understand the data before I build the application, so inspect data/campus_customs.db and document the catalogue, inventory, and users. Start the output/harness.md file. Record each table and its fields in this file, as well as what the field means and why it matters to the store or chatbot. Stop when you are done with Problem 2."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the tables, documentation location, required explanations, and stopping point.

## Problem 3: Build the Campus Customs website
- Initial prompt: "For Problem 3, build a basic React + Vite + TypeScript Campus Customs storefront. Add a top navigation bar linking to Home, Products, About Us, Login, and Create Account. The Products page should load catalogue image paths and basic product information from the database; clicking a product should open a single-item page with a large image, full description, price, sizes, and stock when available. Add a visual-only floating bulldog holding a telephone in the bottom-right corner. Use FastAPI in backend/main.py to serve products and images; this will become the agent backend in Problem 5."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the pages, product behavior, chat-widget scope, backend routes, and stopping point.

## Problem 4: Create account and login
- Initial prompt: "For Problem 4, set up account creation and login. Add a Create Account page with first name, last name, email, password, and password confirmation, requiring the confirmation to match. Store new accounts in the existing users table and protect passwords so they are never stored in plaintext. Add a Login page for registered email and password. Test the supplied test account and a brand-new account, then update output/harness.md to explain what user data is stored and how passwords are protected. Stop when Problem 4 is complete."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the form fields, validation, storage, security requirement, tests, documentation, and stopping point.

## Problem 5: PydanticAI agent backend
- Initial prompt: "For Problem 5, create the chatbot architecture under backend/: prompts/prompt.md for the system prompt, agent.py for PydanticAI wiring, models.py for structured chat replies and product cards, tools.py for callable tools, and main.py as the Uvicorn FastAPI app. Expose a chat endpoint that accepts a message and returns an agent reply while preserving the existing product and auth routes. Put the initial Campus Customs voice, store behavior, claim limits, and unavailable-information behavior in prompt.md. Connect the front-end floating chat widget to the endpoint. Document the frontend-to-FastAPI connection, prompt loading, and model configuration in output/harness.md. Make `uvicorn main:app --reload --port 8000` work from backend/ and stop after Problem 5."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the files, architecture, endpoint, behavior, frontend connection, documentation, run command, and stopping point.

## Problem 6: Product information and stock tools
- Initial prompt: "For Problem 6, give the agent SQLite-backed tools that look up the real product description, product price, and inventory levels from data/campus_customs.db, including size-specific inventory when requested. The tools must not invent values and must clearly report out-of-stock results. Update prompts/prompt.md so the agent calls these tools for price and stock questions, add structured return types in models.py, and document each tool, its lookup fields, and why those fields are used in output/harness.md. Stop when Problem 6 is complete."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the tools, database source, return types, prompt changes, documentation, and stopping point.

## Problem 7: Chat search that updates the page
- Initial prompt: "For Problem 7, add catalogue search so category or product questions are searched against the real catalogue and return structured product results. When a visitor asks something like 'show me hoodies', render matching product cards in the chat or page area with image, name, price, and short information. Each result must link to the Problem 3 detail route with the large image and full product information. Update prompts/prompt.md and output/harness.md to explain how search results reach the frontend, then stop after Problem 7."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the search source, structured result behavior, card fields, detail links, documentation, and stopping point.

## Problem 8: Customer memory
- Initial prompt: "For Problem 8, add customer memory so the agent can save and reload chat history for logged-in users, identify the customer by name and email, and understand the current page context. Add backend tools and routes that store chat messages only when a valid logged-in user is supplied, reload that user's history when they return, and pass customer fields and current product context to the agent. If a visitor asks about 'this' on a product page, the agent should use that product context. Update output/harness.md to document history storage, customer fields passed to the agent, page-context transmission, and the difference between guests and logged-in users."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified persistence rules, identity context, page context, documentation, and guest behavior.

## Problem 9: Usability improvements
- Initial prompt: "For Problem 9, choose and implement two front-end usability improvements and two agent/backend usability improvements for the working Campus Customs shop. Write output/usability.md before or as the work is built, and for each improvement explain what was added and why it helps a Campus Customs shopper or the business. Make sure all four improvements are visible and working in the running app."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the number and type of improvements, required documentation, user/business rationale, and verification requirement.

## Problem 10: Style the website
- Initial prompt: "For Problem 10, style the Campus Customs site with a Yale-inspired design system that is focused on a Powerpuff Girls-inspired theme. Keep Yale navy as the foundation and use pink, blue, and green character accents. Add an interactive front-end battle game with Blossom, Bubbles, and Buttercup-style characters; let a visitor choose attacks, win against an opponent, and receive a visible merch discount code when they win. Document the visual changes, interaction, and customer value in output/design.md, then stop after Problem 10."
- Follow-up prompt: None used.
- Reason for follow-up: Not applicable; the initial prompt specified the theme, interaction, reward behavior, documentation, and stopping point.

## Problem 11: Site testing
- Initial prompt:
- Follow-up prompt (if needed):
- What was missing after the first prompt:

## Problem 12: Audit trail, safety, and harness
- Initial prompt:
- Follow-up prompt (if needed):
- What was missing after the first prompt:

## Problem 13: GitHub submission
- Initial prompt:
- Follow-up prompt (if needed):
- What was missing after the first prompt:
