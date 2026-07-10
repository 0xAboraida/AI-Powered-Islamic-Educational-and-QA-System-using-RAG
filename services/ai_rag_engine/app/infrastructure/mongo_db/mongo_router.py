"""
mongo_router.py
---------------
Maps (domain, madhhab) → correct MongoDB cluster/db/collection.

Architecture:
    Project 1 (cluster1): Fiqh Hanafi + Hanbali
    Project 2 (cluster2): Fiqh Shafii + Maliki
    Project 3 (cluster3): Aqeedah + Tafseer (part 1)
    Project 4 (cluster4): Tafseer (part 2)
    Project 5 (cluster5): Seerah
    Project 6 (cluster6): Tarikh (part 1)
    Project 7 (cluster7): Tarikh (part 2)
    Project 8 (cluster8): Nahw & Sarf
    Project 9 (cluster9): Hadith
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class MongoRouteConfig:
    """All info needed to connect to one MongoDB cluster and fetch a document."""
    uri_env_key: str        # Key in .env (e.g. "MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1")
    db_name: str            # MongoDB database name
    collection_name: str    # MongoDB collection name


# ─────────────────────────────────────────────────────────────────────────────
# Normalization helpers
# ─────────────────────────────────────────────────────────────────────────────

_DOMAIN_MAP: dict[str, str] = {
    # Arabic keywords — with and without "ال" article for robust matching
    "فقه":          "fiqh",
    "عقيدة":       "aqeedah",
    "العقيدة":      "aqeedah",
    "عقيده":       "aqeedah",
    "العقيده":      "aqeedah",
    "تفسير":       "tafseer",
    "التفسير":      "tafseer",
    "سيرة":        "seerah",
    "السيرة":       "seerah",
    "سيره":        "seerah",
    "السيره":       "seerah",
    "تاريخ":       "tarikh",
    "التاريخ":      "tarikh",
    "حديث":        "hadith",
    "الحديث":       "hadith",
    "نحو":         "nahw_sarf",
    "صرف":         "nahw_sarf",
    "النحو والصرف": "nahw_sarf",
    "علوم اللغة": "nahw_sarf",
    "علوم اللغه": "nahw_sarf",
    "علوم لغة": "nahw_sarf",
    "علوم لغه": "nahw_sarf",
    "آداب":        "adab",
    "الآداب":       "adab",
    "الآداب والأخلاق": "adab",
    "علوم قرآن":    "quran_science",
    "علوم القرآن":  "quran_science",
    "علوم قران":    "quran_science",
    "علوم القران":  "quran_science",
    "بلاغة":        "balaghah",
    "البلاغة":       "balaghah",
    "شعر":          "balaghah",
    "الشعر":         "balaghah",
    "البلاغة والشعر": "balaghah",
    # English keywords (lowercase)
    "fiqh":       "fiqh",
    "aqeedah":    "aqeedah",
    "tafseer":    "tafseer",
    "tafsir":     "tafseer",
    "seerah":     "seerah",
    "tarikh":     "tarikh",
    "history":    "tarikh",
    "hadith":     "hadith",
    "nahw":       "nahw_sarf",
    "sarf":       "nahw_sarf",
    "nahw_sarf":  "nahw_sarf",
    "adab":       "adab",
}

_MADHHAB_MAP: dict[str, str] = {
    "حنفي":  "hanafi",
    "حنبلي": "hanbali",
    "مالكي": "maliki",
    "شافعي": "shafii",
    "hanafi":  "hanafi",
    "hanbali": "hanbali",
    "maliki":  "maliki",
    "shafii":  "shafii",
    "shafi'i": "shafii",
}


def _normalize_domain(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    raw_lower = raw.lower().strip()
    # Try full string first
    if raw_lower in _DOMAIN_MAP:
        return _DOMAIN_MAP[raw_lower]
    # Try substring match
    for keyword, normalized in _DOMAIN_MAP.items():
        if keyword in raw_lower:
            return normalized
    return None


def _normalize_madhhab(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    raw_lower = raw.lower().strip()
    if raw_lower in _MADHHAB_MAP:
        return _MADHHAB_MAP[raw_lower]
    for keyword, normalized in _MADHHAB_MAP.items():
        if keyword in raw_lower:
            return normalized
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Routing Table
# Returns a LIST because some domains (tarikh, tafseer) are split across
# multiple clusters. The parent_child retriever will query all of them.
# ─────────────────────────────────────────────────────────────────────────────

_ROUTES: dict[tuple, List[MongoRouteConfig]] = {
    # ── Fiqh (by madhhab) ──────────────────────────────────────────────────
    ("fiqh", "hanafi"): [
        MongoRouteConfig("MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1", "zad_rag_db", "parents_hanafi"),
    ],
    ("fiqh", "hanbali"): [
        MongoRouteConfig("MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1", "zad_rag_db", "parents_hanbali"),
    ],
    ("fiqh", "maliki"): [
        MongoRouteConfig("MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2", "zad_rag_db_shafii_maliki", "parents_maliki"),
    ],
    ("fiqh", "shafii"): [
        MongoRouteConfig("MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2", "zad_rag_db_shafii_maliki", "parents_shafii"),
    ],

    # ── Aqeedah ────────────────────────────────────────────────────────────
    ("aqeedah", None): [
        MongoRouteConfig("MONGO_URI_AQEEDAH_CLUSTER3", "zad_rag_db_aqeedah", "parents_aqeedah"),
    ],

    # ── Tafseer — split across cluster3 and cluster4 ───────────────────────
    ("tafseer", None): [
        MongoRouteConfig("MONGO_URI_AQEEDAH_CLUSTER3",  "zad_rag_db_tafseer", "parents_tafseer"),
        MongoRouteConfig("MONGO_URI_TAFSEER_CLUSTER4",  "zad_rag_db_tafseer", "parents_tafseer"),
    ],

    # ── Seerah ─────────────────────────────────────────────────────────────
    ("seerah", None): [
        MongoRouteConfig("MONGO_URI_SEERAH_CLUSTER5", "zad_rag_db_seerah", "parents_seerah"),
    ],

    # ── Tarikh — split across cluster6 and cluster7 ────────────────────────
    ("tarikh", None): [
        MongoRouteConfig("MONGO_URI_TARIKH_CLUSTER6", "zad_rag_db_tarikh",  "parents_tarikh"),
        MongoRouteConfig("MONGO_URI_TARIKH_CLUSTER7", "zad_rag_db_tarikh2", "parents_tarikh2"),
    ],

    # ── Nahw & Sarf ────────────────────────────────────────────────────────
    ("nahw_sarf", None): [
        MongoRouteConfig("MONGO_URI_TARIKH_CLUSTER8", "zad_rag_db_nahwSarf", "parents_nahwSarf"),
    ],

    # ── Hadith ─────────────────────────────────────────────────────────────
    ("hadith", None): [
        MongoRouteConfig("MONGO_URI_HADITH_CLUSTER9", "zad_rag_db_hadith", "parents_hadith"),
        MongoRouteConfig("MONGO_URI_HADITH_CLUSTER11", "zad_rag_db_hadith2", "parents_hadith2"),
        MongoRouteConfig("MONGO_URI_HADITH_CLUSTER12", "zad_rag_db_hadith3", "parents_hadith3"),
    ],

    # ── Quran Science (Empty for now) ──────────────────────────────────────
    ("quran_science", None): [],

    # ── Balaghah (Empty for now) ───────────────────────────────────────────
    ("balaghah", None): [],

    # # ── آداب وأخلاق ────────────────────────────────────────────────────────
    # # NOTE: Add MONGO_URI_ADAB_CLUSTER10 to .env when this cluster is provisioned
    # ("adab", None): [
    #     MongoRouteConfig("MONGO_URI_ADAB_CLUSTER10", "zad_rag_db_adab", "parents_adab"),
    # ],
}



def get_routes(domain: Optional[str], madhhab: Optional[str]) -> List[MongoRouteConfig]:
    """
    Returns the list of MongoRouteConfig objects for the given domain/madhhab.

    Args:
        domain:   Raw domain string from Qdrant payload metadata (Arabic or English).
        madhhab:  Raw madhhab string from Qdrant payload metadata (Arabic or English).

    Returns:
        List of MongoRouteConfig. Multiple configs mean the data is split
        across clusters (e.g. tarikh, tafseer).

    Raises:
        KeyError: If no route is found for the given combination.
    """
    norm_domain  = _normalize_domain(domain)
    norm_madhhab = _normalize_madhhab(madhhab)

    # Try exact (domain, madhhab) first
    key = (norm_domain, norm_madhhab)
    if key in _ROUTES:
        return _ROUTES[key]

    # Fallback: try (domain, None) — for non-fiqh domains with no madhhab
    fallback_key = (norm_domain, None)
    if fallback_key in _ROUTES:
        return _ROUTES[fallback_key]

    raise KeyError(
        f"No MongoDB route found for domain='{domain}' (normalized: '{norm_domain}'), "
        f"madhhab='{madhhab}' (normalized: '{norm_madhhab}'). "
        f"Please add this combination to mongo_router.py."
    )
