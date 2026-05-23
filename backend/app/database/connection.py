import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("helpdesk.database")
logging.basicConfig(level=logging.INFO)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/smart_helpdesk")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "smart_helpdesk")

# ----------------------------------------------------
# IN-MEMORY MOCK MONGODB DATABASE FOR FALLBACK
# ----------------------------------------------------
class MockCollection:
    def __init__(self, name: str):
        self.name = name
        self.data = {}
        self._counter = 1

    async def insert_one(self, document: dict):
        import uuid
        from datetime import datetime
        doc = document.copy()
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        self.data[doc["_id"]] = doc
        # Return an object that has inserted_id attribute
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def find_one(self, query: dict):
        for doc in self.data.values():
            match = True
            for k, v in query.items():
                if k == "_id" and doc.get("_id") != v:
                    match = False
                    break
                elif k != "_id" and doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc.copy()
        return None

    def find(self, query: dict = None):
        query = query or {}
        results = []
        for doc in self.data.values():
            match = True
            for k, v in query.items():
                if k == "_id" and doc.get("_id") != v:
                    match = False
                    break
                elif k != "_id":
                    # Handle basic containment check for nested query
                    if isinstance(v, dict):
                        # Example: {"$gt": val} or {"$regex": val}
                        doc_val = doc.get(k)
                        for op, op_val in v.items():
                            if op == "$regex":
                                import re
                                if not doc_val or not re.search(op_val, str(doc_val), re.IGNORECASE):
                                    match = False
                            elif op == "$ne" and doc_val == op_val:
                                match = False
                            # basic support can be extended
                    elif doc.get(k) != v:
                        match = False
                        break
            if match:
                results.append(doc.copy())
        
        # Mock cursor object
        class MockCursor:
            def __init__(self, docs):
                self.docs = docs
            def sort(self, key, direction=-1):
                # Simple sort by key
                reverse_sort = (direction == -1)
                try:
                    self.docs.sort(key=lambda x: x.get(key, ""), reverse=reverse_sort)
                except Exception:
                    pass
                return self
            def limit(self, limit_num):
                self.docs = self.docs[:limit_num]
                return self
            def __aiter__(self):
                self.index = 0
                return self
            async def __anext__(self):
                if self.index < len(self.docs):
                    res = self.docs[self.index]
                    self.index += 1
                    return res
                else:
                    raise StopAsyncIteration
            async def to_list(self, length: int = 100):
                return self.docs[:length]
        
        return MockCursor(results)

    async def update_one(self, query: dict, update: dict):
        doc = await self.find_one(query)
        if not doc:
            class UpdateResultMock:
                modified_count = 0
                matched_count = 0
            return UpdateResultMock()
        
        target_id = doc["_id"]
        # Standard Mongo update format: {"$set": {...}}
        set_dict = update.get("$set", {})
        for k, v in set_dict.items():
            self.data[target_id][k] = v
        
        class UpdateResultMock:
            modified_count = 1
            matched_count = 1
        return UpdateResultMock()

    async def delete_one(self, query: dict):
        doc = await self.find_one(query)
        if not doc:
            class DeleteResultMock:
                deleted_count = 0
            return DeleteResultMock()
        del self.data[doc["_id"]]
        class DeleteResultMock:
            deleted_count = 1
        return DeleteResultMock()

    async def count_documents(self, query: dict):
        count = 0
        for doc in self.data.values():
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count

    async def aggregate(self, pipeline: list):
        # We can implement basic aggregations if needed, but let's do simple python logic
        # For our specific endpoints (dashboard counts / aggregates)
        # We can inspect the pipeline and return custom stats.
        results = []
        # Support simple grouping
        # E.g. [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        group_stage = None
        for stage in pipeline:
            if "$group" in stage:
                group_stage = stage["$group"]
                break
        
        if group_stage:
            group_field = group_stage["_id"] # e.g. "$category"
            if isinstance(group_field, str) and group_field.startswith("$"):
                field_name = group_field[1:]
                groups = {}
                for doc in self.data.values():
                    val = doc.get(field_name, "Unknown")
                    groups[val] = groups.get(val, 0) + 1
                for name, count in groups.items():
                    results.append({"_id": name, "count": count})
        return results

class MockDatabase:
    def __init__(self):
        self.collections = {}

    def get_collection(self, name: str):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

    def __getitem__(self, name: str):
        return self.get_collection(name)

# ----------------------------------------------------
# DATABASE INITIALIZATION
# ----------------------------------------------------
client = None
db = None
is_mock_db = False

try:
    logger.info(f"Connecting to MongoDB at: {MONGODB_URI}")
    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    try:
        db = client.get_default_database()
        if db is None:
            db = client[MONGODB_DB_NAME]
    except Exception:
        # Atlas URIs without a default database name in the path
        db = client[MONGODB_DB_NAME]
    logger.info(f"Using MongoDB database: {db.name}")
except Exception as e:
    logger.warning(f"MongoDB connection failed: {e}. Falling back to in-memory mock database.")
    db = MockDatabase()
    is_mock_db = True

# Explicit startup check that routes can invoke
async def check_db_connection():
    global db, is_mock_db
    if is_mock_db:
        return False
    try:
        # Trigger an operations to check if client can reach server
        await client.server_info()
        return True
    except Exception as e:
        logger.warning(f"MongoDB connection check failed: {e}. Switching to in-memory database.")
        db = MockDatabase()
        is_mock_db = True
        return False

def get_db():
    return db

def get_collection(name: str):
    return db[name]
