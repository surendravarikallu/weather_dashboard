"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import React from "react"

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

  return (
    <ChartContainer
      config={{
        temperature: {
          label: `Temperature (°${tempUnit})`,
          color: "hsl(var(--chart-1))",
        },
        humidity: {
          label: "Humidity (%)",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <ChartTooltip
            content={<ChartTooltipContent />}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
          />
          <Line
            type="linear"
            dataKey="temperature"
            stroke="var(--color-temperature)"
            strokeWidth={3}
            dot={{ fill: "var(--color-temperature)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "var(--color-temperature)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="humidity"
            stroke="var(--color-humidity)"
            strokeWidth={3}
            dot={{ fill: "var(--color-humidity)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "var(--color-humidity)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export default React.memo(WeatherChart)
