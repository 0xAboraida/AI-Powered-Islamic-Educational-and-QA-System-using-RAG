from typing import Dict, Any
from ..core.base import BaseFilter

class MetadataFilter(BaseFilter):
    def __init__(self, target_domain: str):
        self.target_domain = target_domain

    def should_process(self, chunk: Dict[str, Any]) -> bool:
        metadata = chunk.get("metadata", {})
        domain = metadata.get("domain", "")
        return domain == self.target_domain
