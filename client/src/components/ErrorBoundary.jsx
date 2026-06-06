import { Component } from 'react';
import { Shield, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Shield size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-surface-400 text-sm mb-6">
              An unexpected error occurred. Don't worry — your data is safe.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 text-left">
                <p className="text-red-400 text-xs font-mono break-all mb-2">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <details className="text-surface-500 text-xs">
                    <summary className="cursor-pointer hover:text-surface-300">Stack trace</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs max-h-48 overflow-y-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleRetry}
                className="btn-primary flex items-center gap-2 text-sm">
                <RefreshCw size={16} /> Try Again
              </button>
              <button onClick={this.handleGoHome}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Home size={16} /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
