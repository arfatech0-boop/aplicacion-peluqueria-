import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    (this as any).setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
          <h2>Algo salió mal (Error de Renderizado)</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>{this.state.error?.toString()}</summary>
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
          <button onClick={() => {
            localStorage.clear();
            window.location.reload();
          }} style={{ marginTop: '20px', padding: '10px', background: '#333', color: 'white' }}>
            Borrar Sesión y Reiniciar
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}
