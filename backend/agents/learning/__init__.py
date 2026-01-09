"""
Learning Agent Module

Responsibilities:
- Learn from past crisis outcomes
- Improve future resource & trust scoring
- Maintain responder reliability
- Track response times and task success/failure
- Feed weights back to Resource & Trust agents
"""

from .learning_agent import LearningAgent
from .metrics import MetricsTracker
from .feedback_loop import FeedbackLoop

__all__ = ['LearningAgent', 'MetricsTracker', 'FeedbackLoop']

# Version
__version__ = '1.0.0'