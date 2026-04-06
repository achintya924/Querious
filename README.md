# Querious

AI-powered data analyst — ask business questions in plain English, get charts, tables, and narrative insights.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS v3, Recharts, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **AI**: OpenAI GPT-4 with function calling
- **Auth**: JWT (bcryptjs)

## Getting Started

### 1. Install dependencies

```bash
# Root (installs concurrently)
npm install

# Server
cd server && npm install

# Client
cd client && npm install
```

### 2. Set up environment variables

```bash
# Server
cp server/.env.example server/.env
# Fill in MONGO_URI, OPENAI_API_KEY, JWT_SECRET

# Client (optional — defaults to localhost:5000)
cp client/.env.example client/.env
```

### 3. Seed the database

Make sure `server/.env` has a valid `MONGO_URI`, then:

```bash
npm run seed
```

This loads 20 products, 200 customers, and 5 000 orders with realistic patterns (seasonal spikes, regional variation, 2-year growth trend).

### 4. Run the dev server

```bash
npm run dev
```

This starts both the Express server (port 5000) and Vite dev server (port 5173) concurrently.

- API health check: `http://localhost:5000/api/health`
- Frontend: `http://localhost:5173`

### Individual commands

```bash
npm run server   # Express only
npm run client   # Vite only
npm run seed     # Re-seed the database
```
