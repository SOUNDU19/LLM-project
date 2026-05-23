from fastapi import APIRouter, Depends
from typing import List, Dict

from app.database.connection import get_collection
from app.auth.helpers import get_admin_user
from app.models.schemas import DashboardAnalytics, CategoryStat, PriorityStat

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("", response_model=DashboardAnalytics)
async def get_dashboard_analytics(current_user: dict = Depends(get_admin_user)):
    tickets_col = get_collection("tickets")
    
    # Fetch all tickets to aggregate in Python (fully compatible with mock and MongoDB)
    cursor = tickets_col.find({})
    tickets = await cursor.to_list(length=1000)
    
    total = len(tickets)
    open_count = 0
    resolved_count = 0
    critical = 0
    duplicates = 0
    sla_breaches = 0
    
    categories = {}
    priorities = {}
    sentiments = {"Positive": 0, "Neutral": 0, "Negative": 0}
    
    for t in tickets:
        status = t.get("status", "open")
        priority = t.get("priority", "Medium")
        category = t.get("category", "Software Issue")
        sentiment = t.get("sentiment", "Neutral")
        sla = t.get("sla_risk_level", "Low")
        
        # Increment status
        if status in ["open", "in_progress"]:
            open_count += 1
        elif status in ["resolved", "closed"]:
            resolved_count += 1
            
        # Increment priority
        if priority == "Critical":
            critical += 1
            
        # Increment duplicate alert
        dup_alert = t.get("duplicate_alert", {})
        if isinstance(dup_alert, dict) and dup_alert.get("is_duplicate", False):
            duplicates += 1
            
        # Increment SLA
        if sla == "High" or priority == "Critical":
            sla_breaches += 1
            
        # Increment groupings
        categories[category] = categories.get(category, 0) + 1
        priorities[priority] = priorities.get(priority, 0) + 1
        
        # Standardise sentiment key
        sent_key = sentiment.capitalize() if sentiment else "Neutral"
        if sent_key not in sentiments:
            sentiments[sent_key] = 0
        sentiments[sent_key] += 1

    # Standardize list outputs
    category_list = [CategoryStat(category=k, count=v) for k, v in categories.items()]
    priority_list = [PriorityStat(priority=k, count=v) for k, v in priorities.items()]
    
    # Ensure default categories have 0 counts if not present
    default_categories = [
        "Hardware Issue", "Software Issue", "Network Issue", "Security Issue",
        "Login/Authentication", "HR/Payroll", "Cloud/Server", "Email Issue", "Database Issue"
    ]
    existing_cats = {c.category for c in category_list}
    for cat in default_categories:
        if cat not in existing_cats:
            category_list.append(CategoryStat(category=cat, count=0))
            
    # Ensure default priorities are populated
    default_priorities = ["Low", "Medium", "High", "Critical"]
    existing_prios = {p.priority for p in priority_list}
    for prio in default_priorities:
        if prio not in existing_prios:
            priority_list.append(PriorityStat(priority=prio, count=0))

    return DashboardAnalytics(
        total_tickets=total,
        open_tickets=open_count,
        resolved_tickets=resolved_count,
        critical_tickets=critical,
        duplicate_alerts_count=duplicates,
        category_distribution=category_list,
        priority_distribution=priority_list,
        sla_breaches_predicted=sla_breaches,
        sentiment_counts=sentiments
    )
