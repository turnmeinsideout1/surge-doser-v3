import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-red-200 shadow p-8 max-w-md w-full text-center">
            <p className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</p>
            <p className="text-sm text-gray-500 mb-6">An unexpected error occurred. Please refresh the page.</p>
            <p className="text-xs text-red-400 font-mono mb-6 break-all">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded text-sm text-white font-medium"
              style={{ backgroundColor: '#1a365d' }}>
              Refresh page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
