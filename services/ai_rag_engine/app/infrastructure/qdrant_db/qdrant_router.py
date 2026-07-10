"""
qdrant_router.py
----------------
Routes Vector Searches to the correct Qdrant Cloud Cluster.

Flow:
    1. Initialization: Connects to multiple Qdrant cloud clusters using API keys from .env.
    2. Mapping: Maintains a dictionary mapping each Islamic domain to its specific cluster and collection name.
    3. Routing: When a search is requested, returns the exact Qdrant client instance and collection to search in.

Why a Router?
    Qdrant Cloud has storage limits on the free tier. To index our massive dataset, 
    we horizontally scaled across multiple free-tier Qdrant clusters. The router abstracts 
    this complexity so the `retrieval_service` just asks for "فقه" and the router automatically 
    directs it to the right server and collection without any complex logic in the retriever.
"""

from typing import Tuple
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_manager import QdrantManager
from services.ai_rag_engine.app.config.settings import settings

class QdrantRouter:
    def __init__(self):
        # Initialize clients for both accounts
        self.client_1 = QdrantManager(url=settings.QDRANT_URL_1, api_key=settings.QDRANT_API_KEY_1)
        self.client_2 = QdrantManager(url=settings.QDRANT_URL_2, api_key=settings.QDRANT_API_KEY_2)

        # Map domain to (client, collection_name)
        self.domain_mapping = {
            "فقه":             (self.client_1, "zad_sharia_collection_childs"),
            "العقيدة":         (self.client_1, "zad_aqeedah_collection"),
            "السيرة":          (self.client_1, "zad_seerah_collection"),
            "التفسير":         (self.client_1, "zad_Tafseer_collection"),
            "الحديث":          (self.client_2, "zad_hadith_collection"),
            "علوم القرآن":     (self.client_2, "zad_quranScience_collection"),
            "التاريخ":         (self.client_2, "zad_tarikh_collection"),
            "علوم اللغة":      (self.client_2, "zad_nahwSarf_collection"),
        }

    def get_client_and_collection(self, domain: str) -> Tuple[QdrantManager, str]:
        """
        Returns the appropriate QdrantManager and collection name for the given domain.

        The domain must be one of the 8 fixed Arabic strings chosen by the user:
            'فقه', 'العقيدة', 'السيرة', 'التفسير',
            'التاريخ', 'الحديث', 'النحو والصرف', 'الآداب والأخلاق'

        Raises:
            ValueError: If the domain is not recognised — fails fast instead of
                        silently routing to the wrong collection.
        """
        if domain in self.domain_mapping:
            return self.domain_mapping[domain]

        raise ValueError(
            f"[QdrantRouter] Unknown domain '{domain}'. "
            f"Valid domains are: {list(self.domain_mapping.keys())}. "
            f"Add the new domain to qdrant_router.py if needed."
        )

try:
    qdrant_router = QdrantRouter()
except Exception as _e:
    import logging
    logging.getLogger(__name__).critical(
        f"[QdrantRouter] ❌ Failed to initialize at startup: {_e}. "
        "Check QDRANT_URL_1/2 and QDRANT_API_KEY_1/2 in your .env file.",
        exc_info=True
    )
    raise

