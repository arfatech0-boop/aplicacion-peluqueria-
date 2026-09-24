import React from 'react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
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
    return this.props.children;
  }
}
