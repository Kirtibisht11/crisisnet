"""
Social Media Service - Fetch crisis signals from Twitter/Reddit/Telegram
"""

import os
import tweepy
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Crisis keywords to monitor
CRISIS_KEYWORDS = [
    "flood", "flooding", "water rising",
    "fire", "smoke", "burning", "explosion",
    "earthquake", "tremor", "shaking",
    "accident", "crash", "collision",
    "emergency", "help needed", "urgent help",
    "disaster", "trapped", "rescue needed",
    "medical emergency", "ambulance needed"
]

class TwitterService:
    """Twitter/X API Integration"""
    
    def __init__(self):
        self.api_key = os.getenv("TWITTER_API_KEY")
        self.api_secret = os.getenv("TWITTER_API_SECRET")
        self.bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        self.access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        self.access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        
        if not all([self.api_key, self.api_secret, self.bearer_token]):
            logger.warning("Twitter API credentials not found. Service disabled.")
            self.client = None
            return
        
        try:
            # Twitter API v2 client
            self.client = tweepy.Client(
                bearer_token=self.bearer_token,
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret
            )
            logger.info("✅ Twitter API client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Twitter client: {e}")
            self.client = None
    
    def search_recent_tweets(
        self,
        keywords: List[str] = None,
        max_results: int = 10,
        hours_ago: int = 1
    ) -> List[Dict]:
        """
        Search for recent tweets containing crisis keywords
        
        Returns list of normalized signal dicts
        """
        if not self.client:
            logger.warning("Twitter client not initialized")
            return []
        
        if keywords is None:
            keywords = CRISIS_KEYWORDS
        
        signals = []
        
        try:
            # Build query
            query = " OR ".join([f'"{kw}"' for kw in keywords[:5]])  # Max 512 chars
            query += " -is:retweet lang:en"  # Filter out retweets, English only
            
            # Calculate start time
            start_time = datetime.utcnow() - timedelta(hours=hours_ago)
            
            # Search tweets
            response = self.client.search_recent_tweets(
                query=query,
                max_results=max_results,
                start_time=start_time,
                tweet_fields=['created_at', 'author_id', 'geo', 'public_metrics', 'entities'],
                expansions=['author_id', 'geo.place_id'],
                user_fields=['verified', 'public_metrics', 'location']
            )
            
            if not response.data:
                logger.info("No tweets found matching criteria")
                return []
            
            # Extract user info
            users = {user.id: user for user in (response.includes.get('users', []))}
            places = {place.id: place for place in (response.includes.get('places', []))}
            
            # Normalize tweets to our signal format
            for tweet in response.data:
                user = users.get(tweet.author_id)
                
                # Extract location
                location = None
                lat, lon = None, None
                
                if tweet.geo and tweet.geo.get('place_id'):
                    place = places.get(tweet.geo['place_id'])
                    if place:
                        location = place.full_name
                        # Note: Twitter rarely provides exact coordinates
                        if hasattr(place, 'geo') and place.geo:
                            # Extract bounding box center
                            bbox = place.geo.get('bbox', [])
                            if len(bbox) == 4:
                                lon = (bbox[0] + bbox[2]) / 2
                                lat = (bbox[1] + bbox[3]) / 2
                
                # Fallback to user location
                if not location and user and user.location:
                    location = user.location
                
                # Calculate engagement score
                metrics = tweet.public_metrics
                engagement = (
                    metrics.get('like_count', 0) +
                    metrics.get('retweet_count', 0) * 2 +  # Retweets weighted more
                    metrics.get('reply_count', 0)
                )
                
                # Check for media
                has_image = False
                media_urls = []
                if tweet.entities and 'urls' in tweet.entities:
                    for url in tweet.entities['urls']:
                        if url.get('images'):
                            has_image = True
                            media_urls.append(url.get('expanded_url'))
                
                signal = {
                    'source': 'twitter',
                    'external_id': str(tweet.id),
                    'text': tweet.text,
                    'author': user.username if user else None,
                    'author_verified': user.verified if user else False,
                    'location': location,
                    'latitude': lat,
                    'longitude': lon,
                    'has_image': has_image,
                    'media_urls': media_urls,
                    'engagement_score': engagement,
                    'follower_count': user.public_metrics.get('followers_count', 0) if user else 0,
                    'timestamp': tweet.created_at,
                    'raw_data': {
                        'tweet_id': str(tweet.id),
                        'metrics': metrics,
                        'user_id': str(tweet.author_id)
                    }
                }
                
                signals.append(signal)
            
            logger.info(f"✅ Fetched {len(signals)} tweets from Twitter")
            return signals
            
        except Exception as e:
            logger.error(f"Error fetching tweets: {e}")
            return []


class SocialMediaService:
    """Main service coordinating all social media sources"""
    
    def __init__(self):
        self.twitter = TwitterService()
        # Add Reddit, Telegram later
    
    def fetch_all_signals(
        self,
        keywords: List[str] = None,
        max_results: int = 20,
        hours_ago: int = 1
    ) -> List[Dict]:
        """Fetch signals from all available sources"""
        
        all_signals = []
        
        # Twitter
        twitter_signals = self.twitter.search_recent_tweets(
            keywords=keywords,
            max_results=max_results,
            hours_ago=hours_ago
        )
        all_signals.extend(twitter_signals)
        
        # TODO: Add Reddit, Telegram
        
        logger.info(f"✅ Total signals fetched: {len(all_signals)}")
        return all_signals
    
    def save_signals_to_db(self, signals: List[Dict], db):
        """Save signals to database using CRUD"""
        from backend.db.crud import create_social_signal
        
        saved_count = 0
        for signal_data in signals:
            try:
                signal = create_social_signal(db=db, **signal_data)
                saved_count += 1
            except Exception as e:
                logger.error(f"Failed to save signal: {e}")
        
        logger.info(f"✅ Saved {saved_count}/{len(signals)} signals to database")
        return saved_count


# Singleton instance
social_media_service = SocialMediaService()