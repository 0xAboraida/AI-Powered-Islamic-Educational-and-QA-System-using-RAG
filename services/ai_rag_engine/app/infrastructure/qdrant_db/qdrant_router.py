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
            "السيرة":          (self.client_1, "zad_seerah_collection"),
            "فقه":             (self.client_1, "zad_sharia_collection_childs"),
            "العقيدة":         (self.client_1, "zad_aqeedah_collection"),
            "التفسير":         (self.client_1, "zad_Tafseer_collection"),
            "الحديث":          (self.client_2, "zad_hadith_collection"),
            "النحو والصرف":    (self.client_2, "zad_nahwSarf_collection"),
            "التاريخ":         (self.client_2, "zad_tarikh_collection"),
            "علوم القران":     (self.client_2, "zad_quranScience_collection"),
            "الآداب والأخلاق": (self.client_2, "zad_adab_collection"),  # NOTE: requires collection creation
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

