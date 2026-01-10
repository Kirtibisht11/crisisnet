
import json
import os
from typing import List, Dict
from sqlalchemy.orm import Session

from backend.db.database import SessionLocal
from backend.db.crud import get_unprocessed_signals

DATA_PATH = os.path.join("backend", "data", "social_feed.json")


def ingest_signals_from_json() -> List[Dict]:

    if not os.path.exists(DATA_PATH):
        print(f"[Ingestion] Feed file not found at {DATA_PATH}")
        return []

    try:
        with open(DATA_PATH, "r") as f:
            data = json.load(f)

        if not isinstance(data, list):
            print("[Ingestion] Invalid feed format (expected list)")
            return []

        return data

    except json.JSONDecodeError:
        print("[Ingestion] JSON decode error in social_feed.json")
        return []
    except Exception as e:
        print(f"[Ingestion] Unexpected error: {e}")
        return []


def ingest_signals_from_database(db: Session = None) -> List[Dict]:
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    
    try:
        signals = get_unprocessed_signals(db, limit=100)
        
        signal_dicts = []
        for s in signals:
            signal_dict = {
                'id': s.id,
                'source': s.source,
                'text': s.text,
                'location': {
                    'name': s.location or 'Unknown',
                    'lat': s.latitude,
                    'lon': s.longitude
                } if s.latitude and s.longitude else None,
                'lat': s.latitude,
                'lon': s.longitude,
                'has_image': s.has_image,
                'timestamp': s.timestamp.isoformat() if s.timestamp else None,
                'author': s.author,
                'engagement_score': s.engagement_score or 0
            }
            signal_dicts.append(signal_dict)
        
        print(f"[Ingestion] Loaded {len(signal_dicts)} signals from database")
        return signal_dicts
    
    except Exception as e:
        print(f"[Ingestion] Database error: {e}")
        return []
    
    finally:
        if close_db:
            db.close()


def ingest_signals(db: Session = None) -> List[Dict]:

    json_signals = ingest_signals_from_json()
    db_signals = ingest_signals_from_database(db)
    
    all_signals = json_signals + db_signals
    
    print(f"[Ingestion] Total signals: {len(all_signals)} "
          f"(JSON: {len(json_signals)}, DB: {len(db_signals)})")
    
    return all_signals