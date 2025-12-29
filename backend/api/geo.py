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
