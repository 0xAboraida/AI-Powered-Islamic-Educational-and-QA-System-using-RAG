import json
import logging
import redis.asyncio as redis
from typing import Optional, Dict, List
from services.ai_rag_engine.app.config.settings import settings

logger = logging.getLogger(__name__)

class RedisMemoryManager:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.ttl = settings.CHAT_HISTORY_TTL
        self._redis: Optional[redis.Redis] = None
        self._redis_available = True
        
        # Fallback In-Memory Storage for local development without Redis
        self._local_memory: Dict[str, List[str]] = {}

    async def get_client(self) -> Optional[redis.Redis]:
        if not self._redis_available:
            return None
            
        if self._redis is None:
            try:
                # Test connection
                temp_redis = redis.from_url(self.redis_url, decode_responses=True)
                await temp_redis.ping()
                self._redis = temp_redis
                logger.info("[MemoryService] Connected to Redis successfully.")
            except Exception as e:
                logger.warning(f"[MemoryService] Redis connection failed: {e}. Falling back to local Python memory for development.")
                self._redis_available = False
                return None
                
        return self._redis

    async def add_interaction(self, session_id: str, user_message: str, ai_response: str) -> None:
        """Adds a user query and AI response to the Redis list (or local memory) for the given session."""
        if not session_id:
            return

        user_interaction = json.dumps({"role": "user", "content": user_message}, ensure_ascii=False)
        ai_interaction = json.dumps({"role": "assistant", "content": ai_response}, ensure_ascii=False)

        client = await self.get_client()
        
        if client:
            # Use Redis
            try:
                key = f"chat_history:{session_id}"
                await client.rpush(key, user_interaction)
                await client.rpush(key, ai_interaction)
                await client.expire(key, self.ttl)
            except Exception as e:
                logger.error(f"[MemoryService] Failed to save interaction to Redis for session '{session_id}': {e}")
        else:
            # Use Local Python Memory
            if session_id not in self._local_memory:
                self._local_memory[session_id] = []
            self._local_memory[session_id].append(user_interaction)
            self._local_memory[session_id].append(ai_interaction)

    async def get_history(self, session_id: str, limit: int = 6) -> str:
        """
        Retrieves the last `limit` messages from Redis (or local memory) and formats them as a string.
        Returns empty string if session_id is None.
        """
        if not session_id:
            return ""

        client = await self.get_client()
        raw_history = []
        
        if client:
            # Use Redis
            try:
                key = f"chat_history:{session_id}"
                start_index = -limit if limit > 0 else 0
                raw_history = await client.lrange(key, start_index, -1)
            except Exception as e:
                logger.warning(f"[MemoryService] Failed to get history from Redis for session '{session_id}': {e}")
        else:
            # Use Local Python Memory
            full_history = self._local_memory.get(session_id, [])
            raw_history = full_history[-limit:] if limit > 0 and full_history else full_history

        if not raw_history:
            return ""

        formatted_history = ""
        for item in raw_history:
            try:
                msg = json.loads(item)
                role = "User" if msg["role"] == "user" else "AI"
                content = msg["content"]
                formatted_history += f"{role}: {content}\n"
            except json.JSONDecodeError:
                continue

        return formatted_history.strip()

    async def clear_history(self, session_id: str) -> None:
        if not session_id:
            return
            
        client = await self.get_client()
        if client:
            try:
                await client.delete(f"chat_history:{session_id}")
            except Exception as e:
                logger.error(f"[MemoryService] Failed to clear history for session '{session_id}': {e}")
        else:
            if session_id in self._local_memory:
                del self._local_memory[session_id]

memory_service = RedisMemoryManager()
