import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CINEXUS Error Boundary Caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b0f17] border border-red-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display text-white">Playback & Display Stream Recovered</h2>
              <p className="text-xs text-slate-400">
                A rendering conflict was safely intercepted by the Cinexus engine. Your state and session have been preserved.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 text-left overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin-once" />
              <span>Reload Stream Interface</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
