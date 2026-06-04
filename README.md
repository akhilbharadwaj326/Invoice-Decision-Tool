# Invoice Decision Tool

## Overview
AI-powered invoice processing and approval decision tool for Accounts Payable teams.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS + Shadcn/UI
- **Backend:** Python 3.12 + FastAPI
- **AI/OCR:** OpenAI GPT-4o Vision
- **Database:** PostgreSQL 16 (Neon.tech)
- **Storage:** Supabase Storage
- **Hosting:** Replit (Frontend: Static, Backend: Reserved VM)

## Documentation (`/docs`)
| Document | Description |
|---|---|
| [PRD](docs/PRD_Invoice_Decision_Tool.md) | Product Requirements Document |
| [BRD](docs/BRD_Invoice_Decision_Tool.md) | Business Requirements Document |
| [SAD](docs/SAD_Invoice_Decision_Tool.md) | System Architecture Document |
| [Implementation Plan](docs/implementation_plan.md) | Technical delivery plan |

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL (or Neon.tech account)
- OpenAI API key
- Supabase account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/akhilbharadwaj326/Invoice-Decision-Tool.git
cd Invoice-Decision-Tool
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your real values — NEVER commit .env
```

Use local PostgreSQL for local testing. On Replit/production, use a hosted PostgreSQL URL such as Neon in `DATABASE_URL`. Supabase is used for invoice file storage only, not as the application database.

3. **Backend setup**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

4. **Frontend setup**
```bash
cd frontend
npm install
npm run dev
```

### Replit Deployment Notes

- Backend: deploy the FastAPI app from `backend/` using the root `.replit` run command.
- Frontend: deploy `frontend/dist` as a static deployment after running `npm run build`.
- Production `DATABASE_URL`: use Neon PostgreSQL.
- Production file storage: set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_BUCKET`.
- Set `FRONTEND_URL` to the deployed frontend URL and `VITE_API_BASE_URL` to the deployed backend URL.
- Set `BACKEND_PUBLIC_URL` to the deployed backend URL so document links resolve correctly.

## Security
- All secrets are managed via environment variables — see `.env.example`
- **Never commit `.env` files** — they are in `.gitignore`
- JWT authentication with httpOnly refresh tokens
- Role-based access control (VIEWER / REVIEWER / APPROVER / ADMIN)

## Branches
| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `project-planning` | Planning documents, architecture |
| `develop` | Integration branch |
| `feature/*` | Feature branches |

## License
Private — Internal use only.
