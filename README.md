# Nuclear Mentor

An AI-powered tutor for nuclear engineering fundamentals. Ask questions, get rigorous answers with full LaTeX equation rendering, and build up a conversation history across multiple sessions.

---

## Features

- Streaming AI responses powered by Claude (claude-opus-4-7)
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
| AI | Anthropic C# SDK v12.20.0 (`claude-opus-4-7`, SSE streaming) |
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
- An [Anthropic API key](https://console.anthropic.com/)

### 1 — Configure the API key

Copy the template and fill in your secrets:

```bash
cp backend/appsettings.template.json backend/appsettings.json
```

Then edit `backend/appsettings.json`:

```json
{
  "Claude": { "ApiKey": "sk-ant-..." },
  "Jwt":    { "Key": "a-long-random-secret-32-chars-minimum" }
}
```

> `appsettings.json` is in `.gitignore` — your secrets stay local. Never commit it.

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
| `Claude:ApiKey` | `backend/appsettings.json` | Anthropic API key |
| `Jwt:Key` | `backend/appsettings.json` | JWT signing secret |
| `ConnectionStrings:Default` | `backend/appsettings.json` | SQLite connection string |

---

## Notes for AI Assistants

- **Next.js version**: 16.2.x — breaking changes from v14/v15 apply. Read `frontend/node_modules/next/dist/docs/` before editing routing or middleware.
- **Middleware**: uses `proxy.ts` / `export function proxy(...)` — the `middleware.ts` / `middleware` convention is deprecated in this version.
- **Tailwind**: v4 with `@theme` directive in `globals.css` — no `tailwind.config.js`.
- **Anthropic SDK**: C# SDK v12.20.0. Streaming uses `anthropic.Messages.CreateStreaming()` → `IAsyncEnumerable<RawMessageStreamEvent>` → `TryPickContentBlockDelta` → `TryPickText`.
- **JWT claims**: username is at `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` inside the token payload.
- **Database**: SQLite file `backend/nuclearmentor.db` — not committed. Migrations are in `backend/Migrations/`.
- **Auth flow**: register/login → JWT in cookie `nm_token` (readable by both `proxy.ts` server-side and `lib/api.ts` client-side) → username decoded from JWT claims as fallback if localStorage is stale.
