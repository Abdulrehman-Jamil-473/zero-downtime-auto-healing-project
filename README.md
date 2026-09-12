# Zero-Downtime Platform

Multi-tier application (frontend + backend + MongoDB) — foundation for the
**Zero-Downtime Auto-Healing Deployment Pipeline** project.

## Structure
```
zero-downtime-platform/
├── frontend/       # HTML/CSS/JS client
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/        # Node.js/Express API
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Local test (before Docker/EC2)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm start
```
Backend runs on http://localhost:3000 — check http://localhost:3000/health

### Frontend
Just open `frontend/index.html` in a browser (make sure backend is running first).

## Next steps (per project roadmap)
1. ✅ Step 1: Repo + app structure (this)
2. Step 2: Launch new EC2 instance
3. Step 3: Dockerize (frontend, backend, MongoDB) with docker-compose
4. Step 4: Blue-Green + Nginx + CI/CD + Auto-Healing
