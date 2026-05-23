from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId

from app.database.connection import get_collection
from app.auth.helpers import get_current_user, get_admin_user
from app.models.schemas import TicketCreate, TicketUpdate, TicketResponse
from app.services.ticket_service import process_and_create_ticket, update_ticket_record, delete_ticket_record

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

def format_ticket(doc: dict) -> dict:
    """Helper to convert MongoDB _id to string id for response serialization."""
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(ticket_in: TicketCreate, current_user: dict = Depends(get_current_user)):
    try:
        created = await process_and_create_ticket(ticket_in, current_user)
        return created
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and create ticket: {str(e)}"
        )

@router.get("", response_model=List[TicketResponse])
async def get_tickets(current_user: dict = Depends(get_current_user)):
    tickets_col = get_collection("tickets")
    
    # If admin, fetch all tickets, else only fetch tickets created by the user
    query = {}
    if current_user.get("role") != "Admin":
        query = {"user_id": str(current_user["id"])}
        
    cursor = tickets_col.find(query).sort("created_at", -1)
    tickets = await cursor.to_list(length=200)
    
    return [format_ticket(t) for t in tickets]

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    tickets_col = get_collection("tickets")
    
    try:
        query_id = ObjectId(ticket_id)
    except Exception:
        query_id = ticket_id
        
    ticket = await tickets_col.find_one({"_id": query_id})
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
        
    # Security check: Non-admins can only view their own tickets
    if current_user.get("role") != "Admin" and ticket["user_id"] != str(current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to requested ticket resource"
        )
        
    return format_ticket(ticket)

@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: str, 
    updates: TicketUpdate, 
    current_user: dict = Depends(get_admin_user)
):
    updated = await update_ticket_record(ticket_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found or update failed"
        )
    return updated

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(ticket_id: str, current_user: dict = Depends(get_admin_user)):
    deleted = await delete_ticket_record(ticket_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found or delete failed"
        )
    return

@router.post("/{ticket_id}/merge", response_model=TicketResponse)
async def merge_duplicate_ticket(
    ticket_id: str, 
    parent_id: str, 
    current_user: dict = Depends(get_admin_user)
):
    """
    Closes a duplicate ticket and merges it into the original (parent) ticket.
    """
    tickets_col = get_collection("tickets")
    
    try:
        pid = ObjectId(parent_id)
        tid = ObjectId(ticket_id)
    except Exception:
        pid = parent_id
        tid = ticket_id
        
    # Verify parent ticket exists
    parent = await tickets_col.find_one({"_id": pid})
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent ticket to merge into does not exist"
        )
        
    # Close and mark duplicate ticket
    updates = TicketUpdate(
        status="resolved",
        resolution_notes=f"Ticket closed and merged automatically as duplicate of Ticket #{parent_id}."
    )
    
    updated = await update_ticket_record(ticket_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to update duplicate ticket"
        )
        
    # Update duplicate alert info on DB for record
    await tickets_col.update_one(
        {"_id": tid},
        {"$set": {"duplicate_alert.is_duplicate": True, "duplicate_alert.duplicate_of_id": parent_id}}
    )
    
    updated["duplicate_alert"]["is_duplicate"] = True
    updated["duplicate_alert"]["duplicate_of_id"] = parent_id
    
    return updated
