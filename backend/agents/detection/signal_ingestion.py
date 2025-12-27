"""
Signal Ingestion Module
Loads raw crisis signals from the social feed.
"""

import json
import os

# Path to the social feed file
DATA_PATH = os.path.join("backend", "data", "social_feed.json")


def ingest_signals():
    """
    Loads and returns a list of raw signals.
    Returns empty list if file is missing or invalid.
    """

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
