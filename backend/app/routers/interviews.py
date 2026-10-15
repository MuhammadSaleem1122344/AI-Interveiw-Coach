import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..db import Interview, User, aware, get_db
from ..deps import current_user

router = APIRouter(prefix="/api/sessions")


def out(i: Interview) -> dict:
    return {**i.data, "id": i.id, "date": aware(i.date).isoformat()}


@router.get("")
def list_interviews(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Interview).where(Interview.user_id == user.id).order_by(Interview.date)).all()
    return [out(r) for r in rows]


@router.post("")
def save_interview(data: dict, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not isinstance(data.get("turns"), list) or not isinstance(data.get("overall"), (int, float)):
        raise HTTPException(422, "Invalid interview data")
    if len(json.dumps(data)) > 200_000:
        raise HTTPException(413, "Interview data too large")
    row = Interview(user_id=user.id, data={k: v for k, v in data.items() if k not in ("id", "date")})
    db.add(row)
    db.commit()
    return out(row)


@router.delete("/{sid}")
def delete_interview(sid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    res = db.execute(delete(Interview).where(Interview.id == sid, Interview.user_id == user.id))  # scoped to owner
    db.commit()
    if not res.rowcount:
        raise HTTPException(404, "Interview not found")
    return {"ok": True}


@router.delete("")
def clear_interviews(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(Interview).where(Interview.user_id == user.id))
    db.commit()
    return {"ok": True}
