from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import action_items, ask, comments, meetings, search, tags, users
from app.config import get_settings
from app.database.session import Base, engine
from app.utils.exceptions import NotFoundError, ValidationFailedError

settings = get_settings()

# In production a migration tool (e.g. Alembic) would own schema changes.
# For this project's scope, create_all against SQLite is sufficient and is
# documented as a deliberate simplification in the README.
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
def handle_not_found(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ValidationFailedError)
def handle_validation_failed(request: Request, exc: ValidationFailedError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, HTTPException):
        raise exc
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


app.include_router(meetings.router)
app.include_router(action_items.router)
app.include_router(comments.router)
app.include_router(ask.router)
app.include_router(search.router)
app.include_router(tags.router)
app.include_router(users.router)


@app.get("/api/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
