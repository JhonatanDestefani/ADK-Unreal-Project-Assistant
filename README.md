# Unreal Guide

An AI-powered backend API that helps Unreal Engine 5 developers understand engine systems, troubleshoot problems, review C++ code, and learn architectural patterns. Built with Node.js, Express, and Botpress Cloud AI.

Unreal Guide is not a generic chatbot — it **parses your actual UE5 project**, enriches every question with a curated knowledge base, and gives context-aware answers. It understands your classes, inheritance chains, properties, and functions before answering.

## What It Does

### AI-Powered Assistance
- **Ask questions** about Unreal Engine with your project as context
- **Diagnose problems** by describing symptoms or pasting log output
- **Review C++ code** for UE5 best practices, performance, and common pitfalls
- **Review Blueprints** exported as JSON for complexity and improvement suggestions
- **Explain classes** in the context of your project's architecture

### Knowledge Base (211 entries, 486+ UE5 classes)
A dual knowledge base built from real UE5 development experience:

**Engine Reference (42 categories, 132 entries)** — Documentation on UE5 systems:
- Core Classes, Gameplay Framework, GAS, Enhanced Input, Replication, Animation
- AI Systems, Collision & Physics, Materials & Rendering, UMG & Slate UI
- Containers, Timers & Delegates, World Partition, Niagara, PCG, and more

**Troubleshooting (9 categories, 79 entries)** — Real-world bugs and fixes:
- Crashes & Fatal Errors, Build & Deployment, Performance
- AI / Behavior, Input / Controls, Networking, UI / Widgets
- GAS-specific issues (abilities not activating, effects not applying, attribute replication)

**Architectural Patterns (7 entries)** — Mental blueprints for structuring systems:
- Health & Damage System
- Inventory System
- Interaction System (Press E)
- Ability System (GAS path)
- Lightweight Ability System (without GAS)
- AI Enemy (Behavior Tree + Perception)
- HUD & UI Architecture

Each pattern gives you the structure to follow, what to avoid, good practices, and a code example as a starting point — not a copy-paste solution, but a map.

### C++ Project Parsing
- Scans your UE5 project's `Source/` directory
- Extracts UCLASS, USTRUCT, UENUM, UPROPERTY, UFUNCTION declarations
- Builds inheritance chains and detects class relationships
- Links header and source files
- Results are cached with a 1-minute TTL for performance

### Blueprint Analysis
- Analyzes Blueprint data exported as JSON from the Unreal Editor
- Calculates complexity (node count, branches, loops)
- Detects patterns like expensive operations inside Tick
- Generates improvement suggestions

## API Endpoints

### AI Endpoints (require Botpress)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ask` | Ask a question with project context |
| POST | `/api/explain` | Explain a specific class |
| POST | `/api/review` | Review C++ code |
| POST | `/api/review-blueprint` | Review a Blueprint (JSON export) |
| POST | `/api/diagnose` | Diagnose a problem with KB + AI |

### Knowledge Base Endpoints (no Botpress needed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kb/search` | Search the knowledge base |
| POST | `/api/kb/classify` | Classify a problem into categories |
| POST | `/api/kb/reload` | Reload KB from disk |
| GET | `/api/kb/categories` | List all categories |
| GET | `/api/kb/entry/:id` | Get a specific entry by ID |
| GET | `/api/kb/stats` | Get KB statistics |

### Project Endpoints (no Botpress needed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/project-overview` | List all classes in a project |
| POST | `/api/class-map` | Get parsed class map (full or per-class) |
| POST | `/api/refresh` | Force refresh project cache |
| POST | `/api/parse-log` | Parse UE5 log text for errors/warnings |

## Setup

### Prerequisites
- Node.js 18+
- A [Botpress Cloud](https://botpress.com/) account (for AI endpoints)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/unreal-guide.git
cd unreal-guide
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
BOTPRESS_BOT_ID=your_bot_id
BOTPRESS_PAT=your_personal_access_token
BOTPRESS_INTEGRATION_ID=your_integration_id
PORT=3000
```

**Getting Botpress credentials:**
1. Create a bot on [Botpress Cloud](https://app.botpress.cloud/)
2. Go to your bot's settings to find the **Bot ID**
3. Generate a **Personal Access Token** (PAT) in your account settings
4. The **Integration ID** is found in the bot's API configuration

### Run

```bash
# Production
npm start

# Development (auto-reload on file changes)
npm run dev
```

You should see:
```
Knowledge Base loaded:
  Engine Reference: 42 categories, 132 entries
  Troubleshooting: 9 categories, 79 entries
Unreal Guide running on port 3000
```

### Verify

```bash
curl http://localhost:3000/
```

Should return the server status and KB stats.

## Usage Examples

### Ask a Question
```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "C:/Projects/MyGame",
    "question": "What is the difference between GameMode and GameState?"
  }'
```

### Search the Knowledge Base
```bash
curl -X POST http://localhost:3000/api/kb/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "how to build an inventory system",
    "limit": 3
  }'
```

### Diagnose a Problem
```bash
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "problemDescription": "My ability is not activating when I press the key",
    "projectPath": "C:/Projects/MyGame"
  }'
```

### Get Class Map
```bash
curl -X POST http://localhost:3000/api/class-map \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "C:/Projects/MyGame",
    "className": "AMyCharacter"
  }'
```

### Parse a UE5 Log
```bash
curl -X POST http://localhost:3000/api/parse-log \
  -H "Content-Type: application/json" \
  -d '{
    "logText": "LogTemp: Error: Failed to find ability system component\nLogTemp: Warning: Tick running expensive operation"
  }'
```

## Integrating with Unreal Engine

Unreal Guide is a REST API — any HTTP client inside Unreal can talk to it. Here are the main approaches:

### Option 1: Unreal Editor Plugin (C++)

Create an Editor Utility Widget or a plugin that makes HTTP requests to the API. UE5 has built-in HTTP support:

```cpp
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"

void UMyEditorWidget::AskGuide(const FString& Question)
{
    FHttpModule& Http = FHttpModule::Get();
    TSharedRef<IHttpRequest> Request = Http.CreateRequest();

    Request->SetURL("http://localhost:3000/api/ask");
    Request->SetVerb("POST");
    Request->SetHeader("Content-Type", "application/json");

    // Build JSON body
    TSharedPtr<FJsonObject> Body = MakeShared<FJsonObject>();
    Body->SetStringField("projectPath", FPaths::ProjectDir());
    Body->SetStringField("question", Question);

    FString BodyString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&BodyString);
    FJsonSerializer::Serialize(Body.ToSharedRef(), Writer);

    Request->SetContentAsString(BodyString);
    Request->OnProcessRequestComplete().BindUObject(this, &UMyEditorWidget::OnResponseReceived);
    Request->ProcessRequest();
}

void UMyEditorWidget::OnResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
{
    if (bSuccess && Response.IsValid())
    {
        FString ResponseBody = Response->GetContentAsString();
        // Parse JSON and display the answer
    }
}
```

### Option 2: Python Script (Editor Utility)

UE5 supports Python scripting. You can call the API from a Python editor script:

```python
import unreal
import json
import urllib.request

def ask_guide(question):
    url = "http://localhost:3000/api/ask"
    data = json.dumps({
        "projectPath": unreal.Paths.project_dir(),
        "question": question
    }).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        unreal.log(result["answer"])
        return result["answer"]

# Usage in the editor's Python console:
# ask_guide("When should I use ActorComponent instead of inheriting from AActor?")
```

### Option 3: Blueprint (with VaRest or HTTP plugin)

If you prefer Blueprints, use a plugin like [VaRest](https://www.unrealengine.com/marketplace/en-US/product/varest-plugin) to make HTTP calls from Blueprint nodes. Point it to `http://localhost:3000/api/` endpoints and parse the JSON response.

### What the API Needs from Your Project

For project-aware features (`/api/ask`, `/api/explain`, `/api/review`, `/api/class-map`), send the `projectPath` — the root of your UE5 project (the folder containing the `.uproject` file). The API scans `Source/` for C++ files.

For Blueprint review (`/api/review-blueprint`), export the Blueprint graph as JSON from the editor. The expected format:

```json
{
  "name": "BP_MyActor",
  "parentClass": "AActor",
  "graphs": [
    {
      "name": "EventGraph",
      "nodes": [
        { "type": "Event", "name": "BeginPlay", "pins": [], "connections": [] },
        { "type": "FunctionCall", "name": "PrintString", "pins": [] }
      ]
    }
  ],
  "variables": [
    { "name": "Health", "type": "float", "defaultValue": "100.0", "category": "Stats" }
  ],
  "components": [
    { "name": "RootComponent", "class": "USceneComponent" },
    { "name": "MeshComp", "class": "UStaticMeshComponent" }
  ]
}
```

## Project Structure

```
src/
├── index.js                  # Express server entry point (port 3000)
├── ai/guide.js               # Botpress AI orchestration — ask, diagnose, review, explain
├── knowledge/
│   ├── index.js              # KB search engine with UE5-aware tokenization & scoring
│   ├── engine-reference/     # 42 JSON files — UE5 documentation + architectural patterns
│   └── troubleshooting/      # 9 JSON files — real-world bug fixes & symptoms
├── routes/
│   ├── analyze.js            # /api/ask, /api/explain, /api/review, /api/review-blueprint, /api/project-overview, /api/refresh, /api/class-map
│   └── diagnose.js           # /api/diagnose, /api/kb/*, /api/parse-log
└── unreal/
    ├── parser.js             # C++ header/source regex parser
    ├── context.js            # Project context builder with caching
    └── blueprint.js          # Blueprint JSON analyzer
```

## How the Knowledge Base Works

The KB uses a weighted token-matching search — not just keyword lookup:

- Queries are tokenized and normalized
- UE5 class prefixes are expanded (`ACharacter` matches both `acharacter` and `character`)
- Matches are scored by field: title (+15), symptoms (+8), related classes (+7), tags (+5), description (+2)
- Results include source attribution (engine reference vs troubleshooting)

This means asking "my character falls through the floor" will find collision and physics entries even without exact keyword matches.

## Contributing to the Knowledge Base

### Adding Engine Reference Entries

Create or edit a JSON file in `src/knowledge/engine-reference/`:

```json
{
  "category": "my-category",
  "displayName": "My Category",
  "description": "What this category covers",
  "entries": [
    {
      "id": "ref_mycat_001",
      "title": "Entry Title",
      "description": "What this entry is about",
      "whatItIs": "A clear explanation",
      "whenToUse": ["Scenario 1", "Scenario 2"],
      "whenNotToUse": ["Anti-scenario 1"],
      "relatedClasses": ["UMyClass", "AMyActor"],
      "commonMistakes": ["Mistake 1"],
      "goodPractices": ["Practice 1"],
      "keyPoints": ["Point 1", "Point 2"],
      "codeExample": "// C++ code here",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### Adding Troubleshooting Entries

Create or edit a JSON file in `src/knowledge/troubleshooting/`:

```json
{
  "category": "my-category",
  "displayName": "My Category",
  "description": "What problems this covers",
  "entries": [
    {
      "id": "mycat_001",
      "title": "Problem Title",
      "symptoms": ["symptom 1", "symptom 2"],
      "ueVersions": ["5.0", "5.1", "5.2", "5.3", "5.4"],
      "description": "What the problem is",
      "rootCause": "Why it happens",
      "solution": ["Step 1", "Step 2"],
      "codeExample": "// Fix example",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

After adding entries, call `POST /api/kb/reload` or restart the server.

## License

ISC
