from typing import Literal, Optional

from pydantic import BaseModel, Field

Level = Literal["Junior", "Mid", "Senior"]
Kind = Literal["Behavioral", "Technical", "Mixed"]


class RegisterReq(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)
    email: str = Field(..., max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., min_length=1, max_length=60)
    level: Level = "Mid"
    goal: float = Field(8, ge=1, le=10)
    weekly: int = Field(3, ge=1, le=14)
    color: str = Field("#2B50FF", max_length=20)


class LoginReq(BaseModel):
    email: str = Field(..., max_length=120)
    password: str = Field(..., max_length=128)


class PasswordResetRequest(BaseModel):
    email: str = Field(..., max_length=254)


class PasswordResetConfirm(BaseModel):
    email: str = Field(..., max_length=254)
    otp: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=40)
    role: Optional[str] = Field(None, min_length=1, max_length=60)
    level: Optional[Level] = None
    goal: Optional[float] = Field(None, ge=1, le=10)
    weekly: Optional[int] = Field(None, ge=1, le=14)
    color: Optional[str] = Field(None, max_length=20)
    theme: Optional[Literal["auto", "light", "dark"]] = None


class Turn(BaseModel):
    question: str = Field(..., max_length=1500)
    answer: str = Field(..., max_length=6000)


class CoachSession(BaseModel):
    role: str = Field(..., max_length=60)
    level: Level = "Mid"
    kind: Kind = "Mixed"
    total_questions: int = Field(5, ge=1, le=10)
    history: list[Turn] = Field(default_factory=list, max_length=10)
    focus: list[str] = Field(default_factory=list, max_length=8)
    context: str = Field("", max_length=4000)


class AnswerReq(CoachSession):
    question: str = Field(..., max_length=1500)
    answer: str = Field(..., max_length=6000)
