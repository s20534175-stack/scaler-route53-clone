from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database.db import get_connection
from app.utils.dependencies import get_current_user
import uuid

router = APIRouter()

VALID_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]

class RecordCreate(BaseModel):
    name: str
    type: str
    value: str
    ttl: Optional[int] = 300
    routing_policy: Optional[str] = "Simple"
    comment: Optional[str] = ""

class RecordUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None
    ttl: Optional[int] = None
    routing_policy: Optional[str] = None
    comment: Optional[str] = None

def record_row_to_dict(row):
    return {
        "id": row["id"], "record_id": row["record_id"], "zone_id": row["zone_id"],
        "name": row["name"], "type": row["type"], "value": row["value"],
        "ttl": row["ttl"], "routing_policy": row["routing_policy"],
        "comment": row["comment"], "created_at": row["created_at"], "updated_at": row["updated_at"],
    }

def check_zone_ownership(conn, zone_id, user_id):
    row = conn.execute("SELECT id FROM hosted_zones WHERE zone_id=? AND user_id=?", (zone_id, user_id)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

def update_zone_record_count(conn, zone_id):
    count = conn.execute("SELECT COUNT(*) FROM dns_records WHERE zone_id=?", (zone_id,)).fetchone()[0]
    conn.execute("UPDATE hosted_zones SET record_count=? WHERE zone_id=?", (count, zone_id))

@router.get("/{zone_id}/records")
def list_records(
    zone_id: str,
    search: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    conn = get_connection()
    try:
        check_zone_ownership(conn, zone_id, current_user["user_id"])
        offset = (page - 1) * limit
        where_clauses = ["zone_id=?"]
        params = [zone_id]
        if search:
            where_clauses.append("(name LIKE ? OR value LIKE ?)")
            params += [f"%{search}%", f"%{search}%"]
        if type_filter:
            where_clauses.append("type=?")
            params.append(type_filter.upper())
        where = " AND ".join(where_clauses)
        rows = conn.execute(
            f"SELECT * FROM dns_records WHERE {where} ORDER BY type, name LIMIT ? OFFSET ?",
            params + [limit, offset]
        ).fetchall()
        total = conn.execute(f"SELECT COUNT(*) FROM dns_records WHERE {where}", params).fetchone()[0]
        return {"records": [record_row_to_dict(r) for r in rows], "total": total, "page": page, "limit": limit, "pages": (total + limit - 1) // limit}
    finally:
        conn.close()

@router.post("/{zone_id}/records", status_code=201)
def create_record(zone_id: str, body: RecordCreate, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        check_zone_ownership(conn, zone_id, current_user["user_id"])
        if body.type.upper() not in VALID_TYPES:
            raise HTTPException(status_code=400, detail="Invalid record type")
        record_id = "RR" + uuid.uuid4().hex[:10].upper()
        conn.execute(
            "INSERT INTO dns_records (record_id, zone_id, name, type, value, ttl, routing_policy, comment) VALUES (?,?,?,?,?,?,?,?)",
            (record_id, zone_id, body.name, body.type.upper(), body.value, body.ttl, body.routing_policy, body.comment)
        )
        update_zone_record_count(conn, zone_id)
        conn.commit()
        row = conn.execute("SELECT * FROM dns_records WHERE record_id=?", (record_id,)).fetchone()
        return record_row_to_dict(row)
    finally:
        conn.close()

@router.put("/{zone_id}/records/{record_id}")
def update_record(zone_id: str, record_id: str, body: RecordUpdate, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        check_zone_ownership(conn, zone_id, current_user["user_id"])
        row = conn.execute("SELECT * FROM dns_records WHERE record_id=? AND zone_id=?", (record_id, zone_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        updates = {f: getattr(body, f) for f in ["name","value","ttl","routing_policy","comment"] if getattr(body, f) is not None}
        if updates:
            set_clause = ", ".join(f"{k}=?" for k in updates)
            conn.execute(f"UPDATE dns_records SET {set_clause}, updated_at=CURRENT_TIMESTAMP WHERE record_id=?", list(updates.values()) + [record_id])
            conn.commit()
        return record_row_to_dict(conn.execute("SELECT * FROM dns_records WHERE record_id=?", (record_id,)).fetchone())
    finally:
        conn.close()

@router.delete("/{zone_id}/records/{record_id}", status_code=204)
def delete_record(zone_id: str, record_id: str, current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        check_zone_ownership(conn, zone_id, current_user["user_id"])
        row = conn.execute("SELECT * FROM dns_records WHERE record_id=? AND zone_id=?", (record_id, zone_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        conn.execute("DELETE FROM dns_records WHERE record_id=?", (record_id,))
        update_zone_record_count(conn, zone_id)
        conn.commit()
    finally:
        conn.close()
