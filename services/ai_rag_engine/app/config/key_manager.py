import threading
from typing import List
from services.ai_rag_engine.app.config.settings import settings

class APIKeyManager:
    """
    Manages API keys for round-robin rotation to avoid rate limits.
    Thread-safe implementation for use in async/threaded environments.
    """
    def __init__(self, keys_string: str):
        self._keys: List[str] = [k.strip() for k in keys_string.split(",") if k.strip()]
        self._index = 0
        self._lock = threading.Lock()

    def get_next_key(self) -> str:
        """Returns the next available key in a round-robin fashion."""
        if not self._keys:
            return ""
        
        with self._lock:
            key = self._keys[self._index]
            self._index = (self._index + 1) % len(self._keys)
            return key
            
    def get_all_keys(self) -> List[str]:
        """Returns all registered keys."""
        return self._keys.copy()

# Singleton instance of the manager for Gemini
gemini_key_manager = APIKeyManager(settings.GOOGLE_API_KEYS)
