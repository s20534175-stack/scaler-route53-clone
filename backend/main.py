from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import init_db
from app.routers import auth, zones, records

app = FastAPI(title="Route53 Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(zones.router, prefix="/api/zones", tags=["hosted-zones"])
app.include_router(records.router, prefix="/api/zones", tags=["dns-records"])

@app.get("/")
def root():
    return {"message": "Route53 Clone API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
