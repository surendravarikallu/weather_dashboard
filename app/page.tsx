"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search,
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Eye,
  Calendar,
  Clock,
  Settings,
  BarChart3,
  Globe,
  Loader2,
  AlertTriangle,
  CloudSnow,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import WeatherChart from "./components/weather-chart"
import ErrorBoundary from "./components/error-boundary"
import { parse, differenceInMinutes } from "date-fns"

interface WeatherData {
  city: string
  country: string
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  windDirection: number
  uvIndex: number
  visibility: number
  pressure: number
  feelsLike: number
  high: number
  low: number
  sunrise: string
  sunset: string
  timezone: string
  coordinates: {
    lat: number
    lon: number
  }
  hourlyForecast: Array<{
    time: string
    temp: number
    condition: string
    humidity: number
    windSpeed: number
  }>
  alerts?: Array<{
    title: string
    description: string
    severity: string
  }>
  dailyForecast?: Array<{
    dt: number;
    temp: number;
    min: number;
    max: number;
    condition: string;
    description: string;
    icon: string;
  }>;
  tomorrowDaySummary?: {
    temp: number;
    min: number;
    max: number;
    condition: string;
    description: string;
    icon: string;
  };
  tomorrowHourlyForecast?: Array<{
    time: string;
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  }>;
}

interface OtherCity {
  name: string
  country: string
  temperature: number
  high: number
  low: number
  condition: string
}

const sidebarItems = [
  { icon: BarChart3, label: "Dashboard", id: "dashboard" },
  { icon: Calendar, label: "Forecast", id: "forecast" },
  { icon: MapPin, label: "Map", id: "map" },
  { icon: Globe, label: "Cities", id: "cities" },
  { icon: Settings, label: "Settings", id: "settings" },
]

const otherCities: OtherCity[] = [
  { name: "New York", country: "USA", temperature: 14, high: 23, low: 10, condition: "cloudy" },
  { name: "Dubai", country: "UAE", temperature: 27, high: 23, low: 10, condition: "sunny" },
  { name: "Beijing", country: "China", temperature: 16, high: 23, low: 10, condition: "cloudy" },
  { name: "Toronto", country: "Canada", temperature: 26, high: 23, low: 10, condition: "sunny" },
]

export default function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchCity, setSearchCity] = useState("")
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C")
  const [activeView, setActiveView] = useState("dashboard")
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [lastFetchedCity, setLastFetchedCity] = useState<string>("")
  const [showCoords, setShowCoords] = useState(false)
  const [customCity, setCustomCity] = useState("")

  // Fix hydration mismatch by only setting time on client
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Auto-fetch weather using geolocation on load
    if (mounted && !weatherData && retryCount < 3) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeatherByCoords(position.coords.latitude, position.coords.longitude)
          },
          (geoError) => {
            console.warn("Geolocation failed:", geoError)
            // Fallback to default city if geolocation fails
            fetchWeather("London")
          },
          {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 300000, // 5 minutes
          },
        )
      } else {
        fetchWeather("London")
      }
    }
  }, [mounted, weatherData, retryCount])

  const fetchWeather = useCallback(
    async (city: string) => {
      if (loading || city === lastFetchedCity) return

      setLoading(true)
      setError(null)
      setLastFetchedCity(city)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch weather data`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        if (!data.city || typeof data.temperature !== "number") {
          throw new Error("Invalid weather data received from server")
        }

        setWeatherData(data)
        setRetryCount(0)
        setError(null)
      } catch (error) {
        console.error("Error fetching weather:", error)

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            setError("Request timed out. Please try again.")
          } else if (error.message.includes("404")) {
            setError(`City "${city}" not found. Please check the spelling and try again.`)
          } else if (error.message.includes("401")) {
            setError("API authentication failed. Please check the API configuration.")
          } else if (error.message.includes("429")) {
            setError("Too many requests. Please wait a moment and try again.")
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            setError("Network error. Please check your internet connection and try again.")
          } else {
            setError(error.message || "Failed to fetch weather data")
          }
        } else {
          setError("An unexpected error occurred")
        }

        setRetryCount((prev) => prev + 1)
      } finally {
        setLoading(false)
      }
    },
    [loading, lastFetchedCity],
  )

  const fetchWeatherByCoords = useCallback(
    async (lat: number, lon: number) => {
      if (loading) return

      setLoading(true)
      setError(null)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`, {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch weather data`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        if (!data.city || typeof data.temperature !== "number") {
          throw new Error("Invalid weather data received from server")
        }

        setWeatherData(data)
        setRetryCount(0)
        setError(null)
      } catch (error) {
        console.error("Error fetching weather by coordinates:", error)

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            setError("Request timed out. Please try again.")
          } else {
            setError(error.message || "Failed to fetch weather data")
          }
        } else {
          setError("An unexpected error occurred")
        }

        setRetryCount((prev) => prev + 1)
      } finally {
        setLoading(false)
      }
    },
    [loading],
  )

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const city = searchCity.trim()
      if (city && city.length >= 2) {
        fetchWeather(city)
        setSearchCity("")
      } else {
        setError("Please enter a valid city name (at least 2 characters)")
      }
    },
    [searchCity, fetchWeather],
  )

  const handleRetry = useCallback(() => {
    setError(null)
    setRetryCount(0)
    if (lastFetchedCity) {
      fetchWeather(lastFetchedCity)
    } else {
      fetchWeather("London")
    }
  }, [lastFetchedCity, fetchWeather])

  const convertTemp = useCallback(
    (temp: number) => {
      if (tempUnit === "F") {
        return Math.round((temp * 9) / 5 + 32)
      }
      return Math.round(temp)
    },
    [tempUnit],
  )

  const getWeatherIcon = useCallback((condition: string) => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes("rain") || conditionLower.includes("drizzle") || conditionLower.includes("shower")) {
      return <CloudRain className="w-8 h-8 text-blue-400" />
    } else if (conditionLower.includes("sun") || conditionLower.includes("clear")) {
      return <Sun className="w-8 h-8 text-yellow-400" />
    } else if (conditionLower.includes("snow") || conditionLower.includes("sleet")) {
      return <CloudSnow className="w-8 h-8 text-blue-200" />
    } else if (conditionLower.includes("thunder") || conditionLower.includes("storm")) {
      return <Zap className="w-8 h-8 text-yellow-500" />
    } else {
      return <Cloud className="w-8 h-8 text-gray-400" />
    }
  }, [])

  const formatTime = useCallback((timeString: string, timezone?: string) => {
    try {
      // Handle both Unix timestamp and time string formats
      let date: Date

      if (timeString.includes(":")) {
        // Time string format "HH:MM"
        const [hours, minutes] = timeString.split(":")
        date = new Date()
        date.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0)
      } else {
        // Unix timestamp format
        date = new Date(Number.parseInt(timeString, 10) * 1000)
      }

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone || undefined,
      })
    } catch {
      return timeString
    }
  }, [])

  const getDayName = useCallback(() => {
    if (!currentTime) return ""
    return currentTime.toLocaleDateString("en-US", { weekday: "long" })
  }, [currentTime])

  const getFormattedDate = useCallback(() => {
    if (!currentTime) return ""
    return currentTime.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }, [currentTime])

  const handleNavigation = useCallback((viewId: string) => {
    setActiveView(viewId)
    setError(null)
  }, [])

  const handleCityClick = useCallback(
    (cityName: string) => {
      fetchWeather(cityName)
    },
    [fetchWeather],
  )

  // Helper to parse AM/PM time strings to Date
  const parseTime = (timeStr: string) => {
    // WeatherAPI returns e.g. "5:48 AM"
    return parse(timeStr, "h:mm a", new Date(2000, 0, 1))
  }

  // Helper to get the current hour's forecast if available
  const getCurrentHourForecast = () => {
    if (!weatherData || !weatherData.hourlyForecast) return null;
    const now = new Date();
    const hourStr = now.toTimeString().slice(0, 2) + ":00";
    return weatherData.hourlyForecast.find((h) => h.time === hourStr) || weatherData.hourlyForecast[0];
  };

  // Memoize hourlyForecast for WeatherChart
  const chartData = useMemo(() => {
    if (weatherData && weatherData.hourlyForecast) {
      return weatherData.hourlyForecast.map((item) => ({
        ...item,
        temp: tempUnit === "F" ? Math.round((item.temp * 9) / 5 + 32) : item.temp,
      }))
    }
    return []
  }, [weatherData, tempUnit])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <span className="text-white">Initializing Weather Dashboard...</span>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (activeView === "forecast") {
      return (
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold text-white mb-6">7-Day Forecast</h1>
          {weatherData && weatherData.dailyForecast ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weatherData.dailyForecast.map((day, i) => {
                const date = new Date(day.dt * 1000);
                return (
                  <Card key={i} className="bg-slate-800/50 border-slate-700 text-white">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="font-semibold mb-2">
                          {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        {getWeatherIcon(day.condition)}
                        <div className="text-lg font-bold mt-2">{convertTemp(day.temp)}°</div>
                        <div className="text-sm text-slate-400 capitalize">{day.condition}</div>
                        <div className="text-xs text-slate-500 mt-1">H{convertTemp(day.max)}° L{convertTemp(day.min)}°</div>
                        <div className="text-xs text-slate-500 mt-1 capitalize">{day.description}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-white text-center">No weather data available for forecast</div>
          )}
        </div>
      )
    }

    if (activeView === "map") {
      return (
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold text-white mb-6">Weather Map</h1>
          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Interactive Weather Map</h3>
                <p className="text-slate-400 mb-4">Weather map with radar and satellite imagery coming soon...</p>
                {weatherData && (
                  <div className="text-sm text-slate-300">
                    Current location: {weatherData.city}, {weatherData.country}
                    <br />
                    Coordinates: {weatherData.coordinates.lat.toFixed(2)}, {weatherData.coordinates.lon.toFixed(2)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeView === "cities") {
      return (
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold text-white mb-6">Cities</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCities.map((city, index) => (
              <Card
                key={index}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 cursor-pointer transition-colors"
                onClick={() => handleCityClick(city.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{city.name}</h3>
                      <p className="text-slate-400 text-sm">{city.country}</p>
                      <p className="text-2xl font-bold">{city.temperature}°</p>
                      <p className="text-sm text-slate-400">
                        H{city.high}° L{city.low}°
                      </p>
                    </div>
                    {getWeatherIcon(city.condition)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (activeView === "settings") {
      return (
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span>Temperature Unit</span>
                <div className="flex items-center gap-1 bg-slate-700/50 rounded-full p-1">
                  <Button
                    variant={tempUnit === "C" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTempUnit("C")}
                    className="w-8 h-8 p-0 rounded-full text-xs"
                  >
                    C
                  </Button>
                  <Button
                    variant={tempUnit === "F" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTempUnit("F")}
                    className="w-8 h-8 p-0 rounded-full text-xs"
                  >
                    F
                  </Button>
                </div>
              </div>
              <div className="text-slate-400">
                <p>Weather data updates every 10 minutes</p>
                <p className="mt-2">API Status: {weatherData ? "Connected" : "Disconnected"}</p>
                {weatherData && <p className="mt-1 text-xs">Last updated: {new Date().toLocaleTimeString()}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Default dashboard view
    return (
      <div className="p-6 overflow-auto">
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-700 text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button onClick={handleRetry} size="sm" variant="outline" className="ml-4 bg-transparent">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4 text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-lg">Fetching weather data...</span>
              <span className="text-sm text-slate-400">This may take a few seconds</span>
            </div>
          </div>
        ) : weatherData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Weather */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weather Alerts */}
              {weatherData.alerts && weatherData.alerts.length > 0 && (
                <Alert className="bg-yellow-900/20 border-yellow-700 text-yellow-300">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{weatherData.alerts[0].title}</strong>
                    <br />
                    {weatherData.alerts[0].description}
                  </AlertDescription>
                </Alert>
              )}

              {/* Current Weather Card */}
              <Card className="bg-slate-800/50 border-slate-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                        {weatherData.city}, {weatherData.country}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-700/50 rounded-full p-1">
                      <Button
                        variant={tempUnit === "F" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTempUnit("F")}
                        className="w-8 h-8 p-0 rounded-full text-xs"
                      >
                        F
                      </Button>
                      <Button
                        variant={tempUnit === "C" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTempUnit("C")}
                        className="w-8 h-8 p-0 rounded-full text-xs"
                      >
                        C
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="text-4xl font-bold mb-2">{getDayName()}</div>
                      <div className="text-slate-400 mb-6">{getFormattedDate()}</div>

                      <div className="text-6xl font-bold mb-2">
                        {convertTemp(weatherData.temperature)}°{tempUnit}
                      </div>
                      <div className="text-slate-400">
                        High: {convertTemp(weatherData.high)}° Low: {convertTemp(weatherData.low)}°
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 relative">
                        {getWeatherIcon(weatherData.condition)}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full opacity-60"></div>
                      </div>
                      <div className="text-2xl font-semibold capitalize mb-2">{weatherData.condition}</div>
                      <div className="text-slate-400">Feels Like {convertTemp(weatherData.feelsLike)}°</div>
                      <div className="text-slate-500 text-sm mt-1 capitalize">{weatherData.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Forecast */}
              <Card className="bg-slate-800/50 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Today / Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                    {weatherData.hourlyForecast.map((hour, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center min-w-[80px] p-3 rounded-lg bg-slate-700/50"
                      >
                        <div className="text-sm text-slate-400 mb-2">{hour.time}</div>
                        {getWeatherIcon(hour.condition)}
                        <div className="text-sm font-semibold mt-2">{convertTemp(hour.temp)}°</div>
                        <div className="text-xs text-slate-500">{hour.humidity}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weather Chart */}
              <Card className="bg-slate-800/50 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Temperature & Humidity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary>
                    <WeatherChart data={chartData} tempUnit={tempUnit} />
                  </ErrorBoundary>
                </CardContent>
              </Card>

              {/* Tomorrow's Weather */}
              <Card className="bg-slate-800/50 border-slate-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold mb-1">Tomorrow</div>
                      <div className="text-slate-400 text-sm">Forecast from API</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold">
                        {weatherData.tomorrowDaySummary ? convertTemp(weatherData.tomorrowDaySummary.temp) : "-"}°
                      </div>
                      <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                        {weatherData.tomorrowDaySummary ? getWeatherIcon(weatherData.tomorrowDaySummary.condition) : null}
                      </div>
                    </div>
                  </div>
                  {weatherData.tomorrowDaySummary && (
                    <div className="mt-2 text-xs text-slate-400">
                      High: {convertTemp(weatherData.tomorrowDaySummary.max)}° Low: {convertTemp(weatherData.tomorrowDaySummary.min)}°<br />
                      <span className="capitalize">{weatherData.tomorrowDaySummary.description}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Highlights & Other Cities */}
            <div className="space-y-6">
              {/* Today's Highlights */}
              <Card className="bg-slate-800/50 border-slate-700 text-white">
                <CardHeader>
                  <CardTitle>Today Highlight</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-700/50">
                      <div className="text-sm text-slate-400 mb-2">UV Index</div>
                      <div className="flex items-center gap-2">
                        <Sun className="w-6 h-6 text-yellow-400" />
                        <div className="text-2xl font-bold">{weatherData.uvIndex}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-700/50">
                      <div className="text-sm text-slate-400 mb-2">Humidity</div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-6 h-6 text-blue-400" />
                        <div className="text-2xl font-bold">{getCurrentHourForecast()?.humidity ?? weatherData.humidity}%</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-700/50">
                      <div className="text-sm text-slate-400 mb-2">Wind Status</div>
                      <div className="flex items-center gap-2">
                        <Wind className="w-6 h-6 text-gray-400" />
                        <div className="text-lg font-bold">{getCurrentHourForecast()?.windSpeed ?? weatherData.windSpeed}</div>
                      </div>
                      <div className="text-xs text-slate-400">km/h {weatherData.windDirection}°</div>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-700/50">
                      <div className="text-sm text-slate-400 mb-2">Visibility</div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-6 h-6 text-purple-400" />
                        <div className="text-lg font-bold">{weatherData.visibility}</div>
                      </div>
                      <div className="text-xs text-slate-400">km</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <div className="text-sm text-slate-400 mb-2">Pressure</div>
                    <div className="text-lg font-bold">{weatherData.pressure} hPa</div>
                  </div>
                </CardContent>
              </Card>

              {/* Sunrise/Sunset */}
              <Card className="bg-slate-800/50 border-slate-700 text-white">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Sunrise</div>
                      <div className="text-2xl font-bold">{weatherData.sunrise}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Sunset</div>
                      <div className="text-2xl font-bold">{weatherData.sunset}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Length of day</div>
                      <div className="text-lg font-semibold">
                        {(() => {
                          try {
                            const sunrise = parseTime(weatherData.sunrise)
                            const sunset = parseTime(weatherData.sunset)
                            const diff = differenceInMinutes(sunset, sunrise)
                            const hours = Math.floor(diff / 60)
                            const minutes = diff % 60
                            return `${hours}h ${minutes}m`
                          } catch {
                            return "-"
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Cities */}
              <Card className="bg-slate-800/50 border-slate-700 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Other Cities</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300"
                      onClick={() => handleNavigation("cities")}
                    >
                      Show All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {otherCities.map((city, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 cursor-pointer transition-colors"
                      onClick={() => handleCityClick(city.name)}
                    >
                      <div>
                        <div className="font-semibold">{city.temperature}°</div>
                        <div className="text-sm text-slate-400">
                          H{city.high}° L{city.low}°
                        </div>
                        <div className="text-sm text-slate-300">{city.name}</div>
                      </div>
                      <div className="flex items-center gap-2">{getWeatherIcon(city.condition)}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-white">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
            <div className="text-lg mb-2">No weather data available</div>
            <div className="text-sm text-slate-400 mb-4">Please search for a city or allow location access</div>
            <Button onClick={() => fetchWeather("London")} className="bg-purple-600 hover:bg-purple-700">
              Load Default Location
            </Button>
          </div>
        )}
        {weatherData && (
          <div className="flex items-center gap-2 mb-2">
            <Button size="sm" variant="ghost" onClick={() => setShowCoords((v) => !v)}>
              {showCoords ? "Hide Coords" : "Show Coords"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCustomCity(weatherData.city)}>
              Override City
            </Button>
            {showCoords && (
              <span className="text-xs text-slate-400">
                ({weatherData.coordinates.lat.toFixed(4)}, {weatherData.coordinates.lon.toFixed(4)})
              </span>
            )}
            {customCity && (
              <span className="text-xs text-purple-400 ml-2">Custom City: {customCity}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex w-full min-h-screen">
          {/* Fixed Sidebar */}
          <div className="w-64 bg-slate-900/50 border-r border-slate-700/50 flex-shrink-0">
            <div className="p-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SkySense</span>
              </div>
            </div>
            <nav className="px-4 space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeView === item.id
                      ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-900/30">
              <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search City..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      disabled={loading}
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 w-64"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !searchCity.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </form>
              </div>
            </header>

            {/* Dynamic Content */}
            <main className="flex-1 overflow-hidden">{renderContent()}</main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
