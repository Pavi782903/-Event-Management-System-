from sqlalchemy import Column, Integer, String, Date, Time, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Event(Base):
    __tablename__ = "events"
    __table_args__ = {"extend_existing": True}

    event_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_name = Column(String(200), nullable=False)
    event_type = Column(String(100), nullable=False)
    event_date = Column(Date, nullable=False)
    event_time = Column(Time, nullable=False)
    location = Column(String(300), nullable=False)
    capacity = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = {"extend_existing": True}

    participant_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    registrations = relationship("Registration", back_populates="participant", cascade="all, delete-orphan")


class Registration(Base):
    __tablename__ = "registrations"
    __table_args__ = {"extend_existing": True}

    registration_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.event_id"), nullable=False)
    participant_id = Column(Integer, ForeignKey("participants.participant_id"), nullable=False)
    registration_date = Column(Date, nullable=False)
    status = Column(String(50), default="Registered")
    created_at = Column(TIMESTAMP, server_default=func.now())

    event = relationship("Event", back_populates="registrations")
    participant = relationship("Participant", back_populates="registrations")
