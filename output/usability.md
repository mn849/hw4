# Problem 9 — Usability Improvements

This document records the four improvements planned for and implemented in the Campus Customs app.

## Front-end improvements

### 1. Catalogue search and category filters

**What I added:** The Products page has a clear search field and category filter buttons. The product grid updates immediately, shows the number of matching products, and provides a clear no-results message with a reset action.

**Why it helps:** Shoppers can narrow a large catalogue quickly instead of scanning every product. The business gets a clearer path from browsing to a relevant product detail page.

### 2. Better loading, error, and empty states

**What I added:** Product loading, API errors, empty search results, and a reset path are presented as intentional, readable states rather than blank space.

**Why it helps:** Shoppers understand whether the catalogue is loading, whether a search needs changing, or whether the service needs attention. Clear states reduce confusion and support recovery.

## Agent/backend improvements

### 3. Natural size aliases and honest availability messages

**What I added:** The inventory tool accepts common size words such as “small,” “medium,” “large,” and “extra large,” maps them to the database sizes, and returns a clear size-specific out-of-stock message when quantity is zero.

**Why it helps:** Shoppers can ask naturally without knowing the database abbreviations. Accurate out-of-stock wording prevents false expectations and protects the business from promising unavailable items.

### 4. Structured next-step suggestions in chat replies

**What I added:** Chat replies can include structured follow-up suggestions such as browsing products, checking another size, or asking about price. The chat panel renders them as clickable message actions that submit the suggestion.

**Why it helps:** Shoppers get an obvious next step after a short answer or no-match result. The business benefits from smoother discovery and fewer abandoned conversations.

## Verification

Each improvement will be checked in the running app: filters and states on the Products page, size aliases through the chat/backend, and clickable suggestions in the chat panel.
