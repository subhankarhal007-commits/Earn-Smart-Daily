import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        readable = `${parsed.error} (${parsed.operationType} on ${parsed.path ?? 'Firestore'})`;
      }
    } catch {
      // Non-JSON error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error) {
    console.error('Application ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
          <div className="max-w-lg w-full border border-slate-200 p-8 bg-slate-50">
            <p className="text-xs font-medium tracking-wider uppercase text-emerald-700 mb-2">
              EarnSmart Daily
            </p>
            <h1 className="font-serif text-2xl font-semibold text-[#0B1B34] mb-3">
              Unable to complete this request
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-medium bg-[#0B1B34] text-white hover:bg-[#14294B] transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
