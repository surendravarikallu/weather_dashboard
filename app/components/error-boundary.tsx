"use client"

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
          <Alert className="max-w-md bg-red-900/20 border-red-700 text-red-300">
            <AlertTitle className="text-red-300">Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 text-red-200">
              {this.state.error?.message || "An unexpected error occurred"}
            </AlertDescription>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
