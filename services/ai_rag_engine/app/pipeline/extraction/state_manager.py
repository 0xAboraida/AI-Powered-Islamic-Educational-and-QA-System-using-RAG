import json
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class StateManager:
    """
    Manages the extraction state to ensure zero data loss on crashes.
    Instead of holding last_chunk only in memory, it writes the exact state to a .state file.
    """
    def __init__(self, book_id: int, scratch_dir: Path):
        self.state_file = scratch_dir / f"book_{book_id}.state.json"
        scratch_dir.mkdir(parents=True, exist_ok=True)
        
    def save_state(self, last_page: int, last_chunk: Optional[Dict], prev_context: Dict, chunk_count: int = 1):
        state_data = {
            "last_page": last_page,
            "last_chunk": last_chunk,
            "prev_context": prev_context,
            "chunk_count": chunk_count
        }
        # Atomic write to prevent corruption during crash
        temp_file = self.state_file.with_suffix('.tmp')
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(state_data, f, ensure_ascii=False, indent=2)
        import time
        for attempt in range(10):
            try:
                temp_file.replace(self.state_file)
                break
            except PermissionError:
                if attempt == 9:
                    logger.error(f"Failed to replace state file after {attempt+1} attempts.")
                    raise
                time.sleep(0.05)

    def load_state(self) -> Optional[Dict]:
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load state file: {e}")
        return None

    def clear_state(self):
        if self.state_file.exists():
            self.state_file.unlink()

class JSONStreamer:
    """
    Safely appends to a JSON array file.
    """
    def __init__(self, output_file: Path, reset: bool = False):
        self.output_file = output_file
        self.first_item = True
        if reset and self.output_file.exists():
            self.output_file.unlink()
        self.init_file()

    def init_file(self):
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.output_file.exists():
            with open(self.output_file, 'w', encoding='utf-8') as f:
                f.write('[\n')
            self.first_item = True
        else:
            # Fix JSON array if resuming: strip closing ] and any trailing whitespace
            try:
                with open(self.output_file, 'rb+') as f:
                    # Read tail to find the closing ]
                    f.seek(0, 2)
                    size = f.tell()
                    # Read last 20 bytes to find the ] safely
                    read_size = min(20, size)
                    f.seek(-read_size, 2)
                    tail = f.read()
                    # Find last ] position in the tail
                    bracket_pos = tail.rfind(b']')
                    if bracket_pos != -1:
                        # Truncate file to position of ] (exclusive)
                        new_size = (size - read_size) + bracket_pos
                        f.truncate(new_size)
                        logger.debug(f"Resume: truncated to {new_size} bytes, removed closing ]")
                    else:
                        logger.warning("Resume: closing ] not found in tail, file may be corrupted")
                self.first_item = False
            except Exception as e:
                logger.warning(f"Resume JSON Fix Error: {e}")

    def append(self, chunk: Dict):
        with open(self.output_file, 'a', encoding='utf-8', newline='\n') as f:
            if not self.first_item:
                f.write(',\n')
            json.dump(chunk, f, ensure_ascii=False, indent=2)
            f.flush()
            self.first_item = False

    def close(self):
        if self.output_file.exists():
            with open(self.output_file, 'a', encoding='utf-8', newline='\n') as f:
                f.write('\n]')

