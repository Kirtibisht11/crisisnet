import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
TRUST_DIR = BASE_DIR / "agents" / "trust"

# Environment-based settings
class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./crisisnet.db"
    )

settings = Settings()  # ✅ REQUIRED

# Trust Agent Configuration
TRUST_CONFIG = {
    "verification_levels": {
        "auto_verify": 0.65,
        "needs_review": 0.45,
        "reject": 0.30
    },
    "scoring_weights": {
        "cross_verification": 0.40,
        "source_reputation": 0.25,
        "duplicate_check": 0.20,
        "rate_limit_penalty": 0.15
    },
    "rate_limits": {
        "max_reports_per_hour": 5,
        "max_reports_per_day": 15,
        "cooldown_minutes": 10
    }
}

DATABASE_CONFIG = {
    "mode": "json",
    "mock_alerts_path": str(TRUST_DIR / "mock_alerts.json"),
    "trust_thresholds_path": str(TRUST_DIR / "trust_thresholds.json")
}

API_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "cors_origins": [
        "http://localhost:3000",
        "http://localhost:5173"
    ]
}

LOG_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
}
