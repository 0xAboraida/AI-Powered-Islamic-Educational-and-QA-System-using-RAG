import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI")

clients: list[AsyncIOMotorClient] = []
db = None
chunk_collections = []
system_cache_collection = None

async def connect_to_mongo():
    global clients, db, chunk_collections, system_cache_collection
    try:
        # Find all MongoDB URIs from the environment variables
        cluster_uris = []
        for key, value in os.environ.items():
            if key.startswith("MONGO_URI") and value and value.startswith("mongodb"):
                cluster_uris.append(value)
                
        # Fallback to default if none found
        if not cluster_uris and MONGO_URI:
            cluster_uris.append(MONGO_URI)
            
        logger.info(f"Found {len(cluster_uris)} MongoDB clusters in environment variables.")

        chunk_collections.clear()
        
        for uri in cluster_uris:
            try:
                client = AsyncIOMotorClient(uri)
                clients.append(client)
                
                dbs = await client.list_database_names()
                
                # Check all databases in this cluster
                for db_name in dbs:
                    if "zad" in db_name.lower() or "rag" in db_name.lower():
                        current_db = client[db_name]
                        cols = await current_db.list_collection_names()
                        
                        for c in cols:
                            if ("parent" in c.lower() or "chunk" in c.lower()) and "system_cache" not in c.lower():
                                chunk_collections.append(current_db[c])
                                
                        # Use the first cluster's zad db for the system_cache
                        if system_cache_collection is None:
                            system_cache_collection = current_db["system_cache"]
                            
            except Exception as cluster_e:
                logger.error(f"Error connecting to cluster {uri}: {cluster_e}")
                
        col_names = [c.name for c in chunk_collections]
        logger.info(f"Successfully connected across clusters! Total Chunk Collections: {len(chunk_collections)} | {col_names}")
    except Exception as e:
        logger.error(f"Error initializing MongoDB clusters: {e}")

async def close_mongo_connection():
    global clients
    for client in clients:
        client.close()
    logger.info("Closed all MongoDB connections.")

async def get_chunk_by_id(chunk_id: str):
    if not chunk_collections:
        raise Exception("Database not initialized or no chunk collections found")
    
    from bson import ObjectId
    
    # Check all collections
    for col in chunk_collections:
        try:
            obj_id = ObjectId(chunk_id)
            doc = await col.find_one({"_id": obj_id})
            if doc: return doc
        except Exception:
            pass
            
        # If not a valid ObjectId or not found, try as string _id
        doc = await col.find_one({"_id": chunk_id})
        if doc: return doc
        
        # Finally try 'id' field if it exists
        doc = await col.find_one({"id": chunk_id})
        if doc: return doc
        
    return None
