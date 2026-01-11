import sys
import os
from datetime import datetime, timezone
import uuid
import random

# Fix for SQLite relative path issue:
# Ensure we are running from the project root so the DB file matches the one used by the running backend.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if os.getcwd() != project_root:
    print(f"📂 Changing working directory to project root: {project_root}")
    os.chdir(project_root)

sys.path.insert(0, project_root)

from backend.db.database import SessionLocal, engine, Base
from backend.db.models import SocialSignal, Crisis

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_raw_signals():
    print(f"🔧 Database Engine URL: {engine.url}")
    db = SessionLocal()
    
    # Clear existing data to ensure clean state
    print("🧹 Clearing existing signals and crises...")
    try:
        db.query(SocialSignal).delete()
        db.query(Crisis).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"⚠️ Note: Could not clear tables (might be empty): {e}")

    print("🌱 Seeding Raw Social Media Signals...")

    # Define authors with implied trust levels for variation
    authors = {
        "official": ["DehradunPolice", "UK_DisasterMgmt", "DM_Dehradun", "TrafficPolice_Doon"],
        "news": ["DoonNews", "AmarUjala_Doon", "News18_UK", "CityUpdate_Doon"],
        "volunteer": ["RedCross_Volunteer", "Doon_Helpers", "Relief_Team_A", "Local_Warden"],
        "citizen": ["amit_kumar_99", "priya_s", "rahul_doon", "concerned_mom", "traveler_joe", "shop_owner_raj"]
    }

    # These are RAW signals (like tweets), not yet processed into Alerts
    raw_signals = [
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Massive explosion at chemical factory in Selaqui! Fire spreading rapidly. Workers trapped!",
            "author": authors["official"][0],
            "location": "Clock Tower, Dehradun",
            "timestamp": datetime.now(timezone.utc),
            "processed": False  # Important: This tells the pipeline to pick it up
        },
        {
            "source": "news_api",
            "external_id": str(uuid.uuid4()),
            "text": "Flash floods in Maldevta washing away shops. Red alert issued for river banks.",
            "author": authors["news"][0],
            "location": "Clement Town",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Bad accident on Rajpur road near diversion. Traffic completely blocked. Ambulance needed.",
            "author": authors["citizen"][0],
            "location": "Rajpur Road",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "facebook",
            "external_id": str(uuid.uuid4()),
            "text": "Landslide reported on Mussoorie Road near Kuthal Gate. Big rocks blocking the way. Avoid this route!",
            "author": authors["volunteer"][0],
            "location": "Kuthal Gate",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Medical emergency at ISBT Dehradun. Bus collision, many injured. Need doctors asap.",
            "author": authors["news"][1],
            "location": "ISBT Dehradun",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "instagram",
            "external_id": str(uuid.uuid4()),
            "text": "Forest fire visible near FRI campus back gate. Dry leaves burning fast.",
            "author": authors["citizen"][1],
            "location": "FRI Campus",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Severe waterlogging at Prince Chowk. Cars are submerged. Traffic is stuck for hours.",
            "author": authors["official"][3],
            "location": "Prince Chowk",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Loud blast heard in Prem Nagar. Looks like a transformer exploded. No electricity in the area.",
            "author": authors["citizen"][2],
            "location": "Prem Nagar",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "news_api",
            "external_id": str(uuid.uuid4()),
            "text": "Bridge connecting Raipur to Ordnance Factory shows dangerous cracks. Authorities alerted.",
            "author": authors["news"][2],
            "location": "Raipur",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Urgent: Food supplies running out at GIC relief camp. 200 people need dinner.",
            "author": authors["volunteer"][1],
            "location": "GIC Dehradun",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Gas leak smell in Patel Nagar industrial area. People coughing and feeling dizzy.",
            "author": authors["citizen"][3],
            "location": "Patel Nagar",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "House on fire in Dalanwala lane 4. Cylinder blast suspected. Fire engines on way.",
            "author": authors["citizen"][4],
            "location": "Dalanwala",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "instagram",
            "external_id": str(uuid.uuid4()),
            "text": "Song river overflowing near Maldevta. Picnic spots are underwater. Stay away from river banks!",
            "author": authors["citizen"][5],
            "location": "Maldevta",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Massive tree fell on New Cantt Road. Power lines down. Road blocked.",
            "author": authors["volunteer"][2],
            "location": "New Cantt Road",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Old building collapsed in Paltan Bazaar. People feared trapped under debris. Police needed.",
            "author": authors["official"][1],
            "location": "Paltan Bazaar",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "telegram",
            "external_id": str(uuid.uuid4()),
            "text": "Suspected food poisoning at wedding in GMS Road. 50+ guests vomiting. Ambulances required.",
            "author": authors["news"][3],
            "location": "GMS Road",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        },
        {
            "source": "twitter",
            "external_id": str(uuid.uuid4()),
            "text": "Wild elephant spotted near Thano road. Charging at vehicles. Forest department alert!",
            "author": authors["volunteer"][3],
            "location": "Thano Road",
            "timestamp": datetime.now(timezone.utc),
            "processed": False
        }
    ]

    count = 0
    for sig in raw_signals:
        new_signal = SocialSignal(
            source=sig["source"],
            external_id=sig["external_id"],
            text=sig["text"],
            author=sig["author"],
            location=sig["location"],
            timestamp=sig["timestamp"],
            processed=False 
        )
        db.add(new_signal)
        count += 1

    # Seed Crises (Alerts) for Authority Dashboard
    print("🌱 Seeding Processed Crises (Alerts) for Dashboard...")
    
    loc_coords = {
        "Clock Tower, Dehradun": (30.3240, 78.0410),
        "Clement Town": (30.2686, 78.0066),
        "Rajpur Road": (30.3500, 78.0600),
        "Kuthal Gate": (30.3800, 78.0800),
        "ISBT Dehradun": (30.2850, 78.0000),
        "FRI Campus": (30.3400, 77.9900),
        "Prince Chowk": (30.3100, 78.0300),
        "Prem Nagar": (30.3300, 77.9600),
        "Raipur": (30.3000, 78.1000),
        "GIC Dehradun": (30.3200, 78.0400),
        "Patel Nagar": (30.3000, 78.0100),
        "Dalanwala": (30.3200, 78.0500),
        "Maldevta": (30.3500, 78.1200),
        "New Cantt Road": (30.3300, 78.0200),
        "Paltan Bazaar": (30.3200, 78.0350),
        "GMS Road": (30.3100, 78.0000),
        "Thano Road": (30.2800, 78.1500)
    }

    for sig in raw_signals:
        # Simple keyword matching for demo
        txt = sig["text"].lower()
        c_type = "other"
        if "fire" in txt: c_type = "fire"
        elif "flood" in txt or "water" in txt or "rain" in txt: c_type = "flood"
        elif "accident" in txt or "collision" in txt: c_type = "medical"
        elif "landslide" in txt: c_type = "landslide"
        elif "earthquake" in txt: c_type = "earthquake"
        elif "wild" in txt: c_type = "wildlife"

        lat, lon = loc_coords.get(sig["location"], (30.3165, 78.0322))

        # Dynamic Severity
        if any(w in txt for w in ["explosion", "blast", "trapped", "collapse", "massive"]):
            severity = "critical"
        elif any(w in txt for w in ["fire", "flood", "severe", "emergency", "accident"]):
            severity = "high"
        elif any(w in txt for w in ["traffic", "blocked", "power", "water"]):
            severity = "medium"
        else:
            severity = "low"

        # Dynamic Trust Score based on author type
        base_trust = 0.6
        if sig["author"] in authors["official"]:
            base_trust = 0.95
        elif sig["author"] in authors["news"]:
            base_trust = 0.85
        elif sig["author"] in authors["volunteer"]:
            base_trust = 0.75
        
        # Add randomness to trust score
        trust_score = min(0.99, max(0.1, base_trust + random.uniform(-0.1, 0.05)))
        
        # Determine verified status
        verified = trust_score > 0.8
        status = "accepted" if verified else "pending"

        new_crisis = Crisis(
            id=f"crisis_{sig['external_id'][:8]}",
            crisis_type=c_type,
            severity=severity,
            title=f"Report at {sig['location']}",
            description=sig["text"],
            location=sig["location"],
            latitude=lat,
            longitude=lon,
            status=status,
            verified=verified,
            trust_score=trust_score,
            created_at=sig["timestamp"]
        )
        db.add(new_crisis)

    db.commit()
    
    # Verify counts to ensure data is actually in the DB
    final_count = db.query(Crisis).count()
    print(f"✅ Seeding complete. Database now contains {final_count} active alerts.")
    db.close()

if __name__ == "__main__":
    seed_raw_signals()