import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.session import Base, get_db
from app.main import app
from app.models.user import User
from app.services.qa_service import MockQuestionAnswerService, get_qa_service


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    # Never let tests reach the network or depend on a developer's local .env key.
    app.dependency_overrides[get_qa_service] = lambda: MockQuestionAnswerService()

    seed_db = TestingSessionLocal()
    seed_db.add(User(name="Anshika Chauhan", email="anshika.chauhan@meetingnotes.app"))
    seed_db.commit()
    seed_db.close()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
