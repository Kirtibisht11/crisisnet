
import schedule
import time
import logging
from datetime import datetime

from backend.db.database import SessionLocal
from backend.services.social_media_service import social_media_service
from backend.agents.detection_agent import run_detection_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fetch_social_media_task():
    logger.info(f"[Scheduler] Starting social media fetch at {datetime.utcnow()}")
    
    db = SessionLocal()
    
    try:

        signals = social_media_service.fetch_all_signals(
            max_results=20,
            hours_ago=1 
        )
        
        saved_count = social_media_service.save_signals_to_db(signals, db)
        
        logger.info(f"[Scheduler] Fetched {len(signals)} signals, saved {saved_count}")
        
    except Exception as e:
        logger.error(f"[Scheduler] Error fetching social media: {e}")
    
    finally:
        db.close()


def run_detection_task():
    logger.info(f"[Scheduler] Starting detection pipeline at {datetime.utcnow()}")
    
    try:
        result = run_detection_pipeline()
        
        alerts_count = len(result.get('alerts', []))
        spikes_count = len(result.get('spikes', []))
        
        logger.info(f"[Scheduler] Detection complete: {alerts_count} alerts, {spikes_count} spikes")
        
    except Exception as e:
        logger.error(f"[Scheduler]  Error running detection: {e}")


def start_scheduler():
    
    logger.info("=" * 60)
    logger.info("STARTING CRISISNET BACKGROUND SCHEDULER")
    logger.info("=" * 60)
    

    schedule.every(5).minutes.do(fetch_social_media_task)  
    schedule.every(10).minutes.do(run_detection_task)     

    logger.info("[Scheduler] Running initial tasks...")
    fetch_social_media_task()
    run_detection_task()
    
    logger.info("[Scheduler] Scheduler started successfully")
    logger.info("[Scheduler] - Social media fetch: Every 5 minutes")
    logger.info("[Scheduler] - Detection pipeline: Every 10 minutes")
    
    while True:
        schedule.run_pending()
        time.sleep(30)  


if __name__ == "__main__":
    start_scheduler()