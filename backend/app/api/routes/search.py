from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.search import GlobalSearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=GlobalSearchResponse)
def global_search(q: str = Query(default="", min_length=0), db: Session = Depends(get_db)) -> GlobalSearchResponse:
    service = SearchService(db)
    return service.search(q)
