import httpx
from fastapi import APIRouter, HTTPException
import json
from backend.core.geo import haversine_distance

router = APIRouter(prefix="/api/geo", tags=["geo"])

@router.get("/nearest-shelter")
def nearest_shelter(lat: float, lng: float):
    try:
        with open("resources.json") as f:
            resources = json.load(f)

        shelters = [r for r in resources if r.get("type") == "shelter"]

        if not shelters:
            raise HTTPException(status_code=404, detail="No shelters available")

        shelters.sort(
            key=lambda s: haversine_distance(
                lat, lng,
                s["location"]["lat"],
                s["location"]["lon"]
            )
        )

        return shelters[0]

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="resources.json not found")


@router.get("/location")
async def get_user_location():
    """
    Proxy endpoint to fetch user location from IP.
    Helps avoid CORS issues and provides fallback.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Attempt 1: ipapi.co
            resp = await client.get("https://ipapi.co/json/", timeout=3.0)
            if resp.status_code == 200:
                return resp.json()
            
            # Attempt 2: ip-api.com (Fallback)
            resp = await client.get("http://ip-api.com/json/", timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                return {"latitude": data.get("lat"), "longitude": data.get("lon")}
                
    except Exception:
        pass
    
    return {"latitude": None, "longitude": None}
