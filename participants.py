from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud, schemas

router = APIRouter(prefix="/participants", tags=["Participants"])


@router.post("/")
def create_participant(participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    try:
        result = crud.create_participant(db, participant)
        return {"message": "Participant added successfully", "participant_id": result.participant_id}
    except Exception:
        raise HTTPException(status_code=400, detail="Email already exists")


@router.get("/search")
def search_participants(name: str = "", email: str = "", db: Session = Depends(get_db)):
    if email:
        return crud.search_participants_by_email(db, email)
    return crud.search_participants_by_name(db, name)


@router.get("/")
def get_participants(db: Session = Depends(get_db)):
    return crud.get_participants(db)


@router.get("/{participant_id}")
def get_participant(participant_id: int, db: Session = Depends(get_db)):
    p = crud.get_participant(db, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    return p


@router.put("/{participant_id}")
def update_participant(participant_id: int, participant: schemas.ParticipantUpdate, db: Session = Depends(get_db)):
    result = crud.update_participant(db, participant_id, participant)
    if not result:
        raise HTTPException(status_code=404, detail="Participant not found")
    return {"message": "Participant updated successfully"}


@router.delete("/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    result = crud.delete_participant(db, participant_id)
    if not result:
        raise HTTPException(status_code=404, detail="Participant not found")
    return {"message": "Participant deleted successfully"}


@router.get("/{participant_id}/events")
def get_participant_events(participant_id: int, db: Session = Depends(get_db)):
    return crud.get_participant_events(db, participant_id)
