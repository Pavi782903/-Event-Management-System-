from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, time


# ── Event Schemas ──────────────────────────────────────────
class EventBase(BaseModel):
    event_name: str
    event_type: str
    event_date: date
    event_time: time
    location: str
    capacity: int
    description: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    event_name: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None


class EventOut(EventBase):
    event_id: int
    registered_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Participant Schemas ────────────────────────────────────
class ParticipantBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ParticipantOut(ParticipantBase):
    participant_id: int

    class Config:
        from_attributes = True


# ── Registration Schemas ───────────────────────────────────
class RegistrationBase(BaseModel):
    event_id: int
    participant_id: int
    registration_date: date
    status: Optional[str] = "Registered"


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationUpdate(BaseModel):
    status: Optional[str] = None
    registration_date: Optional[date] = None


class RegistrationOut(BaseModel):
    registration_id: int
    event_id: int
    participant_id: int
    registration_date: date
    status: str
    event_name: Optional[str] = None
    participant_name: Optional[str] = None
    participant_email: Optional[str] = None

    class Config:
        from_attributes = True
