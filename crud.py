from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import models, schemas


# ── Events ─────────────────────────────────────────────────
def create_event(db: Session, event: schemas.EventCreate):
    db_event = models.Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_events(db: Session):
    events = db.query(models.Event).all()
    result = []
    for e in events:
        count = db.query(func.count(models.Registration.registration_id)).filter(
            models.Registration.event_id == e.event_id,
            models.Registration.status != "Cancelled"
        ).scalar()
        e_dict = {c.name: getattr(e, c.name) for c in e.__table__.columns}
        e_dict["registered_count"] = count
        result.append(e_dict)
    return result


def get_event(db: Session, event_id: int):
    return db.query(models.Event).filter(models.Event.event_id == event_id).first()


def search_events_by_name(db: Session, name: str):
    return db.query(models.Event).filter(models.Event.event_name.ilike(f"%{name}%")).all()


def get_events_by_type(db: Session, event_type: str):
    return db.query(models.Event).filter(models.Event.event_type.ilike(f"%{event_type}%")).all()


def get_upcoming_events(db: Session):
    return db.query(models.Event).filter(models.Event.event_date >= date.today()).order_by(models.Event.event_date).all()


def get_available_events(db: Session):
    events = db.query(models.Event).filter(models.Event.event_date >= date.today()).all()
    available = []
    for e in events:
        count = db.query(func.count(models.Registration.registration_id)).filter(
            models.Registration.event_id == e.event_id,
            models.Registration.status != "Cancelled"
        ).scalar()
        if count < e.capacity:
            e_dict = {c.name: getattr(e, c.name) for c in e.__table__.columns}
            e_dict["registered_count"] = count
            available.append(e_dict)
    return available


def update_event(db: Session, event_id: int, event: schemas.EventUpdate):
    db_event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not db_event:
        return None
    for key, val in event.model_dump(exclude_unset=True).items():
        setattr(db_event, key, val)
    db.commit()
    db.refresh(db_event)
    return db_event


def delete_event(db: Session, event_id: int):
    db_event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not db_event:
        return False
    db.delete(db_event)
    db.commit()
    return True


# ── Participants ───────────────────────────────────────────
def create_participant(db: Session, participant: schemas.ParticipantCreate):
    db_p = models.Participant(**participant.model_dump())
    db.add(db_p)
    db.commit()
    db.refresh(db_p)
    return db_p


def get_participants(db: Session):
    return db.query(models.Participant).all()


def get_participant(db: Session, participant_id: int):
    return db.query(models.Participant).filter(models.Participant.participant_id == participant_id).first()


def search_participants_by_name(db: Session, name: str):
    return db.query(models.Participant).filter(models.Participant.name.ilike(f"%{name}%")).all()


def search_participants_by_email(db: Session, email: str):
    return db.query(models.Participant).filter(models.Participant.email.ilike(f"%{email}%")).all()


def update_participant(db: Session, participant_id: int, participant: schemas.ParticipantUpdate):
    db_p = db.query(models.Participant).filter(models.Participant.participant_id == participant_id).first()
    if not db_p:
        return None
    for key, val in participant.model_dump(exclude_unset=True).items():
        setattr(db_p, key, val)
    db.commit()
    db.refresh(db_p)
    return db_p


def delete_participant(db: Session, participant_id: int):
    db_p = db.query(models.Participant).filter(models.Participant.participant_id == participant_id).first()
    if not db_p:
        return False
    db.delete(db_p)
    db.commit()
    return True


# ── Registrations ──────────────────────────────────────────
def create_registration(db: Session, reg: schemas.RegistrationCreate):
    # Check capacity
    event = db.query(models.Event).filter(models.Event.event_id == reg.event_id).first()
    if not event:
        return None, "Event not found"
    count = db.query(func.count(models.Registration.registration_id)).filter(
        models.Registration.event_id == reg.event_id,
        models.Registration.status != "Cancelled"
    ).scalar()
    if count >= event.capacity:
        return None, "Event is at full capacity"
    # Check duplicate
    existing = db.query(models.Registration).filter(
        models.Registration.event_id == reg.event_id,
        models.Registration.participant_id == reg.participant_id,
        models.Registration.status != "Cancelled"
    ).first()
    if existing:
        return None, "Participant already registered for this event"
    db_reg = models.Registration(**reg.model_dump())
    db.add(db_reg)
    db.commit()
    db.refresh(db_reg)
    return db_reg, None


def get_registrations(db: Session):
    regs = db.query(models.Registration).all()
    return _enrich_registrations(db, regs)


def get_registration(db: Session, registration_id: int):
    return db.query(models.Registration).filter(models.Registration.registration_id == registration_id).first()


def search_registrations_by_participant(db: Session, name: str):
    regs = db.query(models.Registration).join(models.Participant).filter(
        models.Participant.name.ilike(f"%{name}%")
    ).all()
    return _enrich_registrations(db, regs)


def search_registrations_by_event(db: Session, name: str):
    regs = db.query(models.Registration).join(models.Event).filter(
        models.Event.event_name.ilike(f"%{name}%")
    ).all()
    return _enrich_registrations(db, regs)


def update_registration(db: Session, registration_id: int, reg: schemas.RegistrationUpdate):
    db_reg = db.query(models.Registration).filter(models.Registration.registration_id == registration_id).first()
    if not db_reg:
        return None
    for key, val in reg.model_dump(exclude_unset=True).items():
        setattr(db_reg, key, val)
    db.commit()
    db.refresh(db_reg)
    return db_reg


def cancel_registration(db: Session, registration_id: int):
    db_reg = db.query(models.Registration).filter(models.Registration.registration_id == registration_id).first()
    if not db_reg:
        return False
    db_reg.status = "Cancelled"
    db.commit()
    return True


def get_event_participants(db: Session, event_id: int):
    regs = db.query(models.Registration).filter(models.Registration.event_id == event_id).all()
    return _enrich_registrations(db, regs)


def get_participant_events(db: Session, participant_id: int):
    regs = db.query(models.Registration).filter(models.Registration.participant_id == participant_id).all()
    return _enrich_registrations(db, regs)


def get_dashboard_stats(db: Session):
    total_events = db.query(func.count(models.Event.event_id)).scalar()
    total_participants = db.query(func.count(models.Participant.participant_id)).scalar()
    total_registrations = db.query(func.count(models.Registration.registration_id)).scalar()
    return {
        "total_events": total_events,
        "total_participants": total_participants,
        "total_registrations": total_registrations
    }


def _enrich_registrations(db: Session, regs):
    result = []
    for r in regs:
        event = db.query(models.Event).filter(models.Event.event_id == r.event_id).first()
        participant = db.query(models.Participant).filter(models.Participant.participant_id == r.participant_id).first()
        result.append({
            "registration_id": r.registration_id,
            "event_id": r.event_id,
            "participant_id": r.participant_id,
            "registration_date": str(r.registration_date),
            "status": r.status,
            "event_name": event.event_name if event else "",
            "participant_name": participant.name if participant else "",
            "participant_email": participant.email if participant else "",
        })
    return result
