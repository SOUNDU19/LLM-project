from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# --- Authentication Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    fullname: str
    role: str = Field(default="Employee", description="Role can be Employee or Admin")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    fullname: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    fullname: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- AI Processed Ticket Fields ---
class AITicketDetails(BaseModel):
    title: str
    summary: str
    category: str
    subcategory: str
    priority: str
    department: str
    tags: List[str]
    reasoning: str
    suggested_solution: str
    sentiment: Optional[str] = "Neutral"
    escalation_predicted: Optional[bool] = False
    sla_risk_level: Optional[str] = "Low"

# --- Ticket Schemas ---
class TicketCreate(BaseModel):
    description: str = Field(..., min_length=10, description="Detailed ticket description (minimum 10 characters)")
    language: Optional[str] = "English"

class TicketUpdate(BaseModel):
    status: Optional[str] = None  # open, in_progress, resolved, closed
    priority: Optional[str] = None  # Low, Medium, High, Critical
    category: Optional[str] = None
    department: Optional[str] = None
    resolution_notes: Optional[str] = None

class DuplicateAlert(BaseModel):
    is_duplicate: bool
    duplicate_of_id: Optional[str] = None
    similarity_score: Optional[float] = 0.0

class TicketResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_fullname: str
    description: str
    language: str
    translated_description: Optional[str] = None
    title: str
    summary: str
    category: str
    subcategory: str
    priority: str
    department: str
    tags: List[str]
    reasoning: str
    suggested_solution: str
    sentiment: str
    escalation_predicted: bool
    sla_risk_level: str
    status: str
    created_at: datetime
    updated_at: datetime
    resolution_notes: Optional[str] = None
    duplicate_alert: Optional[DuplicateAlert] = None

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class CategoryStat(BaseModel):
    category: str
    count: int

class PriorityStat(BaseModel):
    priority: str
    count: int

class DashboardAnalytics(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    critical_tickets: int
    duplicate_alerts_count: int
    category_distribution: List[CategoryStat]
    priority_distribution: List[PriorityStat]
    sla_breaches_predicted: int
    sentiment_counts: dict
