# Production Deployment Guide

Deploy **backend** on [Render](https://render.com) and **frontend** on [Vercel](https://vercel.com).

---

## Prerequisites

- GitHub repository pushed (`LLM-project`)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- [Groq API key](https://console.groq.com/)
- Render account
- Vercel account

---

## 1. Backend — Render

### Create Web Service

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/` |

Or connect the repo and use the included `render.yaml` Blueprint.

### Environment Variables (Render Dashboard)

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/smart_helpdesk?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Yes* | `smart_helpdesk` (*if not in URI) |
| `GROQ_API_KEY` | Recommended | `gsk_...` |
| `JWT_SECRET_KEY` | Yes | long random string |
| `JWT_ALGORITHM` | No | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `120` |
| `CORS_ORIGINS` | Yes | `https://your-app.vercel.app,http://localhost:5173` |
| `FRONTEND_URL` | Optional | `https://your-app.vercel.app` |
| `CHROMA_PERSIST_DIR` | Optional | `/tmp/chroma_db` |

> **Note:** `sentence-transformers` + `chromadb` need ~1–2 GB RAM on first boot (model download). Render **free** tier (512 MB) may OOM; use a **Starter** plan or rely on the built-in heuristic vector fallback if Chroma fails to load.

### Verify Backend

Open `https://<your-service>.onrender.com/` — should return JSON with `"status": "online"`.

API docs: `https://<your-service>.onrender.com/docs`

---

## 2. Frontend — Vercel

### Import Project

| Setting | Value |
|---------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Environment Variables (Vercel)

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://<your-render-service>.onrender.com` |

No trailing slash on the API URL.

Redeploy after changing env vars.

### Verify Frontend

Open your Vercel URL → login with demo accounts (seeded on first API startup).

---

## 3. MongoDB Atlas Tips

1. Allow network access: `0.0.0.0/0` (or Render outbound IPs).
2. Include database name in the connection string:
   ```
   mongodb+srv://USER:PASS@cluster.mongodb.net/smart_helpdesk?retryWrites=true&w=majority
   ```
3. Or set `MONGODB_DB_NAME=smart_helpdesk` separately.

---

## 4. Local Production Build Test

```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:PORT="8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend
$env:VITE_API_URL="http://localhost:8000"
npm run build
npm run preview
```

---

## 5. Deployment Checklist

- [ ] `.env` files **not** committed (see `.gitignore`)
- [ ] `JWT_SECRET_KEY` set to a strong secret on Render
- [ ] `CORS_ORIGINS` includes your Vercel URL
- [ ] `VITE_API_URL` points to Render backend on Vercel
- [ ] MongoDB Atlas allows connections
- [ ] Cold start: first Render request may take 30–60s on free tier

---

## Folder Structure (deployment-relevant)

```text
llm_project/
├── render.yaml              # Render Blueprint (optional)
├── DEPLOYMENT.md            # This guide
├── .gitignore
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       └── main.py          # CORS from env
└── frontend/
    ├── vercel.json          # SPA routing
    ├── .env.example
    └── src/services/api.js  # VITE_API_URL
```
