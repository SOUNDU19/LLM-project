import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from app.database.connection import check_db_connection, get_collection
from app.routes import auth, tickets, analytics
from app.rag.vector_store import add_ticket_to_vector_store

app = FastAPI(
    title="LLM-Powered Smart Ticket Automation & Helpdesk System",
    description="Enterprise-grade AI-powered helpdesk system using FastAPI, MongoDB, ChromaDB, and Groq API Llama 3.",
    version="1.0.0"
)

def _get_cors_origins():
    """Build CORS allowlist from env (production) or wildcard (local default)."""
    origins = []
    cors_origins = os.getenv("CORS_ORIGINS", "").strip()
    if cors_origins:
        origins.extend(o.strip() for o in cors_origins.split(",") if o.strip())
    frontend_url = os.getenv("FRONTEND_URL", "").strip()
    if frontend_url:
        origins.append(frontend_url.rstrip("/"))
    if not origins:
        return ["*"]
    return list(dict.fromkeys(origins))


_cors_origins = _get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials="*" not in _cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(analytics.router)

async def seed_resolved_tickets():
    tickets_col = get_collection("tickets")
    count = await tickets_col.count_documents({})
    if count == 0:
        # We seed 5 resolved tickets representing typical enterprise issues.
        # These are used as reference context for our RAG pipeline.
        sample_tickets = [
            {
                "user_id": "seeder_system",
                "user_email": "admin@helpdesk.com",
                "user_fullname": "Seeder Bot",
                "description": "I cannot connect to the office VPN network. It says 'Gateway timeout error 504' and keeps disconnecting after 5 seconds.",
                "language": "English",
                "translated_description": None,
                "title": "VPN Gateway Timeout Error 504",
                "summary": "User is experiencing a gateway timeout when attempting to connect to the office VPN.",
                "category": "Network Issue",
                "subcategory": "VPN Access",
                "priority": "High",
                "department": "Network Operations",
                "tags": ["VPN", "Timeout", "Network", "Remote"],
                "reasoning": "Priority High because user is blocked from connecting to remote work resources.",
                "suggested_solution": "Ask user to switch connection settings to OpenVPN TCP protocol, flush DNS, or check if their local internet is blocking port 443.",
                "sentiment": "Negative",
                "escalation_predicted": False,
                "sla_risk_level": "Medium",
                "status": "resolved",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "resolution_notes": "Identified routing conflict on firewall cluster. Re-routed VPN subnet through secondary node and restarted gateway. User verified connection stays stable."
            },
            {
                "user_id": "seeder_system",
                "user_email": "admin@helpdesk.com",
                "user_fullname": "Seeder Bot",
                "description": "My payroll software crashes and shows memory allocation error every time I try to view my monthly payslip on the HR dashboard.",
                "language": "English",
                "translated_description": None,
                "title": "HR Payroll Portal Portal Memory Crash",
                "summary": "Application crashes when rendering payslip PDFs due to a memory leakage error.",
                "category": "HR/Payroll",
                "subcategory": "Payroll Software",
                "priority": "High",
                "department": "HR & Payroll",
                "tags": ["Payroll", "Crash", "PDF", "Memory"],
                "reasoning": "High priority because employees cannot access compensation details, creating potential legal/administrative tension.",
                "suggested_solution": "Clear browser local storage, ensure Chrome is updated, or verify database document size for the current month's payslips.",
                "sentiment": "Negative",
                "escalation_predicted": True,
                "sla_risk_level": "Medium",
                "status": "resolved",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "resolution_notes": "Optimized base64 PDF rendering query by compression. Increased client-side buffer cache and released memory after rendering. Ticket resolved."
            },
            {
                "user_id": "seeder_system",
                "user_email": "admin@helpdesk.com",
                "user_fullname": "Seeder Bot",
                "description": "Database query timeouts on the analytics database cluster are causing loading screens to freeze on the client dashboard page.",
                "language": "English",
                "translated_description": None,
                "title": "Database Query Latency and Timeouts",
                "summary": "Slow database queries on the primary database cluster are blocking client analytics requests.",
                "category": "Database Issue",
                "subcategory": "Database Query Timeout",
                "priority": "High",
                "department": "Database Admin",
                "tags": ["Database", "MongoDB", "Timeout", "Latency"],
                "reasoning": "High priority because the slowdown is impacting client-facing web application pages.",
                "suggested_solution": "Check MongoDB slow query logs, verify indices are applied, and run explain queries on the analytics collection.",
                "sentiment": "Neutral",
                "escalation_predicted": False,
                "sla_risk_level": "Medium",
                "status": "resolved",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "resolution_notes": "Created compound index on {tenant_id: 1, created_at: -1} and added $match criteria to limit analytics pipeline to 30 days. DB CPU utilization fell from 95% to 15%."
            },
            {
                "user_id": "seeder_system",
                "user_email": "admin@helpdesk.com",
                "user_fullname": "Seeder Bot",
                "description": "I got locked out of my corporate email account after entering my password incorrectly three times. I have a client meeting in an hour.",
                "language": "English",
                "translated_description": None,
                "title": "Active Directory Account Lockout",
                "summary": "User locked out of corporate email account due to multiple incorrect password attempts.",
                "category": "Login/Authentication",
                "subcategory": "User Authentication",
                "priority": "High",
                "department": "IT Support",
                "tags": ["Auth", "Lockout", "Email", "ActiveDirectory"],
                "reasoning": "High priority since the lockout impacts communications before a critical client meeting.",
                "suggested_solution": "Check Active Directory management console, unlock account manually, and send a temporary reset password.",
                "sentiment": "Negative",
                "escalation_predicted": True,
                "sla_risk_level": "High",
                "status": "resolved",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "resolution_notes": "Unlocked account inside AD Console and verified user multi-factor authentication (MFA) token sync. Sent SMS with temp credentials. User successfully logged in."
            },
            {
                "user_id": "seeder_system",
                "user_email": "admin@helpdesk.com",
                "user_fullname": "Seeder Bot",
                "description": "The internet router in the lobby conference room is down. The Wi-Fi SSID is visible but says 'Connected, no internet access'.",
                "language": "English",
                "translated_description": None,
                "title": "Lobby Conference Room Wi-Fi Down",
                "summary": "Conference room router is disconnected from external internet gateway.",
                "category": "Network Issue",
                "subcategory": "Router Outage",
                "priority": "Medium",
                "department": "Network Operations",
                "tags": ["Network", "Wi-Fi", "Router", "ConferenceRoom"],
                "reasoning": "Medium priority since other office zones are connected, but blocks visitor access in lobby.",
                "suggested_solution": "Power cycle lobby router, check ethernet patch cable connection, or check DHCP server lease pool allocations.",
                "sentiment": "Neutral",
                "escalation_predicted": False,
                "sla_risk_level": "Low",
                "status": "resolved",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "resolution_notes": "Power cycled network switch and Lobby Cisco Router. Re-established IP lease binding with ISP fiber link. Wi-Fi verified fully operational."
            }
        ]
        
        # Save to Mongo
        for doc in sample_tickets:
            res = await tickets_col.insert_one(doc)
            ticket_id = str(res.inserted_id)
            
            # Save to Chroma
            meta = {
                "title": doc["title"],
                "description": doc["description"],
                "status": doc["status"],
                "category": doc["category"],
                "priority": doc["priority"],
                "suggested_solution": doc["suggested_solution"],
                "resolution_notes": doc["resolution_notes"]
            }
            add_ticket_to_vector_store(ticket_id, doc["title"], doc["description"], meta)
            
        print("[Database] Seeded 5 resolved tickets to MongoDB and ChromaDB vector store.")

@app.on_event("startup")
async def on_startup():
    connected = await check_db_connection()
    if connected:
        print("[Database] MongoDB connection established successfully.")
    else:
        print("[Database] Running with in-memory fallback database store.")
    
    # Auto seed database on launch
    await seed_resolved_tickets()

@app.get("/")
async def home_route():
    from app.database.connection import is_mock_db
    from app.llm.groq_client import client as gclient
    
    return {
        "status": "online",
        "service": "LLM Helpdesk API",
        "database": "In-Memory Mock" if is_mock_db else "MongoDB Connected",
        "llm_engine": "Groq Llama 3 API Client" if gclient else "Heuristic Fallback Engine (No API key found)"
    }
