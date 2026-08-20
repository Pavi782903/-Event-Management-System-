from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud, schemas

router = APIRouter(prefix="/registrations", tags=["Registrations"])


@router.post("/")
def create_registration(reg: schemas.RegistrationCreate, db: Session = Depends(get_db)):
    result, error = crud.create_registration(db, reg)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Registration successful", "registration_id": result.registration_id}


@router.get("/search")
def search_registrations(participant_name: str = "", event_name: str = "", db: Session = Depends(get_db)):
    if event_name:
        return crud.search_registrations_by_event(db, event_name)
    return crud.search_registrations_by_participant(db, participant_name)


@router.get("/")
def get_registrations(db: Session = Depends(get_db)):
    return crud.get_registrations(db)


@router.get("/{registration_id}")
def get_registration(registration_id: int, db: Session = Depends(get_db)):
    reg = crud.get_registration(db, registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    return reg


@router.put("/{registration_id}")
def update_registration(registration_id: int, reg: schemas.RegistrationUpdate, db: Session = Depends(get_db)):
    result = crud.update_registration(db, registration_id, reg)
    if not result:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"message": "Registration updated successfully"}


@router.delete("/{registration_id}")
def cancel_registration(registration_id: int, db: Session = Depends(get_db)):
    result = crud.cancel_registration(db, registration_id)
    if not result:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"message": "Registration cancelled successfully"}
