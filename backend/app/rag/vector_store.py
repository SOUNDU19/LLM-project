import os
import logging
import numpy as np
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("helpdesk.rag")

# Try importing chromadb and sentence_transformers
CHROMA_AVAILABLE = False
SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    logger.warning("chromadb package not available. Using TF-IDF/heuristic vector store.")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("sentence-transformers package not available. Using TF-IDF/heuristic vector store.")

# ----------------------------------------------------
# HEURISTIC / TF-IDF SYSTEM FALLBACK
# ----------------------------------------------------
class HeuristicVectorStore:
    """
    Fallback vector store when SentenceTransformers or ChromaDB is missing.
    Uses bag-of-words / word-overlap Jaccard and TF-IDF similarity.
    """
    def __init__(self):
        self.documents = {}  # doc_id -> {"text": str, "metadata": dict}
        logger.info("Heuristic Vector Store initialized.")

    def add_document(self, doc_id: str, text: str, metadata: dict):
        self.documents[doc_id] = {
            "text": text,
            "metadata": metadata
        }

    def _compute_jaccard_similarity(self, text1: str, text2: str) -> float:
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        if not words1 or not words2:
            return 0.0
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return float(len(intersection)) / len(union)

    def query(self, text: str, n_results: int = 5, filter_dict: dict = None) -> List[Dict]:
        import re
        results = []
        for doc_id, doc in self.documents.items():
            # Apply filter
            if filter_dict:
                skip = False
                for k, v in filter_dict.items():
                    if doc["metadata"].get(k) != v:
                        skip = True
                        break
                if skip:
                    continue
            
            sim = self._compute_jaccard_similarity(text, doc["text"])
            results.append({
                "id": doc_id,
                "text": doc["text"],
                "metadata": doc["metadata"],
                "similarity": sim
            })
        
        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:n_results]

# Initialize Embedding Model and Chroma DB
embedding_model = None
chroma_client = None
collection = None
heuristic_store = None

if CHROMA_AVAILABLE and SENTENCE_TRANSFORMERS_AVAILABLE:
    try:
        # Load lightweight embeddings model (approx 120MB, runs fast on CPU)
        logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create persistent Chroma Client
        chroma_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db_dir")
        os.makedirs(chroma_path, exist_ok=True)
        logger.info(f"Connecting to ChromaDB at: {chroma_path}")
        
        chroma_client = chromadb.PersistentClient(path=chroma_path)
        # Use Cosine similarity metric for duplicate detection
        collection = chroma_client.get_or_create_collection(
            name="helpdesk_tickets",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("ChromaDB persistent collection loaded successfully.")
    except Exception as e:
        logger.error(f"Error initializing ChromaDB: {e}. Switching to heuristic fallback store.")
        CHROMA_AVAILABLE = False
        SENTENCE_TRANSFORMERS_AVAILABLE = False

if not CHROMA_AVAILABLE or not SENTENCE_TRANSFORMERS_AVAILABLE:
    heuristic_store = HeuristicVectorStore()

# ----------------------------------------------------
# MAIN RAG & DUPLICATE API SERVICES
# ----------------------------------------------------
def add_ticket_to_vector_store(ticket_id: str, title: str, description: str, metadata: dict):
    """
    Vectorizes the ticket and stores it in ChromaDB or heuristic store.
    """
    text_content = f"Title: {title} | Description: {description}"
    
    if collection and embedding_model:
        try:
            # Generate embedding
            vector = embedding_model.encode(text_content).tolist()
            # Metadata must only contain str, int, float, bool
            clean_metadata = {k: v for k, v in metadata.items() if isinstance(v, (str, int, float, bool))}
            clean_metadata["ticket_id"] = ticket_id
            
            collection.add(
                ids=[ticket_id],
                embeddings=[vector],
                metadatas=[clean_metadata],
                documents=[text_content]
            )
            logger.info(f"Indexed ticket {ticket_id} in ChromaDB.")
        except Exception as e:
            logger.error(f"Failed to add ticket to ChromaDB: {e}")
    else:
        # Save in heuristic fallback
        heuristic_store.add_document(ticket_id, text_content, metadata)
        logger.info(f"Indexed ticket {ticket_id} in Heuristic store.")

def delete_ticket_from_vector_store(ticket_id: str):
    """
    Removes ticket from ChromaDB / heuristic store.
    """
    if collection:
        try:
            collection.delete(ids=[ticket_id])
            logger.info(f"Deleted ticket {ticket_id} from ChromaDB.")
        except Exception as e:
            logger.error(f"Failed to delete ticket from ChromaDB: {e}")
    elif heuristic_store:
        if ticket_id in heuristic_store.documents:
            del heuristic_store.documents[ticket_id]

def detect_duplicates(title: str, description: str, exclude_id: Optional[str] = None, threshold: float = 0.75) -> dict:
    """
    Checks if there are any semantically similar tickets.
    Returns details on whether it is a duplicate.
    """
    text_content = f"Title: {title} | Description: {description}"
    
    if collection and embedding_model:
        try:
            vector = embedding_model.encode(text_content).tolist()
            results = collection.query(
                query_embeddings=[vector],
                n_results=5
            )
            
            if not results or not results["ids"] or len(results["ids"][0]) == 0:
                return {"is_duplicate": False, "duplicate_of_id": None, "similarity_score": 0.0}
            
            # Chroma returns cosine distance.
            # Cosine similarity = 1.0 - cosine_distance
            # Chroma cosine distance ranges from 0.0 (identical) to 2.0 (opposite).
            distances = results["distances"][0]
            ids = results["ids"][0]
            metadatas = results["metadatas"][0]
            
            for doc_id, dist, meta in zip(ids, distances, metadatas):
                if exclude_id and doc_id == exclude_id:
                    continue
                # Calculate similarity
                similarity = 1.0 - dist
                
                # Check threshold
                if similarity >= threshold:
                    return {
                        "is_duplicate": True,
                        "duplicate_of_id": doc_id,
                        "similarity_score": round(similarity * 100, 2)
                    }
        except Exception as e:
            logger.error(f"Duplicate detection failed: {e}")
    elif heuristic_store:
        results = heuristic_store.query(text_content, n_results=5)
        for res in results:
            if exclude_id and res["id"] == exclude_id:
                continue
            if res["similarity"] >= threshold:
                return {
                    "is_duplicate": True,
                    "duplicate_of_id": res["id"],
                    "similarity_score": round(res["similarity"] * 100, 2)
                }
                
    return {"is_duplicate": False, "duplicate_of_id": None, "similarity_score": 0.0}

def retrieve_solutions_rag(description: str, limit: int = 3) -> List[Dict]:
    """
    Queries vector database for resolved tickets to use as context for RAG solution suggestion.
    """
    results_list = []
    
    if collection and embedding_model:
        try:
            vector = embedding_model.encode(description).tolist()
            # Fetch candidates
            results = collection.query(
                query_embeddings=[vector],
                n_results=10
            )
            if results and results["ids"] and len(results["ids"][0]) > 0:
                ids = results["ids"][0]
                distances = results["distances"][0]
                metadatas = results["metadatas"][0]
                
                for doc_id, dist, meta in zip(ids, distances, metadatas):
                    # We only care about RESOLVED or CLOSED tickets for RAG context
                    if meta.get("status") in ["resolved", "closed"]:
                        sim = 1.0 - dist
                        results_list.append({
                            "id": doc_id,
                            "title": meta.get("title", "Resolved Ticket"),
                            "description": meta.get("description", ""),
                            "suggested_solution": meta.get("suggested_solution", ""),
                            "resolution_notes": meta.get("resolution_notes", ""),
                            "similarity": sim
                        })
                        if len(results_list) >= limit:
                            break
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
    elif heuristic_store:
        candidates = heuristic_store.query(description, n_results=10)
        for res in candidates:
            if res["metadata"].get("status") in ["resolved", "closed"]:
                results_list.append({
                    "id": res["id"],
                    "title": res["metadata"].get("title", "Resolved Ticket"),
                    "description": res["metadata"].get("description", ""),
                    "suggested_solution": res["metadata"].get("suggested_solution", ""),
                    "resolution_notes": res["metadata"].get("resolution_notes", ""),
                    "similarity": res["similarity"]
                })
                if len(results_list) >= limit:
                    break
                    
    return results_list
