import sys
import os

# Add project root to path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.main import app