import json
import os

# Path to simulated incoming disaster signals
# Use absolute path relative to this file's location
DATA_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../..",
    "data",
    "social_feed.json"
)


def ingest_signals():
    """
    Loads raw disaster-related signals.
    These signals simulate social media posts, SMS, or manual reports.
    """

    with open(DATA_FILE, "r") as file:
        data = json.load(file)

    # Handle both list and dict formats
    if isinstance(data, list):
        return data
    else:
        return data.get("signals", [])
