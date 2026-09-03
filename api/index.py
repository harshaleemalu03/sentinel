import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / "incident-intelligence"
sys.path.insert(0, str(backend_path))

from src.main import app
