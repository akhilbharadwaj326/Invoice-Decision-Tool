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
