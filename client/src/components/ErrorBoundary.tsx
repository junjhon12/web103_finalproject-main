import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render-time errors anywhere below it so one broken page
// doesn't blank the whole app.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-900">
        <div className="w-full max-w-md p-8 text-center text-white bg-gray-800 rounded-lg shadow-lg">
          <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-gray-400">
            An unexpected error occurred. You can try again or head back to the dashboard.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 font-bold bg-purple-600 rounded hover:bg-purple-700"
            >
              Try again
            </button>
            <a href="/dashboard" className="px-4 py-2 font-bold bg-gray-700 rounded hover:bg-gray-600">
              Go to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}
