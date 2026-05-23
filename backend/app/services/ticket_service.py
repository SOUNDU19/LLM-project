import logging
from datetime import datetime
from typing import List, Dict, Optional
from bson import ObjectId

from app.database.connection import get_collection
from app.llm.groq_client import analyze_ticket_complaint, client as groq_client, MODEL_NAME
from app.rag.vector_store import (
    add_ticket_to_vector_store,
    detect_duplicates,
    retrieve_solutions_rag,
    delete_ticket_from_vector_store
)
from app.models.schemas import TicketCreate, TicketUpdate, DuplicateAlert

logger = logging.getLogger("helpdesk.service")

async def process_and_create_ticket(ticket_in: TicketCreate, user: dict) -> dict:
    """
    Core pipeline to digest a user's natural language request, run translation, 
    extract categories/priority, run duplicate checks, fetch RAG solutions, and save.
    """
    description = ticket_in.description
    logger.info(f"Processing ticket creation request for user '{user['email']}'.")

    # 1. Run LLM Structured Analysis & Multi-Language Detection/Translation
    ai_details = await analyze_ticket_complaint(description)
    
    title = ai_details.get("title", "Support Request")
    summary = ai_details.get("summary", "")
    category = ai_details.get("category", "Software Issue")
    subcategory = ai_details.get("subcategory", "General")
    priority = ai_details.get("priority", "Medium")
    department = ai_details.get("department", "IT Support")
    tags = ai_details.get("tags", [])
    reasoning = ai_details.get("reasoning", "")
    suggested_solution = ai_details.get("suggested_solution", "")
    sentiment = ai_details.get("sentiment", "Neutral")
    escalation_predicted = ai_details.get("escalation_predicted", False)
    sla_risk_level = ai_details.get("sla_risk_level", "Low")
    
    detected_lang = ai_details.get("detected_language", "English")
    translated_description = ai_details.get("translated_text", description)
    
    # 2. RAG Solution Suggestion (Retrieve Context from Vector DB)
    # Search Chroma for resolved tickets with similar descriptions
    similar_resolved = retrieve_solutions_rag(translated_description, limit=2)
    
    # If we have resolved context, refine the suggested solution using LLM RAG
    if similar_resolved and groq_client:
        try:
            context_str = ""
            for i, item in enumerate(similar_resolved):
                context_str += f"Resolved Ticket {i+1}:\n"
                context_str += f"Problem: {item['description']}\n"
                context_str += f"Resolution Solution: {item['suggested_solution']}\n"
                if item.get("resolution_notes"):
                    context_str += f"Admin Resolution Notes: {item['resolution_notes']}\n"
                context_str += "\n"
            
            rag_prompt = f"""You are an enterprise helpdesk support assistant. We have a new user ticket complaint. We also found similar resolved tickets from our history. 
Your task is to review the resolved tickets and synthesize a highly specific, tailored suggested solution for the new ticket.

New Ticket Description:
"{translated_description}"

Reference Past Resolutions:
{context_str}

Respond with only the customized suggested solution (1-3 sentences). Keep it actionable and technical. Do not say "Based on the reference tickets".
"""
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a professional IT support engineer."},
                    {"role": "user", "content": rag_prompt}
                ],
                model=MODEL_NAME,
                temperature=0.2
            )
            suggested_solution = chat_completion.choices[0].message.content.strip()
            logger.info("Customized RAG suggested solution created successfully.")
        except Exception as e:
            logger.error(f"Error generating custom RAG suggested solution: {e}")
            # Keep the initial suggested solution as fallback
    
    # 3. Duplicate Detection
    dup_details = detect_duplicates(title, translated_description)
    is_dup = dup_details.get("is_duplicate", False)
    dup_id = dup_details.get("duplicate_of_id")
    sim_score = dup_details.get("similarity_score", 0.0)
    
    # 4. Save Ticket Record in MongoDB
    tickets_col = get_collection("tickets")
    
    ticket_doc = {
        "user_id": str(user["id"]),
        "user_email": user["email"],
        "user_fullname": user["fullname"],
        "description": description,
        "language": detected_lang,
        "translated_description": translated_description if detected_lang != "English" else None,
        "title": title,
        "summary": summary,
        "category": category,
        "subcategory": subcategory,
        "priority": priority,
        "department": department,
        "tags": tags,
        "reasoning": reasoning,
        "suggested_solution": suggested_solution,
        "sentiment": sentiment,
        "escalation_predicted": escalation_predicted,
        "sla_risk_level": sla_risk_level,
        "status": "open",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "resolution_notes": None,
        "duplicate_alert": {
            "is_duplicate": is_dup,
            "duplicate_of_id": dup_id,
            "similarity_score": sim_score
        }
    }
    
    result = await tickets_col.insert_one(ticket_doc)
    ticket_id = str(result.inserted_id)
    ticket_doc["id"] = ticket_id
    ticket_doc.pop("_id", None)
    
    # 5. Index Ticket inside ChromaDB Vector Store
    # We index it so future tickets can be compared to this one.
    meta = {
        "title": title,
        "description": translated_description,
        "status": "open",
        "category": category,
        "priority": priority,
        "suggested_solution": suggested_solution,
        "resolution_notes": ""
    }
    add_ticket_to_vector_store(ticket_id, title, translated_description, meta)
    
    return ticket_doc

async def update_ticket_record(ticket_id: str, updates: TicketUpdate) -> Optional[dict]:
    """
    Updates status, priority, category, or resolution notes of a ticket, and syncing with ChromaDB.
    """
    tickets_col = get_collection("tickets")
    
    try:
        query_id = ObjectId(ticket_id)
    except Exception:
        # Check if it's a string uuid matching in Mock
        query_id = ticket_id

    existing = await tickets_col.find_one({"_id": query_id})
    if not existing:
        return None
        
    update_data = {}
    if updates.status is not None:
        update_data["status"] = updates.status
    if updates.priority is not None:
        update_data["priority"] = updates.priority
    if updates.category is not None:
        update_data["category"] = updates.category
    if updates.department is not None:
        update_data["department"] = updates.department
    if updates.resolution_notes is not None:
        update_data["resolution_notes"] = updates.resolution_notes
        
    if not update_data:
        # Serialise ID
        existing["id"] = str(existing["_id"])
        existing.pop("_id", None)
        return existing
        
    update_data["updated_at"] = datetime.utcnow()
    
    await tickets_col.update_one({"_id": query_id}, {"$set": update_data})
    
    # Fetch updated document
    updated_doc = await tickets_col.find_one({"_id": query_id})
    updated_doc["id"] = str(updated_doc["_id"])
    updated_doc.pop("_id", None)
    
    # Sync with ChromaDB Vector Store
    meta = {
        "title": updated_doc["title"],
        "description": updated_doc["translated_description"] or updated_doc["description"],
        "status": updated_doc["status"],
        "category": updated_doc["category"],
        "priority": updated_doc["priority"],
        "suggested_solution": updated_doc["suggested_solution"],
        "resolution_notes": updated_doc["resolution_notes"] or ""
    }
    add_ticket_to_vector_store(
        updated_doc["id"], 
        updated_doc["title"], 
        updated_doc["translated_description"] or updated_doc["description"], 
        meta
    )
    
    return updated_doc

async def delete_ticket_record(ticket_id: str) -> bool:
    """
    Deletes the ticket from DB and Vector database.
    """
    tickets_col = get_collection("tickets")
    
    try:
        query_id = ObjectId(ticket_id)
    except Exception:
        query_id = ticket_id

    result = await tickets_col.delete_one({"_id": query_id})
    if result.deleted_count > 0:
        delete_ticket_from_vector_store(ticket_id)
        return True
    return False
