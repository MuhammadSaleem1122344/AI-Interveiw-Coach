import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="card max-w-md text-center">
          <h2 className="mb-2">Something went wrong</h2>
          <p className="mb-4 text-muted">{String(this.state.error.message || this.state.error)}</p>
          <button className="btn-primary" onClick={() => location.reload()}>Reload app</button>
        </div>
      </div>
    );
  }
}
