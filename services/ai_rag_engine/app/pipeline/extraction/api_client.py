import requests
from requests.adapters import HTTPAdapter
# pyrefly: ignore [missing-import]
from urllib3.util.retry import Retry
# pyrefly: ignore [missing-import]
import urllib3
import logging

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

class KetabOnlineAPIClient:
    def __init__(self, retries=5, backoff_factor=1):
        self.session = requests.Session()
        retry_strategy = Retry(
            total=retries,
            backoff_factor=backoff_factor,
            status_forcelist=[500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        self.session.mount('https://', HTTPAdapter(max_retries=retry_strategy))
        self.headers = {'User-Agent': 'Mozilla/5.0'}

    def get(self, url: str):
        try:
            r = self.session.get(url, headers=self.headers, timeout=15, verify=False)
            r.raise_for_status()
            return r
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
