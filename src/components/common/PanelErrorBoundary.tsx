import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  panelName?: string
  isDark?: boolean
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class PanelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PanelErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      const isDark = this.props.isDark ?? true
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${
          isDark ? 'bg-[#0d0714] text-white' : 'bg-slate-50 text-slate-900'
        }`} dir="rtl">
          <div className={`p-6 rounded-3xl border max-w-md w-full shadow-2xl flex flex-col items-center gap-4 ${
            isDark ? 'bg-[#150a24] border-rose-500/30' : 'bg-white border-rose-200 shadow-xl'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            
            <div className="space-y-1 w-full">
              <h3 className="text-base font-extrabold text-rose-400">
                خطأ في {this.props.panelName || 'هذه الواجهة'}
              </h3>
              <div className="text-[11px] text-rose-200 font-mono text-left dir-ltr p-3 bg-black/60 rounded-xl overflow-auto max-h-48 border border-rose-500/30 whitespace-pre-wrap select-text">
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.error?.stack}
              </div>
            </div>

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>إعادة الفتح والتشغيل</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
