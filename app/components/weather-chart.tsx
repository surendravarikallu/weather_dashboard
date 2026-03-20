"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface WeatherChartProps {
  data: Array<{
    time: string
    temp: number
    condition: string
    humidity: number
  }>
  tempUnit: "C" | "F"
}

function WeatherChart({ data, tempUnit }: WeatherChartProps) {
  const isMobile = useIsMobile()
  
  const convertTemp = (temp: number) => {
    if (tempUnit === "F") {
      return Math.round((temp * 9) / 5 + 32)
    }
    return Math.round(temp)
  }

  const chartData = data.map((item) => ({
    time: item.time,
    temperature: convertTemp(item.temp),
    humidity: item.humidity,
  }))

  // On mobile, only show ticks every 3 or 4 hours to prevent overlapping
  const xAxisInterval = isMobile ? 3 : 0

  return (
    <div className="w-full overflow-hidden">
    <ChartContainer
      config={{
        temperature: {
          label: `Temp (°${tempUnit})`,
          color: "hsl(var(--chart-1))",
        },
        humidity: {
          label: "Hum (%)",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[250px] sm:h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -20, bottom: 0 } : { top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: isMobile ? 10 : 12 }}
            interval={xAxisInterval}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: isMobile ? 10 : 12 }}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
          />
          {!isMobile && <Legend verticalAlign="top" height={36}/>}
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="var(--color-temperature)"
            strokeWidth={isMobile ? 2 : 3}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--color-temperature)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="var(--color-humidity)"
            strokeWidth={isMobile ? 2 : 3}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--color-humidity)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
    </div>
  )
}

export default React.memo(WeatherChart)
