export const getCurrentLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ lat: null, lon: null, source: "unsupported" });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: "gps"
        });
      },
      () => {
        resolve({ lat: null, lon: null, source: "denied" });
      },
      { timeout: 5000 }
    );
  });
