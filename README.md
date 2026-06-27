# AWS Route53 Clone

A functional clone of the AWS Route53 DNS Management Console, built with **Next.js (TypeScript)** frontend and **FastAPI** backend, with **SQLite** persistent storage.

---

## 🚀 Live Demo

- **Frontend:** [Deployed on Vercel]
- **Backend API:** [Deployed on Render]
- **Demo login:** `demo@route53clone.com` / `Demo@12345`

---

## 🏗️ Architecture Overview

```
route53-clone/
├── frontend/                  # Next.js 14 (TypeScript)
│   └── src/
│       ├── app/               # App Router pages
│       │   ├── login/         # Auth page
│       │   ├── dashboard/     # Dashboard (mocked)
│       │   ├── hosted-zones/  # Hosted zones list + [zoneId] detail
│       │   ├── traffic-policies/  # Coming Soon
│       │   ├── health-checks/     # Coming Soon
│       │   ├── resolver/          # Coming Soon
│       │   └── profiles/          # Coming Soon
│       ├── components/
│       │   ├── layout/        # TopNav, Sidebar
│       │   └── ui/            # Modal, Toast, ConfirmDialog, Pagination
│       └── lib/
│           ├── api.ts         # Typed API client
│           └── auth.tsx       # AuthContext + hooks
└── backend/                   # FastAPI (Python)
    ├── main.py                # App entry + CORS + routes
    └── app/
        ├── database/db.py     # SQLite init + schema
        ├── routers/
        │   ├── auth.py        # Login, register, /me
        │   ├── zones.py       # Hosted zones CRUD
        │   └── records.py     # DNS records CRUD
        └── utils/
            ├── auth_utils.py  # PBKDF2 hashing + custom JWT
            └── dependencies.py # FastAPI auth dependency
```

---

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,   -- PBKDF2-SHA256 with salt
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hosted Zones table
CREATE TABLE hosted_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id TEXT UNIQUE NOT NULL,  -- e.g. Z1A2B3C4D5E6F7
    name TEXT NOT NULL,            -- e.g. example.com.
    comment TEXT DEFAULT '',
    type TEXT DEFAULT 'Public',    -- Public | Private
    record_count INTEGER DEFAULT 0,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- DNS Records table
CREATE TABLE dns_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT UNIQUE NOT NULL,  -- e.g. RR1A2B3C4D5E
    zone_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,              -- A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA
    value TEXT NOT NULL,
    ttl INTEGER DEFAULT 300,
    routing_policy TEXT DEFAULT 'Simple',
    comment TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES hosted_zones(zone_id) ON DELETE CASCADE
);
```

---

## 🔌 API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user info |

### Hosted Zones
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones/` | List zones (search, pagination) |
| POST | `/api/zones/` | Create hosted zone |
| GET | `/api/zones/{zone_id}` | Get zone details |
| PUT | `/api/zones/{zone_id}` | Update zone |
| DELETE | `/api/zones/{zone_id}` | Delete zone + all records |

### DNS Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones/{zone_id}/records` | List records (search, type filter, pagination) |
| POST | `/api/zones/{zone_id}/records` | Create DNS record |
| GET | `/api/zones/{zone_id}/records/{record_id}` | Get record |
| PUT | `/api/zones/{zone_id}/records/{record_id}` | Update record |
| DELETE | `/api/zones/{zone_id}/records/{record_id}` | Delete record |

**All zone/record endpoints require:** `Authorization: Bearer <token>`

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm / pip

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## ✨ Features

### Implemented
- ✅ JWT-based mocked authentication (register / login / session persistence)
- ✅ Hosted Zones full CRUD (Create, Read, Update, Delete)
- ✅ DNS Records full CRUD for all 9 record types: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA
- ✅ Auto-creation of NS + SOA records on zone creation (AWS behavior)
- ✅ Search / filter by domain name or record type
- ✅ Pagination on both zones and records
- ✅ AWS Route53-faithful UI: top nav, sidebar, breadcrumbs, tables, modals
- ✅ Toast notifications for all actions
- ✅ TTL presets (1m, 5m, 1h, 1d, custom)
- ✅ Routing policy selection
- ✅ Responsive design with AWS color system
- ✅ All data persisted in SQLite

### Mocked / Coming Soon Placeholders
- Dashboard analytics
- Traffic Policies
- Health Checks
- Resolver
- Profiles

---

## 🛡️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.10+ |
| Database | SQLite (WAL mode, foreign keys) |
| Auth | Custom PBKDF2-SHA256 + HMAC token (no external deps) |
| Deploy | Vercel (frontend) + Render (backend) |
