from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.database.db import get_connection
from app.utils.auth_utils import hash_password, verify_password, create_token
from app.utils.dependencies import get_current_user

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email=?", (body.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?,?,?)",
            (body.name, body.email, hash_password(body.password))
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email=?", (body.email,)).fetchone()
        token = create_token({"user_id": user["id"], "email": user["email"], "name": user["name"]})
        return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}
    finally:
        conn.close()

@router.post("/login")
def login(body: LoginRequest):
    conn = get_connection()
    try:
        user = conn.execute("SELECT * FROM users WHERE email=?", (body.email,)).fetchone()
        if not user or not verify_password(body.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token({"user_id": user["id"], "email": user["email"], "name": user["name"]})
        return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}
    finally:
        conn.close()

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user
