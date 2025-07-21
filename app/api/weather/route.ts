import { type NextRequest, NextResponse } from "next/server"

interface OpenWeatherResponse {
  coord: { lon: number; lat: number }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  base: string
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
    sea_level?: number
    grnd_level?: number
  }
  visibility: number
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  clouds: {
    all: number
  }
  dt: number
  sys: {
    type: number
    id: number
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

interface OneCallResponse {
  lat: number
  lon: number
  timezone: string
  timezone_offset: number
  current: {
    dt: number
    sunrise: number
    sunset: number
    temp: number
    feels_like: number
    pressure: number
    humidity: number
    dew_point: number
    uvi: number
    clouds: number
    visibility: number
    wind_speed: number
    wind_deg: number
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
  }
  hourly: Array<{
    dt: number
    temp: number
    feels_like: number
    pressure: number
    humidity: number
    dew_point: number
    uvi: number
    clouds: number
    visibility: number
    wind_speed: number
    wind_deg: number
    wind_gust?: number
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
    pop: number
  }>
  alerts?: Array<{
    sender_name: string
    event: string
    start: number
    end: number
    description: string
    tags: string[]
  }>
}

const formatUnixTime = (timestamp: number, timezoneOffset = 0): string => {
  const date = new Date((timestamp + timezoneOffset) * 1000)
  return date.toISOString().substr(11, 5) // Returns HH:MM format
}

const kelvinToCelsius = (kelvin: number): number => {
  return Math.round(kelvin - 273.15)
}

const mpsToKmh = (mps: number): number => {
  return Math.round(mps * 3.6)
}

const metersToKm = (meters: number): number => {
  return Math.round(meters / 1000)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    // Use WeatherAPI.com key
    const apiKey = process.env.WEATHERAPI_KEY;
    if (!apiKey) {
      console.error("WeatherAPI key not configured");
      return NextResponse.json(
        { error: "Weather service is not configured. Please contact the administrator." },
        { status: 500 },
      );
    }

    let queryParam = "";
    if (lat && lon) {
      queryParam = `${lat},${lon}`;
    } else if (city) {
      queryParam = city;
    } else {
      return NextResponse.json({ error: "Please provide either a city name or coordinates" }, { status: 400 });
    }

    // Fetch current weather and forecast (7 days)
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(queryParam)}&days=7&aqi=no&alerts=yes`;
    console.log("Fetching weather data from:", url.replace(apiKey, "[API_KEY]"));

    const weatherResponse = await fetch(url, {
      headers: {
        "User-Agent": "SkySense-WeatherApp/1.0",
      },
    });

    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json().catch(() => ({}));
      console.error("WeatherAPI error:", weatherResponse.status, errorData);
      return NextResponse.json(
        { error: `Weather service error: ${errorData.error?.message || "Unknown error"}` },
        { status: weatherResponse.status },
      );
    }

    const data = await weatherResponse.json();
    if (!data.location || !data.current || !data.forecast?.forecastday) {
      return NextResponse.json({ error: "Invalid weather data received from service" }, { status: 502 });
    }

    // Map WeatherAPI.com data to frontend format
    const current = data.current;
    const location = data.location;
    const today = data.forecast.forecastday[0];
    const alerts = data.alerts?.alert || [];

    // Hourly forecast (all 24 hours for today)
    let hourlyForecast = [];
    if (today.hour && Array.isArray(today.hour)) {
      hourlyForecast = today.hour.map((h: any) => ({
        time: h.time.substring(11, 16),
        temp: Math.round(h.temp_c),
        condition: h.condition.text.toLowerCase(),
        humidity: h.humidity,
        windSpeed: Math.round(h.wind_kph),
      }));
    }

    // Tomorrow's forecast (hourly and summary)
    let tomorrowHourlyForecast = [];
    let tomorrowDaySummary = null;
    if (data.forecast.forecastday.length > 1) {
      const tomorrow = data.forecast.forecastday[1];
      if (tomorrow.hour && Array.isArray(tomorrow.hour)) {
        tomorrowHourlyForecast = tomorrow.hour.map((h: any) => ({
          time: h.time.substring(11, 16),
          temp: Math.round(h.temp_c),
          condition: h.condition.text.toLowerCase(),
          humidity: h.humidity,
          windSpeed: Math.round(h.wind_kph),
        }));
      }
      tomorrowDaySummary = {
        temp: Math.round(tomorrow.day.avgtemp_c),
        min: Math.round(tomorrow.day.mintemp_c),
        max: Math.round(tomorrow.day.maxtemp_c),
        condition: tomorrow.day.condition.text.toLowerCase(),
        description: tomorrow.day.condition.text,
        icon: tomorrow.day.condition.icon,
      };
    }

    // 7-day forecast
    const dailyForecast = data.forecast.forecastday.map((day: any) => ({
      dt: day.date_epoch,
      temp: Math.round(day.day.avgtemp_c),
      min: Math.round(day.day.mintemp_c),
      max: Math.round(day.day.maxtemp_c),
      condition: day.day.condition.text.toLowerCase(),
      description: day.day.condition.text,
      icon: day.day.condition.icon,
    }));

    // Alerts
    const mappedAlerts = alerts.map((alert: any) => ({
      title: alert.event || alert.headline || "Alert",
      description: alert.desc?.substring(0, 200) + (alert.desc?.length > 200 ? "..." : "") || "",
      severity: alert.severity || "moderate",
    }));

    // Format the response data
    const formattedResponse = {
      city: location.name,
      country: location.country,
      temperature: Math.round(current.temp_c),
      condition: current.condition.text,
      description: current.condition.text,
      humidity: current.humidity,
      windSpeed: Math.round(current.wind_kph),
      windDirection: current.wind_degree,
      uvIndex: current.uv,
      visibility: Math.round(current.vis_km),
      pressure: current.pressure_mb,
      feelsLike: Math.round(current.feelslike_c),
      high: Math.round(today.day.maxtemp_c),
      low: Math.round(today.day.mintemp_c),
      sunrise: today.astro.sunrise,
      sunset: today.astro.sunset,
      timezone: location.tz_id,
      coordinates: { lat: location.lat, lon: location.lon },
      hourlyForecast: hourlyForecast,
      tomorrowHourlyForecast: tomorrowHourlyForecast,
      tomorrowDaySummary: tomorrowDaySummary,
      dailyForecast: dailyForecast,
      alerts: mappedAlerts.length > 0 ? mappedAlerts : undefined,
    };

    console.log("Successfully processed weather data for:", formattedResponse.city);

    return NextResponse.json(formattedResponse, {
      headers: {
        "Cache-Control": "public, max-age=600", // Cache for 10 minutes
      },
    });
  } catch (error) {
    console.error("Weather API route error:", error);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 408 });
      } else if (error.message.includes("fetch")) {
        return NextResponse.json(
          { error: "Network error. Please check your connection and try again." },
          { status: 503 },
        );
      }
    }
    return NextResponse.json({ error: "An unexpected error occurred while fetching weather data" }, { status: 500 });
  }
}
