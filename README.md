# Nuclear Mentor

An AI-powered tutor for nuclear engineering fundamentals. Ask questions, get rigorous answers with full LaTeX equation rendering, and build up a conversation history across multiple sessions.

---

## Features

- Streaming AI responses — Claude (claude-opus-4-7) or local Ollama model, switchable via config
- LaTeX equation rendering via KaTeX — inline `$...$` and display `$$...$$`
- Markdown support (headers, lists, code blocks, bold/italic)
- Multi-session chat with auto-named sessions (date + time + topic)
- User authentication (register / login) with JWT
- Soviet constructivist UI — Bebas Neue headings, crimson/khaki/slate palette
- Starter prompt cards for common nuclear engineering topics

---

## Tech Stack

### Backend — `backend/`
| | |
|---|---|
| Runtime | .NET 8 / ASP.NET Core 8 |
| Language | C# 12 |
| AI | Anthropic C# SDK v12.20.0 (`claude-opus-4-7`) **or** Ollama HTTP API (local models) |
| Database | SQLite via Entity Framework Core 8 |
| Auth | JWT Bearer tokens (BCrypt password hashing) |
| API docs | Swagger / Swashbuckle |

### Frontend — `frontend/`
| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme` design tokens) |
| Markdown | `react-markdown` + `remark-math` + `rehype-katex` + `katex` |
| Fonts | Bebas Neue, Space Grotesk, JetBrains Mono (Google Fonts) |
| Auth | JWT stored in browser cookie (`nm_token`); username from JWT claims |

---

## Project Structure

```
E:/ai-mentor/
├── backend/
│   ├── Controllers/
│   │   ├── AuthController.cs       # POST /api/auth/register, /login
│   │   ├── SessionsController.cs   # CRUD for chat sessions
│   │   └── MessagesController.cs   # POST /api/sessions/{id}/messages (SSE stream)
│   ├── Services/
│   │   ├── MentorService.cs        # Calls Claude, streams tokens
│   │   ├── OllamaMentorService.cs  # Calls local Ollama, streams tokens
│   │   └── SystemPrompt.txt        # Edit this to change the AI's behaviour
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Models/
│   ├── Migrations/
│   ├── appsettings.json            # Connection string + Claude API key
│   └── NuclearMentor.API.csproj
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Fonts + KaTeX CSS
│   │   ├── globals.css             # Tailwind @theme tokens
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── chat/
│   │       ├── page.tsx            # Main state orchestrator
│   │       └── _components/
│   │           ├── Sidebar.tsx     # Session list + user info
│   │           ├── ChatArea.tsx    # Message list + input
│   │           ├── MessageBubble.tsx # Markdown + LaTeX rendering
│   │           └── EmptyState.tsx  # Starter prompt cards
│   ├── lib/
│   │   └── api.ts                  # All API calls + token/username helpers
│   ├── proxy.ts                    # Route protection (Next.js middleware)
│   └── .env.local                  # NEXT_PUBLIC_API_URL
├── NuclearMentor.sln
└── .gitignore
```

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- An [Anthropic API key](https://console.anthropic.com/) **or** a locally running [Ollama](https://ollama.com/) instance

### 1 — Configure the backend

Copy the template and fill in your settings:

```bash
cp backend/appsettings.template.json backend/appsettings.json
```

**Option A — Claude (default):**

```json
{
  "AI": { "Provider": "claude" },
  "Claude": { "ApiKey": "sk-ant-..." },
  "Jwt": { "Key": "a-long-random-secret-32-chars-minimum" }
}
```

**Option B — Ollama (local model, no API key needed):**

```json
{
  "AI": {
    "Provider": "ollama",
    "Ollama": {
      "BaseUrl": "http://localhost:11434",
      "Model": "qwen3:latest",
      "Think": false
    }
  },
  "Jwt": { "Key": "a-long-random-secret-32-chars-minimum" }
}
```

> `appsettings.json` is in `.gitignore` — your secrets stay local. Never commit it.

> **Ollama — thinking mode:** Set `AI:Ollama:Think` to `true` for models that support extended reasoning (Qwen3, DeepSeek-R1, etc.). When enabled, thinking tokens are streamed alongside the response. Leave it `false` (the default) to suppress the thinking phase and get faster, incremental token streaming.

### 2 — Run the backend

```bash
cd backend
dotnet run --urls http://localhost:5100
```

The database (`nuclearmentor.db`) is created and migrated automatically on first run.  
Swagger UI is available at `http://localhost:5100/swagger`.

### 3 — Run the frontend

```bash
cd frontend
npm install
npm run dev
```

App is available at `http://localhost:3000`.

---

## Customising the AI

Edit `backend/Services/SystemPrompt.txt` — no recompile needed, just restart the backend. The file is loaded once at startup.

Current scope: nuclear physics, reactor design, radiation protection, fuel cycle, thermal hydraulics, instrumentation.

---

## SSE Streaming Protocol

The backend streams Claude's response as Server-Sent Events:

```
data: {"chunk":"Nuclear"}\n\n
data: {"chunk":" fission"}\n\n
...
event: done\ndata: {}\n\n
```

The frontend reads this with a `ReadableStream` + `TextDecoder` in `lib/api.ts → sendMessage()`.

---

## Environment Variables

| Variable | File | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Backend base URL (default `http://localhost:5100`) |
| `AI:Provider` | `backend/appsettings.json` | `"claude"` (default) or `"ollama"` |
| `Claude:ApiKey` | `backend/appsettings.json` | Anthropic API key (required when provider is `claude`) |
| `AI:Ollama:BaseUrl` | `backend/appsettings.json` | Ollama base URL (default `http://localhost:11434`) |
| `AI:Ollama:Model` | `backend/appsettings.json` | Ollama model name (default `llama3.2`) |
| `AI:Ollama:Think` | `backend/appsettings.json` | Enable thinking mode for Qwen3/DeepSeek-R1 (default `false`) |
| `Jwt:Key` | `backend/appsettings.json` | JWT signing secret |
| `ConnectionStrings:Default` | `backend/appsettings.json` | SQLite connection string |

---

## Ollama Setup (quick reference)

```bash
# Install a model
ollama pull qwen3:latest

# Ollama runs on http://localhost:11434 by default — no extra config needed
# Set AI:Provider = "ollama" in appsettings.json and restart the backend
```

Tested with: `qwen3:latest`, `qwen3.5`, `llama3.2`, `deepseek-r1`.

---

## Notes for AI Assistants

- **Next.js version**: 16.2.x — breaking changes from v14/v15 apply. Read `frontend/node_modules/next/dist/docs/` before editing routing or middleware.
- **Middleware**: uses `proxy.ts` / `export function proxy(...)` — the `middleware.ts` / `middleware` convention is deprecated in this version.
- **Tailwind**: v4 with `@theme` directive in `globals.css` — no `tailwind.config.js`.
- **AI provider**: selected at startup via `AI:Provider`. Both providers implement `IMentorService` and return `IAsyncEnumerable<string>`. `MentorService` uses the Anthropic C# SDK v12.20.0 (`CreateStreaming()` → `TryPickContentBlockDelta` → `TryPickText`). `OllamaMentorService` calls the Ollama `/api/chat` endpoint with `stream: true` and parses newline-delimited JSON chunks.
- **Ollama thinking mode**: Qwen3 and DeepSeek-R1 models enable thinking by default in Ollama, which causes `message.content` to be empty during the think phase. The service passes `options: { think: false }` unless `AI:Ollama:Think` is `true`. When think is enabled, thinking tokens come from `message.thinking` and are streamed alongside content.
- **JWT claims**: username is at `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` inside the token payload.
- **Database**: SQLite file `backend/nuclearmentor.db` — not committed. Migrations are in `backend/Migrations/`.
- **Auth flow**: register/login → JWT in cookie `nm_token` (readable by both `proxy.ts` server-side and `lib/api.ts` client-side) → username decoded from JWT claims as fallback if localStorage is stale.
