from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud, schemas

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=dict)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    result = crud.create_event(db, event)
    return {"message": "Event created successfully", "event_id": result.event_id}


@router.get("/upcoming")
def get_upcoming(db: Session = Depends(get_db)):
    return crud.get_upcoming_events(db)


@router.get("/available")
def get_available(db: Session = Depends(get_db)):
    return crud.get_available_events(db)


@router.get("/search")
def search_events(name: str = "", db: Session = Depends(get_db)):
    return crud.search_events_by_name(db, name)


@router.get("/type/{event_type}")
def get_by_type(event_type: str, db: Session = Depends(get_db)):
    return crud.get_events_by_type(db, event_type)


@router.get("/")
def get_events(db: Session = Depends(get_db)):
    return crud.get_events(db)


@router.get("/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}")
def update_event(event_id: int, event: schemas.EventUpdate, db: Session = Depends(get_db)):
    result = crud.update_event(db, event_id, event)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event updated successfully"}


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    result = crud.delete_event(db, event_id)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}


@router.get("/{event_id}/participants")
def get_event_participants(event_id: int, db: Session = Depends(get_db)):
    return crud.get_event_participants(db, event_id)
