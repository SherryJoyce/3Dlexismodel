# conda activate fastapi
# uvicorn main:app --reload


from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, select
from pydantic import BaseModel
from typing import List

# DATABASE CONNECTION
DATABASE_URL = "postgresql+asyncpg://postgres:sherry0415@localhost:5433/lexisdb"

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# SQLAlchemy model for 'party' table
class Party(Base):
    __tablename__ = "party"

    pid = Column(String(200), primary_key=True, index=True)
    name = Column(String(250))
    party_type = Column(String(100))
    id_number = Column(String)
    address = Column(String(250))
    phone = Column(String(100))
    email = Column(String(100))
    group_name = Column(String(150))
    model_id = Column(String)

# Pydantic schema for JSON response
class PartySchema(BaseModel):
    pid: str
    name: str | None
    party_type: str | None
    id_number: str | None
    address: str | None
    phone: str | None
    email: str | None
    group_name: str | None
    model_id: str | None

    class Config:
        orm_mode = True

# FastAPI app
app = FastAPI()

# DB session dependency
async def get_session():
    async with SessionLocal() as session:
        yield session

# GET all parties
@app.get("/parties/", response_model=List[PartySchema])
async def get_parties(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Party))
    parties = result.scalars().all()
    return parties

# GET party by pid
@app.get("/party/{pid}", response_model=PartySchema)
async def get_party(pid: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Party).where(Party.pid == pid))
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party
