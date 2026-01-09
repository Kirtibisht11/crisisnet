"""
Social Media API Routes - Manual trigger for fetching signals
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from backend.db.database import get_db
from backend.db.crud import get_unprocessed_signals, get_social_signal_stats
from backend.services.social_media_service import social_media_service

router = APIRouter(prefix="/api/social-media", tags=["social-media"])


@router.post("/fetch")
def fetch_social_signals(
    keywords: Optional[str] = None,
    max_results: int = 20,
    hours_ago: int = 1,
    db: Session = Depends(get_db)
):
    """
    Manually trigger social media signal fetching
    
    - **keywords**: Comma-separated keywords (optional, uses defaults)
    - **max_results**: Max tweets to fetch (default: 20)
    - **hours_ago**: How far back to search (default: 1 hour)
    """
    try:
        keyword_list = keywords.split(",") if keywords else None
        
        # Fetch signals
        signals = social_media_service.fetch_all_signals(
            keywords=keyword_list,
            max_results=max_results,
            hours_ago=hours_ago
        )
        
        # Save to database
        saved_count = social_media_service.save_signals_to_db(signals, db)
        
        return {
            "success": True,
            "signals_fetched": len(signals),
            "signals_saved": saved_count,
            "message": f"Fetched {len(signals)} signals, saved {saved_count} to database"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/signals")
def get_signals(
    processed: Optional[bool] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get social media signals from database"""
    
    if processed is False:
        signals = get_unprocessed_signals(db, limit=limit)
    else:
        from backend.db.models import SocialSignal
        query = db.query(SocialSignal)
        if processed is not None:
            query = query.filter(SocialSignal.processed == processed)
        signals = query.order_by(SocialSignal.timestamp.desc()).limit(limit).all()
    
    return {
        "success": True,
        "count": len(signals),
        "signals": [
            {
                "id": s.id,
                "source": s.source,
                "text": s.text,
                "author": s.author,
                "location": s.location,
                "timestamp": s.timestamp.isoformat() if s.timestamp else None,
                "processed": s.processed,
                "engagement_score": s.engagement_score
            }
            for s in signals
        ]
    }


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get social media statistics"""
    
    stats = get_social_signal_stats(db)
    
    return {
        "success": True,
        "statistics": stats
    }