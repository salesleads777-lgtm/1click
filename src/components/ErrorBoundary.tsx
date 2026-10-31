import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled React error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']">
          <div className="max-w-lg w-full bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 inline-block mb-1">
                  System Recovery
                </span>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Display Issue Recovered
                </h1>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              The application encountered an unexpected display issue while processing data. Your session and admin database remain intact.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-700 text-xs font-mono text-amber-200 mb-6 max-h-32 overflow-y-auto">
                {this.state.error.message || 'Unknown render error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleDismiss}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Dismiss & Return</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
