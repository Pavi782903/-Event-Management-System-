from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi import Depends
from database import engine, Base, get_db
import models, crud
from routers import events, participants, registrations

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Event Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static & Templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Include routers
app.include_router(events.router)
app.include_router(participants.router)
app.include_router(registrations.router)


# ── Page Routes ────────────────────────────────────────────
@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/events-page")
def events_page(request: Request):
    return templates.TemplateResponse("events.html", {"request": request})


@app.get("/participants-page")
def participants_page(request: Request):
    return templates.TemplateResponse("participants.html", {"request": request})


@app.get("/registrations-page")
def registrations_page(request: Request):
    return templates.TemplateResponse("registrations.html", {"request": request})


# ── Dashboard Stats ────────────────────────────────────────
@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)
