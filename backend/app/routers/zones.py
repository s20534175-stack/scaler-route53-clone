from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database.db import get_connection
from app.utils.dependencies import get_current_user
import uuid

router = APIRouter()

class ZoneCreate(BaseModel):
    name: str
    comment: Optional[str] = ""
    type: Optional[str] = "Public"

class ZoneUpdate(BaseModel):
    comment: Optional[str] = None
    type: Optional[str] = None

def generate_zone_id():
    return "Z" + uuid.uuid4().hex[:13].upper()

def zone_row_to_dict(row):
    return {
        "id": row["id"],
        "zone_id": row["zone_id"],
        "name": row["name"],
        "comment": row["comment"],
        "type": row["type"],
        "record_count": row["record_count"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }

@router.get("/")
def list_zones(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    conn = get_connection()
    try:
        offset = (page - 1) * limit
        if search:
            rows = conn.execute(
                "SELECT * FROM hosted_zones WHERE user_id=? AND name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (current_user["user_id"], f"%{search}%", limit, offset)
            ).fetchall()
            total = conn.execute(
                "SELECT COUNT(*) FROM hosted_zones WHERE user_id=? AND name LIKE ?",
                (current_user["user_id"], f"%{search}%")
            ).fetchone()[0]
        else:
            rows = conn.execute(
                "SELECT * FROM hosted_zones WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (current_user["user_id"], limit, offset)
            ).fetchall()
            total = conn.execute(
                "SELECT COUNT(*) FROM hosted_zones WHERE user_id=?",
                (current_user["user_id"],)
            ).fetchone()[0]
        return {
            "zones": [zone_row_to_dict(r) for r in rows],
            "total": total, "page": page, "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    finally:
        conn.close()

@router.post("/", status_code=201)
def create_zone(body: ZoneCreate, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        name = body.name.rstrip(".") + "."
        existing = conn.execute(
            "SELECT id FROM hosted_zones WHERE name=? AND user_id=?",
            (name, current_user["user_id"])
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Hosted zone with this name already exists")
        zone_id = generate_zone_id()
        conn.execute(
            "INSERT INTO hosted_zones (zone_id, name, comment, type, user_id) VALUES (?,?,?,?,?)",
            (zone_id, name, body.comment, body.type, current_user["user_id"])
        )
        ns_id = "RR" + uuid.uuid4().hex[:10].upper()
        soa_id = "RR" + uuid.uuid4().hex[:10].upper()
        conn.execute(
            "INSERT INTO dns_records (record_id, zone_id, name, type, value, ttl) VALUES (?,?,?,?,?,?)",
            (ns_id, zone_id, name, "NS",
             "ns-100.awsdns-01.com.\nns-200.awsdns-02.org.\nns-300.awsdns-03.net.\nns-400.awsdns-04.co.uk.",
             172800)
        )
        conn.execute(
            "INSERT INTO dns_records (record_id, zone_id, name, type, value, ttl) VALUES (?,?,?,?,?,?)",
            (soa_id, zone_id, name, "SOA",
             "ns-100.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
             900)
        )
        conn.execute("UPDATE hosted_zones SET record_count=2 WHERE zone_id=?", (zone_id,))
        conn.commit()
        row = conn.execute("SELECT * FROM hosted_zones WHERE zone_id=?", (zone_id,)).fetchone()
        return zone_row_to_dict(row)
    finally:
        conn.close()

@router.get("/{zone_id}")
def get_zone(zone_id: str, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM hosted_zones WHERE zone_id=? AND user_id=?",
            (zone_id, current_user["user_id"])
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Hosted zone not found")
        return zone_row_to_dict(row)
    finally:
        conn.close()

@router.put("/{zone_id}")
def update_zone(zone_id: str, body: ZoneUpdate, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM hosted_zones WHERE zone_id=? AND user_id=?",
            (zone_id, current_user["user_id"])
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Hosted zone not found")
        updates = {}
        if body.comment is not None:
            updates["comment"] = body.comment
        if body.type is not None:
            updates["type"] = body.type
        if updates:
            set_clause = ", ".join(f"{k}=?" for k in updates)
            values = list(updates.values()) + [zone_id]
            conn.execute(f"UPDATE hosted_zones SET {set_clause}, updated_at=CURRENT_TIMESTAMP WHERE zone_id=?", values)
            conn.commit()
        updated = conn.execute("SELECT * FROM hosted_zones WHERE zone_id=?", (zone_id,)).fetchone()
        return zone_row_to_dict(updated)
    finally:
        conn.close()

@router.delete("/{zone_id}", status_code=204)
def delete_zone(zone_id: str, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM hosted_zones WHERE zone_id=? AND user_id=?",
            (zone_id, current_user["user_id"])
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Hosted zone not found")
        conn.execute("DELETE FROM hosted_zones WHERE zone_id=?", (zone_id,))
        conn.commit()
    finally:
        conn.close()
