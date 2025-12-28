# backend/services/location_service.py

from ..core.geo import haversine_distance

class LocationService:

    def find_users_in_radius(self, lat, lon, radius_km, users):
        result = []
        for u in users:
            dist = haversine_distance(
                lat, lon,
                u["latitude"], u["longitude"]
            )
            if dist <= radius_km:
                result.append(u)
        return result

    def find_nearby_volunteers(self, lat, lon, volunteers, max_distance=10):
        volunteers_with_dist = []
        for v in volunteers:
            dist = haversine_distance(
                lat, lon,
                v["latitude"], v["longitude"]
            )
            if dist <= max_distance:
                volunteers_with_dist.append((dist, v))

        volunteers_with_dist.sort(key=lambda x: x[0])
        return [v for _, v in volunteers_with_dist]


location_service = LocationService()