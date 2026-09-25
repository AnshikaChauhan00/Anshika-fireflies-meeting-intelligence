# Meeting Notes & Transcription Platform

A Fireflies.ai-inspired meeting intelligence workspace: browse a library of meetings, watch a synced transcript follow playback, search inside transcripts, review AI-style summaries/topics, and manage action items — all backed by a real FastAPI + SQLite backend.

Built by **Anshika Chauhan**.

---

## Overview

This is a full-stack application, not a static mockup. The Next.js frontend talks to a FastAPI backend over a REST API; the backend persists everything (meetings, transcripts, summaries, topics, action items) in SQLite via SQLAlchemy. Refreshing the browser never loses data — it's all coming from the database.

Because real speech-to-text and live meeting bots are out of scope for this project, transcripts are seeded, pasted, or uploaded (`.txt` / `.vtt` / `.json`), and the media player is a **controlled mock player**: it advances a `currentTime` value on a timer instead of decoding a real audio file. Every other part of the experience — click-to-seek, active-segment highlighting, search — behaves exactly as it would against a real recording, and the whole thing is swappable for a real `<audio>` element later (see [Future Improvements](#future-improvements)).

---

## Features

**Meeting library**
- Browse, search (title/description/participant), filter by tag or date range, and sort (recent/oldest/duration)
- Paginated grid of meeting cards with participant avatars, tags, and action-item counts

**Meeting detail**
- Header with date, duration, participants, tags, and an edit/delete menu
- Simulated media player: play/pause, seek bar (click + drag), skip ±10s, volume
- Interactive transcript: speaker labels, timestamps, click-to-seek, active-segment highlight synced to playback, auto-scroll
- In-transcript search with match count and prev/next navigation, matches highlighted in yellow
- **Export Transcript**: seamlessly export the currently loaded meeting transcript (with accurate speaker labels and timestamps) to **PDF** or **Markdown (.md)** directly from the UI.
- Summary panel (overview), key topics/chapters (click to jump), and action items
- **Comments on transcript lines** (bonus): add, edit and delete comments on any line, with a comment count on each line and threads that persist in SQLite
- **Ask about this meeting** (bonus): a chat that answers questions from the transcript and links each answer to the moments it came from (click a source to jump the player there). Uses Groq when `GROQ_API_KEY` is set; without a key it still works using keyword search

**Action items**
- Full CRUD: create, edit, delete, and complete/reopen, with status (`TODO` / `IN_PROGRESS` / `COMPLETED`)

**Meeting CRUD**
- Create via modal: title, description, date, participants, tags, and a transcript — pasted (TXT/VTT/JSON) or uploaded as a file
- On creation, the transcript is parsed, normalized into segments, and a summary/topics/action items are generated automatically
- Edit metadata; delete with a confirmation dialog and cascading removal of transcript/summary/topics/action items

**Global search**
- One search box across meeting titles, transcript text, and action items, grouped by result type

**Workspace polish**
- Toast notifications (no `alert()`), loading skeletons, empty states, collapsible sidebar, functional dark mode, and "Coming Soon" placeholders for integrations/auth that are explicitly out of scope

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js (App Router) + TypeScript | File-based routing, React Server/Client Components, industry-standard for React apps |
| Server state | TanStack Query | Caching, invalidation, and loading/error states without hand-rolled `useEffect` fetching |
| Styling | Tailwind CSS | Fast to build a consistent, polished UI without a heavy component library |
| Icons | lucide-react | Clean, tree-shakeable icon set |
| Backend framework | FastAPI | Async-ready, automatic OpenAPI docs, first-class Pydantic integration |
| ORM | SQLAlchemy 2.0 | Explicit, typed models; no magic; easy to explain relationships |
| Validation | Pydantic | Schema validation at the API boundary, separate from DB models |
| Database | SQLite | Zero-setup, file-based, perfect for a project that must "just work" after `git clone` |
| LLM (optional) | Groq (`groq` Python SDK) | Powers the "Ask about this meeting" chat when an API key is configured; the app is fully functional without it |

No state management library beyond React state + TanStack Query, no CSS-in-JS, no GraphQL, no auth framework — deliberately, so every choice is easy to defend in an interview.

---

## Architecture

```
Frontend (Next.js, client components)
   │  fetch() via services/*.ts (a thin typed API client)
   ▼
FastAPI routes            app/api/routes/*.py
   │  Pydantic request/response schemas
   ▼
Service layer             app/services/*.py      (business logic: parsing, summary generation, CRUD orchestration)
   │
   ▼
Repository layer          app/repositories/*.py  (SQLAlchemy queries only — no business logic)
   │
   ▼
SQLAlchemy models         app/models/*.py
   │
   ▼
SQLite                    meetings.db
```

Each layer has one job:
- **Routes** only translate HTTP ↔ Pydantic schemas and map domain exceptions to HTTP status codes.
- **Services** hold the actual logic (e.g. "creating a meeting also parses a transcript and generates a summary").
- **Repositories** are the only place that touches a SQLAlchemy `Session` directly.

This mirrors the frontend's own separation: **pages** (route components) → **hooks** (`useMeetings`, `useActionItems`, wrapping TanStack Query) → **services** (`meetingService.ts`, typed fetch calls) → **API client** (`lib/api-client.ts`, one place that knows about `fetch`, base URL, and error handling).

### Transcript ↔ player synchronization

This is the core interactive mechanic, and it's intentionally simple:

1. `useMediaPlayer` drives a `currentTime` number forward on a `requestAnimationFrame` loop while "playing" — a **controlled mock player**, not a real `<audio>` element (see Assumptions).
2. `useActiveSegment(segments, currentTime)` does a linear scan for the segment where `start_time <= currentTime <= end_time` (falls back to the last segment whose `start_time` has passed, to survive small gaps between segments).
3. `TranscriptPanel` highlights that segment and calls `scrollIntoView` on it.
4. Clicking any transcript row calls `player.seek(segment.start_time)`, which just sets `currentTime` — the active-segment hook picks it up on the next render.

Because both sides only agree on a `currentTime` number, swapping the mock player for a real `<audio>` element later only means changing `useMediaPlayer`'s internals (listen to `timeupdate` instead of `requestAnimationFrame`) — nothing else in the transcript/search/topics code needs to change.

### Transcript search vs. playback highlighting

These are two independent concerns that happen to render in the same list: playback highlighting is a background color on the active row; search highlighting is `<mark>` tags wrapped around matched substrings, with the currently-selected match given a distinct color. `lib/transcriptSearch.tsx` finds every case-insensitive occurrence across all segments (in order) so "next/previous match" can walk through them like a browser's Ctrl+F.

### Summary/topics/action-item generation

`SummaryService` is an abstraction with a rule-based default:
- **`MockSummaryService`** (default, always available): deterministic — keyword frequency (for the overview and topic labels) and actionable-language detection (`"will"`, `"should"`, `"by Friday"`, `"follow up"`, …) for suggested action items. No external API, no API key, fully offline.
- **`LLMSummaryService`** (extension seam): selected when `GROQ_API_KEY` is set, but it currently delegates to the same heuristics. Summary generation is **not** LLM-powered today; only the Ask chat is.

Seeded meetings use hand-written, realistic summaries/topics/action items (not the mock generator) for a polished first-run experience; the mock generator kicks in for meetings created through the UI.

### Ask about this meeting (Q&A)

`POST /api/meetings/{id}/ask` → `AskService` (loads the transcript, summary, topics and action items through repositories) → a `QuestionAnswerService`. Same pattern as summaries: one interface, two implementations, chosen by a factory from config.

- **`MockQuestionAnswerService`** (no key): detects simple intents — *summary*, *action items* (optionally filtered to a named person), *topics* — and otherwise does keyword retrieval over the transcript: it scores each line by shared keywords (lightly stemmed, so "deadlines" matches "deadline"), treats a speaker name in the question as a filter ("What did Rahul say about X?" quotes only Rahul), and quotes the best lines with speaker and timestamp.
- **`LLMQuestionAnswerService`** (when `GROQ_API_KEY` is set): sends the transcript, summary and action items plus the question to a Groq-hosted model (default `openai/gpt-oss-120b`, override with `GROQ_MODEL`). The system prompt restricts it to the meeting material, tells it to treat that material as data rather than instructions (transcripts are untrusted input), and asks it to cite timestamps like `[7:35]`. The backend then maps those citations back to real transcript segments, so the "sources" chips are always genuine lines and can't be invented by the model.
- **Long meetings:** Groq's free tier has tight token limits, so if the transcript exceeds `LLM_MAX_CONTEXT_CHARS` (default 20,000) only the lines most relevant to the question are sent, in chronological order, and the prompt says so.
- **Failure handling:** on any Groq error (rate limit, bad key, network, empty answer) the service falls back to the keyword answer and returns a short `notice` ("AI answer unavailable (…), so this is a keyword-based answer"). The response's `mode` field (`llm` / `keyword`) is shown in the UI so it's always clear where an answer came from. Raw error details are logged server-side only.

### Comments

Comments belong to a transcript segment (`transcript_comments`). Creating one checks that the segment really belongs to the meeting. Replacing a meeting's transcript deletes its comments, since they'd point at lines that no longer exist.

---

## Project Structure

```
project-root/
  frontend/
    app/                  # Next.js App Router pages
      meetings/[id]/      # Meeting detail page
      search/, settings/, tags/
    components/
      layout/             # Sidebar, Topbar
      meetings/           # MeetingCard, MeetingList, MeetingFilters, Create/EditMeetingModal
      transcript/          # TranscriptPanel, TranscriptSegment, TranscriptSearch, CommentThread
      player/              # AudioPlayer (mock player), ProgressBar
      summary/             # SummaryPanel, TopicList, ActionItems, ActionItemModal
      chat/                # AskMeetingPanel (Q&A chat)
      search/              # GlobalSearchResults
      common/              # Button, Modal, ConfirmDialog, EmptyState, Toast, Avatar, Badge, LoadingSkeleton
      providers/           # QueryProvider, ToastProvider
    hooks/                 # useMeetings, useActionItems, useMediaPlayer, useTranscriptSync, useDebounce, useToast
    lib/                   # api-client, utils, queryKeys, transcriptSearch, meetingFilters
    services/              # meetingService, searchService (typed API calls)
    types/                 # Shared TypeScript interfaces (mirrors backend Pydantic schemas)

  backend/
    app/
      main.py              # FastAPI app, CORS, error handlers, router registration
      config.py            # Settings (env vars)
      api/routes/          # meetings, action_items, comments, ask, search, tags, users
      models/              # SQLAlchemy ORM models
      schemas/              # Pydantic request/response models
      services/             # meeting_service, transcript_service, action_item_service,
                             #   search_service, summary_service, transcript_parser,
                             #   comment_service, ask_service, qa_service
      repositories/          # meeting_repository, transcript_repository,
                              #   action_item_repository, search_repository
      database/               # engine/session setup
      seed/                    # seed_data.py (content) + seed.py (insertion script)
    tests/                     # pytest suite

  docker-compose.yml
  .gitignore
  README.md
```

---

## Database Schema

SQLite via SQLAlchemy. Indexes are placed on the columns the spec calls out: `meetings.meeting_date`, `meetings.title`, `participants.meeting_id`, `transcript_segments.meeting_id`, `transcript_segments.start_time`.

| Table | Key columns | Relationships |
|---|---|---|
| **users** | id, name, email (unique), avatar_url | 1 → many `meetings` (owner) |
| **meetings** | id, title, description, meeting_date, duration_seconds, owner_id | belongs to `users`; has many `participants`, `speakers`, `transcript_segments`, `transcript_comments`, `topics`, `action_items`; has one `summary`; many-to-many `tags` |
| **participants** | id, meeting_id, name, email, avatar_url, role | belongs to `meetings` |
| **speakers** | id, meeting_id, name, participant_id (nullable) | belongs to `meetings`; optionally linked to a `participant`; has many `transcript_segments` |
| **transcript_segments** | id, meeting_id, speaker_id, start_time, end_time, text, sequence_number | belongs to `meetings` and `speakers` |
| **summaries** | id, meeting_id (unique), overview, created_at, updated_at | one-to-one with `meetings` |
| **topics** | id, meeting_id, title, description, start_time, end_time | belongs to `meetings` |
| **action_items** | id, meeting_id, title, description, assignee, due_date, status, created_at, updated_at | belongs to `meetings` |
| **transcript_comments** | id, meeting_id, segment_id, author_id, text, created_at, updated_at | belongs to `meetings`, `transcript_segments` and `users` (author) |
| **tags** | id, name (unique) | many-to-many with `meetings` via `meeting_tags` |
| **meeting_tags** | meeting_id, tag_id | join table |

**Why a separate `speakers` table instead of a plain string on `transcript_segments`?** It lets the same speaker be referenced consistently across dozens of segments, optionally links to a real `participant`, and matches how a real transcription pipeline would model diarization output — without over-engineering (it's still just `id, meeting_id, name, participant_id`).

Deleting a meeting cascades (`cascade="all, delete-orphan"` in SQLAlchemy) to its participants, speakers, transcript segments, comments, summary, topics, and action items — the API layer doesn't need to remember to clean those up manually.

---

## API Documentation

Base path: `/api`. Interactive docs (Swagger UI) are available at `http://localhost:8000/docs` once the backend is running.

| Method | Path | Description |
|---|---|---|
| GET | `/api/meetings` | List meetings — query params: `search`, `participant`, `tag`, `sort` (`recent`\|`oldest`\|`duration`), `page`, `page_size` |
| GET | `/api/meetings/{id}` | Get one meeting |
| POST | `/api/meetings` | Create a meeting (optionally with `transcript_format` + `transcript_content` or `transcript_segments`) |
| PUT | `/api/meetings/{id}` | Update meeting metadata |
| DELETE | `/api/meetings/{id}` | Delete a meeting (cascades) |
| GET | `/api/meetings/{id}/transcript` | Get transcript segments |
| POST | `/api/meetings/{id}/transcript` | Replace transcript (parses `txt`/`vtt`/`json`, regenerates summary/topics) |
| GET | `/api/meetings/{id}/summary` | Get the meeting summary |
| GET | `/api/meetings/{id}/topics` | Get topics/chapters |
| GET | `/api/meetings/{id}/action-items` | List action items for a meeting |
| POST | `/api/meetings/{id}/action-items` | Create an action item |
| PUT | `/api/action-items/{id}` | Update an action item |
| PATCH | `/api/action-items/{id}/complete` | Mark an action item complete |
| DELETE | `/api/action-items/{id}` | Delete an action item |
| GET | `/api/meetings/{id}/comments` | List all transcript comments for a meeting |
| POST | `/api/meetings/{id}/comments` | Add a comment to a transcript line (`segment_id`, `text`, max 1000 chars) |
| PUT | `/api/comments/{id}` | Edit a comment |
| DELETE | `/api/comments/{id}` | Delete a comment |
| POST | `/api/meetings/{id}/ask` | Ask a question about the meeting (`question`, max 500 chars) → `answer`, `sources`, `mode` (`llm`\|`keyword`), `model`, `notice` |
| GET | `/api/search?q=` | Global search — meetings, transcript matches, action items |
| GET | `/api/tags` | List all tags |
| GET | `/api/users/me` | Get the current (single, seeded) user |
| GET | `/api/health` | Health check |

Status codes: `200` reads, `201` creates, `204` deletes, `404` not found, `422` validation errors, `500` unexpected errors (returned as a generic `{"detail": "Something went wrong..."}` — no stack traces leak to the client).

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # optional — defaults already work

python -m app.seed.seed          # creates meetings.db and seeds 7 meetings
uvicorn app.main:app --reload    # http://localhost:8000
```

Swagger docs: `http://localhost:8000/docs`

> **Re-seeding:** if you re-run `python -m app.seed.seed` while `uvicorn` is already running, restart `uvicorn` afterward. SQLite connections stay open to the original file handle, so a running server won't see a dropped-and-recreated database until it reconnects.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                      # http://localhost:3000
```

The app is fully seeded and usable immediately — no manual data entry required.

### Running with Docker (optional)

```bash
docker compose up --build
```
Frontend on `:3000`, backend on `:8000`. The backend image seeds its own database at build time. This is provided for convenience; the local setup above is the primary, simplest path and doesn't require Docker.

---

## Environment Variables

**backend/.env.example**
```
DATABASE_URL=sqlite:///./meetings.db
GROQ_API_KEY=         # optional — enables the LLM-powered Ask chat (Groq); leave empty for keyword answers
GROQ_MODEL=openai/gpt-oss-120b   # optional
LLM_MAX_CONTEXT_CHARS=20000          # optional — transcript characters sent to the model
```

**frontend/.env.example**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

No secrets are required for the app to run. Put `GROQ_API_KEY` in `backend/.env` (gitignored) — never commit it — and restart `uvicorn`, since settings are read once at startup. Get a key from the Groq console.

---

## Testing

### Backend (pytest)

```bash
cd backend
source venv/bin/activate
pytest -v
```

61 tests covering:
- Meeting CRUD (create, read, update, delete, 404 handling)
- Transcript generation from structured segments, and summary/action-items auto-generation from transcript text
- Meeting search/filtering
- Action item CRUD, complete, and cascading 404 after delete
- Transcript comments: CRUD, validation (blank/oversized text), rejecting a segment from another meeting, cascade on meeting delete and on transcript replacement
- The Ask endpoint: keyword answers with sources, summary/action-item/topic intents, speaker filtering, no-match and no-transcript cases, input validation
- The Groq service **with a fake client** (no network; tests are pinned to the offline service so they never depend on your `.env` key): prompt contents, citation parsing (`[7:35]`, fullwidth `【7:35】`, grouped `[2:04, 6:51]`) and mapping to real transcript lines, fallback on connection/rate-limit/auth errors and empty answers, no leaking of error details, long-transcript trimming, and factory selection from config
- API datetimes are explicit UTC (`...Z`), and editing a meeting doesn't shift its time
- The transcript parser directly: TXT, VTT, and JSON formats, including malformed-input error cases

### Manual / browser verification performed

The Ask chat was also verified against the **live Groq API** (`openai/gpt-oss-120b`): grounded answers with working source chips, "not in the meeting" answers for unanswerable questions, a transcript containing a prompt-injection line (the model answered the real question and treated the line as data), a 69,000-character transcript trimmed to relevant lines, and graceful keyword fallback for a bad key and a retired model. Live testing caught two bugs the fake-client tests could not: this model formats citations differently than expected (so no sources appeared), and it replies in Markdown (now rendered safely).

Every core flow was exercised in a real browser during development (not just unit-tested): meeting library search/filter/sort, opening a meeting, play/pause advancing the timer, clicking a transcript segment to seek (verified the player's displayed time exactly matches the clicked segment's `start_time`), the active-segment highlight following both playback and manual seeks, transcript search + highlight, the full create → edit → delete meeting lifecycle (including pasting a transcript and confirming it's parsed into segments), action item create/complete/delete, global search, and the dark mode toggle. The production build (`npm run build`) was also verified to compile cleanly.

---

## Design Decisions

- **Mock media player instead of a real audio file.** The assignment explicitly allows this. A real `<audio>` element would need a licensed or generated audio file per seeded meeting for no real UX benefit — the sync logic (the actual interesting problem) is identical either way, since both are driven by a plain `currentTime` number.
- **SQLite over Postgres.** The whole point of the seed script is "clone and run" with zero setup. SQLite has no server to install and the file lives right next to the code.
- **No global client-state library (Redux/Zustand).** Server data lives in TanStack Query's cache; the only client-only state (search input, modal open/close, active transcript segment) is plain `useState`/custom hooks. Adding a global store would duplicate what TanStack Query already manages.
- **Rule-based `MockSummaryService` instead of requiring an LLM.** The app must work with zero API keys. The heuristics (keyword frequency, actionable-language regex) are deterministic and genuinely derived per-meeting from the transcript text, not a canned string — the `LLMSummaryService` class documents exactly where a real model would plug in later.
- **A single seeded demo user, no auth.** Explicitly out of scope per the assignment; `get_current_user` always resolves to the one seeded user (Anshika Chauhan) so every meeting has a consistent owner without building sign-in.

---

## Assumptions

- No real authentication — a single demo user is assumed logged in everywhere.
- No real speech-to-text — transcripts are seeded, pasted, or uploaded as text.
- No real audio/video — the player simulates playback against a duration.
- SQLite is the database for all environments in this project's scope (see Future Improvements for swapping to Postgres).
- LLM integration is optional and the app is fully functional without any API key.

---

## Deployment

- **Backend:** any host that runs a Python/ASGI app (Render, Railway, Fly.io, a VM). Run `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Swap `DATABASE_URL` to Postgres for anything beyond a demo (SQLite doesn't handle concurrent writers well in a multi-instance deployment).
- **Frontend:** Vercel is the natural fit for Next.js (`npm run build` / `next start`, or just connect the repo). Set `NEXT_PUBLIC_API_URL` to the deployed backend's URL and add that frontend origin to the backend's `cors_origins` in `app/config.py`.
- **Docker:** `docker-compose.yml` runs both services together for a single-host deployment.

---

## Known Limitations

- Groq retires models over time (the original default, `llama-3.3-70b-versatile`, was already gone when this was tested live). If answers start showing "the configured Groq model isn't available", pick a current model in `GROQ_MODEL`.
- Ask chat history lives in the browser session and is not saved; each question is answered independently (no follow-up context).
- Groq's free tier is rate-limited, so heavy use will fall back to keyword answers.
- No real authentication or multi-user support.
- No real speech-to-text — audio is simulated, not decoded from a file.
- SQLite is not suited for concurrent multi-writer production traffic.
- The rule-based summary generator is intentionally simple (keyword/heuristic-based), not ML-quality summarization.

## Future Improvements

- Real authentication (sessions or OAuth) and multi-user workspaces with permissions.
- Real audio/video upload + playback (swap `useMediaPlayer`'s internals for an `<audio>`/`<video>` element — the rest of the sync logic needs no changes).
- Real speech-to-text ingestion (e.g. Whisper) feeding the same `TranscriptSegment` shape the parser already normalizes to.
- Calendar/Zoom/Google Meet integrations (currently "Coming Soon" placeholders in Settings).
- A real LLM behind `LLMSummaryService` for higher-quality summaries, topic detection, and action-item extraction.
- Postgres for production, with Alembic migrations instead of `create_all`.
- Team collaboration: multi-user comment threads with mentions and permissions (comments are single-author today), shared soundbites.
- Persisted, multi-turn Ask conversations and LLM-generated summaries/action items (only the Ask chat uses an LLM today).
