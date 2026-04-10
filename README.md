# Querious

A natural-language analytics dashboard for MongoDB data. Ask questions in plain English, get charts and insights instantly.

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts
- **Backend**: Node.js ≥ 18, Express, Mongoose
- **AI**: Any OpenAI-compatible provider (OpenRouter, Groq, Grok, OpenAI)
- **Database**: MongoDB Atlas

## Features

- Natural language → MongoDB aggregation pipeline via AI function calling
- Bar, line, pie, grouped and stacked charts with auto-selection
- Session-based follow-up queries with conversation context
- Query history with full-text search and pagination
- Bookmarks with editable labels
- Schema explorer with clickable field suggestions
- In-memory query cache (1-hour TTL, LRU eviction)
- Rate limiting, input sanitization, security headers (Helmet)
- JWT authentication

## Local Development

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas cluster (or local MongoDB)
- API key from [OpenRouter](https://openrouter.ai), Groq, xAI, or OpenAI

### 1. Install dependencies

```bash
npm install          # root (installs concurrently)
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env    # fill in MONGO_URI, JWT_SECRET, AI_API_KEY, etc.
cp client/.env.example client/.env    # defaults to localhost:5000
```

### 3. Seed the database (optional)

```bash
npm run seed
```

Loads 20 products, 200 customers, and 5,000 orders with realistic seasonal and regional patterns.

### 4. Start dev servers

```bash
npm run dev    # starts Express (port 5000) + Vite (port 5173) concurrently
```

- Frontend: `http://localhost:5173`
- API health: `http://localhost:5000/api/health`

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRY` | Token expiry (e.g. `7d`) |
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MOCK_AI` | `true` to bypass AI calls for testing |
| `AI_API_KEY` | API key for your AI provider |
| `AI_BASE_URL` | Provider base URL |
| `AI_MODEL` | Model slug |
| `FRONTEND_URL` | Allowed CORS origin in production |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (e.g. `http://localhost:5000/api`) |

## AI Provider Swap

Change only three env vars — no code changes needed:

```bash
# OpenRouter (default)
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-oss-20b:free

# Groq
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile

# xAI Grok
AI_BASE_URL=https://api.x.ai/v1
AI_MODEL=grok-3-mini-fast

# OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

## Production Build

```bash
# 1. Set your backend URL
echo "VITE_API_URL=https://your-backend.com/api" > client/.env.production

# 2. Build the frontend
cd client && npm run build   # outputs to client/dist/

# 3. Serve the backend
cd server
NODE_ENV=production FRONTEND_URL=https://your-frontend.com node server.js
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Focus query input |
| `Ctrl+N` | New conversation |
| `Ctrl+H` | Open history |
| `Esc` | Close schema / overlays |
| `?` | Toggle shortcut help |
| `Enter` | Send query |
| `Shift+Enter` | New line in input |

## Data Schema

The seeder creates three collections:

- **orders** — `order_id`, `customer_id`, `product_id`, `quantity`, `total_price`, `status`, `region`, `order_date`
- **customers** — `name`, `email`, `city`, `country`, `segment`, `created_at`
- **products** — `name`, `category`, `price`, `stock`
