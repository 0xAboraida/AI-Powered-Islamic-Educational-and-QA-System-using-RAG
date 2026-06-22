import json
import hashlib
from typing import Dict, Any, Optional
import redis
from ..core.base_cache import BaseCache

class RedisCache(BaseCache):
    """
    Redis implementation for embedding cache.
    Hashes the text content and stores dense/sparse vectors.
    """
    
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0, ttl: int = 86400):
        """
        Initializes Redis connection.
        
        Args:
            host (str): Redis host.
            port (int): Redis port.
            db (int): Redis database index.
            ttl (int): Time-to-live for cache entries in seconds (default 24h).
        """
        self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self.ttl = ttl
        
    def _generate_key(self, text: str) -> str:
        """Generates an MD5 hash of the text to use as a Redis key."""
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        return f"embedding:{text_hash}"

    def get(self, text: str) -> Optional[Dict[str, Any]]:
        key = self._generate_key(text)
        cached_data = self.client.get(key)
        if cached_data:
            return json.loads(cached_data)
        return None
        
    def set(self, text: str, embeddings: Dict[str, Any]) -> None:
        key = self._generate_key(text)
        # Store as JSON string with TTL
        self.client.setex(key, self.ttl, json.dumps(embeddings))
