
const NASA_BASE_URL = 'https://api.nasa.gov';
const API_KEY = 'DEMO_KEY'; 

export const fetchAPOD = async () => {
  const response = await fetch(`${NASA_BASE_URL}/planetary/apod?api_key=${API_KEY}`);
  if (!response.ok) throw new Error('Failed to fetch APOD');
  return response.json();
};

export const fetchLocalWeather = async (lat: number, lon: number) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,apparent_temperature,cloud_cover,visibility&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch atmospheric data');
  return response.json();
};

export const fetchSpaceWeather = async () => {
  try {
    // Fetching actual NASA Space Weather Notifications (The "Live Feed")
    const response = await fetch(`${NASA_BASE_URL}/DONKI/notifications?api_key=${API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (error) {
    console.error('NASA DONKI API Error:', error);
  }

  // Fallback data if API fails
  return [
    {
      messageID: "fallback-1",
      messageType: "Report",
      messageIssueTime: new Date().toISOString(),
      messageBody: "Standard background solar wind detected. No major flares in the last 6 hours.",
    },
    {
      messageID: "fallback-2",
      messageType: "Alert",
      messageIssueTime: new Date(Date.now() - 86400000).toISOString(),
      messageBody: "Minor geomagnetic disturbance observed at high latitudes.",
    }
  ];
};

export const fetchNearEarthObjects = async () => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${NASA_BASE_URL}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      const neos = data.near_earth_objects[today];
      if (neos && neos.length > 0) return neos;
    }
  } catch (error) {
    console.error('NASA NEO API Error:', error);
  }

  return [
    {
      id: "demo-neo-1",
      name: "467317 (2000 QW7)",
      estimated_diameter: { kilometers: { estimated_diameter_max: 0.65 } },
      is_potentially_hazardous_asteroid: true,
      close_approach_data: [{
        miss_distance: { kilometers: "5331000", lunar: "13.8" },
        relative_velocity: { kilometers_per_hour: "54200" }
      }],
      neo_reference_id: "2467317"
    }
  ];
};
