from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime

from app.database.connection import get_collection
from app.auth.helpers import get_password_hash, verify_password, create_access_token
from app.models.schemas import UserRegister, UserLogin, Token, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

async def seed_default_users():
    users_col = get_collection("users")
    count = await users_col.count_documents({})
    if count == 0:
        # Seed default Admin
        admin_user = {
            "email": "admin@helpdesk.com",
            "fullname": "System Administrator",
            "password": get_password_hash("admin123"),
            "role": "Admin",
            "created_at": datetime.utcnow()
        }
        await users_col.insert_one(admin_user)
        
        # Seed default Employee
        employee_user = {
            "email": "employee@helpdesk.com",
            "fullname": "John Doe Employee",
            "password": get_password_hash("employee123"),
            "role": "Employee",
            "created_at": datetime.utcnow()
        }
        await users_col.insert_one(employee_user)
        print("[Database] Seeded default admin and employee users successfully.")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    users_col = get_collection("users")
    
    # Ensure database has default users if empty
    await seed_default_users()
    
    existing_user = await users_col.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
        
    role = user_data.role if user_data.role in ["Employee", "Admin"] else "Employee"
    
    new_user = {
        "email": user_data.email,
        "fullname": user_data.fullname,
        "password": get_password_hash(user_data.password),
        "role": role,
        "created_at": datetime.utcnow()
    }
    
    result = await users_col.insert_one(new_user)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=new_user["email"],
        fullname=new_user["fullname"],
        role=new_user["role"],
        created_at=new_user["created_at"]
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users_col = get_collection("users")
    
    # Ensure database has default users if empty
    await seed_default_users()
    
    user = await users_col.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        fullname=user["fullname"],
        email=user["email"]
    )
