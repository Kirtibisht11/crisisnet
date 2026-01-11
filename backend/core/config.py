import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./crisisnet.db"
    )

settings = Settings()
