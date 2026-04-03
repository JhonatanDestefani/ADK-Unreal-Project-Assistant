# CLAUDE.md — Unreal Guide

## What is this project?

Unreal Guide is a Node.js/Express backend API that provides AI-powered Unreal Engine 5 development assistance. It combines a Botpress-powered conversational AI, a dual knowledge base (engine reference + troubleshooting), C++ project parsing, and Blueprint analysis.

## Tech Stack

- **Runtime:** Node.js (no build step, no transpilation)
- **Framework:** Express.js 5
- **Module System:** CommonJS (`require` / `module.exports`)
- **AI Backend:** Botpress Cloud API (chat, conversations, polling for responses)
- **Language:** JavaScript only (no TypeScript in src/)

## Project Structure

```
src/
├── index.js                  # Express server entry point (port 3000)
├── ai/guide.js               # Botpress AI orchestration — ask, diagnose, review, explain
├── knowledge/
│   ├── index.js              # KB search engine with UE5-aware tokenization & scoring
│   ├── engine-reference/     # 35 JSON files — official UE5 topic documentation
│   └── troubleshooting/      # 8 JSON files — real-world bug fixes & symptoms
├── routes/
│   ├── analyze.js            # POST /api/ask, /api/explain, /api/review, /api/review-blueprint, /api/project-overview, /api/refresh
│   └── diagnose.js           # POST /api/diagnose, /api/kb/search, /api/kb/classify, /api/kb/reload, /api/parse-log; GET /api/kb/categories, /api/kb/entry/:id, /api/kb/stats
└── unreal/
    ├── parser.js             # C++ header/source regex parser (UCLASS, UPROPERTY, UFUNCTION, etc.)
    ├── context.js            # Project context builder with 1-min TTL cache
    └── blueprint.js          # Blueprint JSON analyzer (complexity, suggestions)
```

## Running the Project

```bash
npm start        # production: node src/index.js
npm run dev      # development: node --watch src/index.js
```

Requires `.env` with: `BOTPRESS_BOT_ID`, `BOTPRESS_PAT`, `BOTPRESS_INTEGRATION_ID`, `PORT` (default 3000).

## Key Patterns

- **Async/await** throughout for Botpress API calls and route handlers.
- **In-memory caching:** project parse results (1-min TTL in `context.js`), KB loaded once at startup, conversation map per project path in `guide.js`.
- **Knowledge base search:** tokenization normalizes text, expands UE5 class prefixes (A/U/F/E/I → both prefixed and bare forms), scores matches across title (+15), symptoms (+8), related classes (+7), tags (+5), description (+2).
- **C++ parsing:** regex-based extraction of UCLASS, USTRUCT, UENUM, UPROPERTY, UFUNCTION, includes, and forward declarations.
- **Context enrichment:** every AI request is enriched with parsed project context and relevant KB entries before being sent to Botpress.
- **Guard clauses in AI:** off-topic detection keeps responses focused on Unreal Engine.

## Knowledge Base JSON Schemas

**Engine reference entries** have: `id`, `title`, `whatItIs`, `description`, `whenToUse`, `whenNotToUse`, `keyPoints`, `relatedClasses`, `commonMistakes`, `goodPractices`, `codeExample`, `lifecycle`, `tags`.

**Troubleshooting entries** have: `id`, `title`, `symptoms`, `description`, `rootCause`, `solution`, `codeExample`, `tags`.

## Conventions

- Files and folders: lowercase, no hyphens in module names (except KB JSON files).
- Functions: camelCase.
- Environment variables: UPPER_SNAKE_CASE.
- No linting/formatting config — keep style consistent with existing code.
- No tests currently exist.
- No frontend — this is a pure API backend.

## When Editing

- Route handlers validate required body params with early `400` returns.
- The Botpress polling loop in `guide.js` retries 120 times at 500ms intervals — be careful modifying timeout logic.
- KB JSON files follow strict schemas — always match the existing field structure when adding entries.
- The parser uses regex, not an AST — it handles common UE5 macro patterns but not arbitrary C++.
