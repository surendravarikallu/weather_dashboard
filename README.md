# SkySense - Weather Dashboard

A comprehensive full-stack weather dashboard application built with Next.js, featuring real-time weather data, interactive charts, and a modern dark theme interface.

## Features

### Frontend
- **React.js** with functional components and hooks (useState, useEffect)
- **Search functionality** to enter city names and fetch weather data
- **Auto-fetch weather** using Geolocation API on page load
- **Comprehensive weather display**:
  - City, Temperature, Humidity, Wind Speed
  - Weather Condition with dynamic icons
  - UV Index, Visibility, Pressure
  - Sunrise/Sunset times
- **Interactive charts** showing temperature and humidity trends using Recharts
- **Weather alerts** display (when available)
- **Responsive design** with Tailwind CSS
- **Dark theme** with modern UI components
- **Temperature unit toggle** (Celsius/Fahrenheit)

### Backend (Next.js API Routes)
- **RESTful API** with routes like `/api/weather?city=CityName`
- **OpenWeatherMap API integration** (ready for production)
- **Environment variable support** for API keys
- **Error handling and validation**
- **Geolocation support** for coordinate-based weather fetching

### Additional Features
- **Sidebar navigation** with collapsible menu
- **Real-time clock** and date display
- **Hourly forecast** with weather icons
- **Other cities** weather comparison
- **User profile** dropdown menu
- **Responsive grid layout**
- **Loading states** and error handling

## Getting Started

### Prerequisites
- Node.js 18+ 
- OpenWeatherMap API key (free at https://openweathermap.org/api)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   - Copy `.env.local` and add your OpenWeatherMap API key
   - Update `OPENWEATHER_API_KEY=your_actual_api_key`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Setup

To use real weather data instead of mock data:

1. Get your API key from OpenWeatherMap
2. Update the API route in `app/api/weather/route.ts`
3. Uncomment the real API implementation
4. Add proper error handling for API failures

### Project Structure

\`\`\`
├── app/
│   ├── api/weather/          # Weather API endpoint
│   ├── components/           # React components
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main dashboard page
├── components/ui/           # shadcn/ui components
├── public/                  # Static assets
└── README.md
\`\`\`

## API Integration

The application is designed to work with the OpenWeatherMap API. The current implementation uses mock data for demonstration purposes. To enable real weather data:

1. Sign up for a free API key at OpenWeatherMap
2. Update the environment variables
3. Modify the API route to make actual HTTP requests

## Deployment

This application can be deployed on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Render**

The API key is secured on the server-side and never exposed to the client.

## Technologies Used

- **Next.js 14** - Full-stack React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **OpenWeatherMap API** - Weather data source

## License

MIT License - feel free to use this project for learning and development purposes.
