import React from 'react';
import Link from 'next/link';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // analytics.track('error_boundary_triggered', { error: error.message });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-header">
              <div className="error-icon">⚠️</div>
              <h1 className="error-title">Something went wrong</h1>
              <p className="error-message">
                We encountered an unexpected error while loading this page.
              </p>
            </div>

            <div className="error-actions">
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                🔄 Reload Page
              </button>

              <Link href="/" className="btn btn-secondary">
                🏠 Go to Homepage
              </Link>

              <button
                className="btn btn-secondary"
                onClick={() => window.history.back()}
              >
                ← Go Back
              </button>
            </div>

            {/* Technical details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-info">
                  <h4>Error:</h4>
                  <pre>{this.state.error && this.state.error.toString()}</pre>

                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>

                  <h4>Error Stack:</h4>
                  <pre>{this.state.error.stack}</pre>
                </div>
              </details>
            )}

            <div className="error-suggestion">
              <p>
                If this error persists, please{' '}
                <a
                  href="https://github.com/howtomgr/howtomgr.github.io/issues"
                  target="_blank"
                  rel="noopener"
                  className="error-link"
                >
                  report it on GitHub
                </a>
                .
              </p>
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 70vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: var(--space-8) var(--space-4);
              background: var(--bg-primary);
              color: var(--text-primary);
            }

            .error-boundary-content {
              max-width: 600px;
              text-align: center;
            }

            .error-header {
              margin-bottom: var(--space-8);
            }

            .error-icon {
              font-size: 4rem;
              margin-bottom: var(--space-4);
              filter: drop-shadow(0 0 10px rgba(255, 85, 85, 0.3));
            }

            .error-title {
              color: var(--accent-error);
              font-size: var(--font-2xl);
              margin-bottom: var(--space-4);
              font-weight: 600;
            }

            .error-message {
              color: var(--text-secondary);
              font-size: var(--font-lg);
              line-height: 1.6;
              margin-bottom: var(--space-6);
            }

            .error-actions {
              display: flex;
              gap: var(--space-4);
              justify-content: center;
              flex-wrap: wrap;
              margin-bottom: var(--space-8);
            }

            .btn {
              padding: var(--space-3) var(--space-5);
              border-radius: var(--border-radius);
              text-decoration: none;
              font-weight: 500;
              transition: var(--transition);
              border: none;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: var(--space-2);
              min-height: 48px;
              font-size: var(--font-base);
            }

            .btn-primary {
              background: var(--accent-primary);
              color: var(--bg-primary);
            }

            .btn-primary:hover {
              background: var(--accent-secondary);
              transform: translateY(-1px);
            }

            .btn-secondary {
              background: transparent;
              color: var(--accent-primary);
              border: 2px solid var(--accent-primary);
            }

            .btn-secondary:hover {
              background: var(--accent-primary);
              color: var(--bg-primary);
            }

            .error-details {
              margin-top: var(--space-6);
              text-align: left;
              background: var(--bg-surface);
              border-radius: var(--border-radius);
              padding: var(--space-4);
              border: 1px solid var(--accent-error);
            }

            .error-details summary {
              color: var(--accent-warning);
              cursor: pointer;
              font-weight: 600;
              margin-bottom: var(--space-3);
            }

            .error-info h4 {
              color: var(--accent-error);
              margin: var(--space-4) 0 var(--space-2) 0;
              font-size: var(--font-sm);
            }

            .error-info pre {
              background: var(--bg-primary);
              padding: var(--space-3);
              border-radius: var(--border-radius-sm);
              font-family: var(--font-mono);
              font-size: var(--font-xs);
              color: var(--text-secondary);
              overflow-x: auto;
              white-space: pre-wrap;
              margin: 0 0 var(--space-3) 0;
              border: 1px solid var(--bg-surface);
            }

            .error-suggestion {
              margin-top: var(--space-6);
              padding: var(--space-4);
              background: rgba(255, 184, 108, 0.1);
              border-radius: var(--border-radius);
              border-left: 4px solid var(--accent-warning);
            }

            .error-suggestion p {
              margin: 0;
              color: var(--text-primary);
              font-size: var(--font-sm);
            }

            .error-link {
              color: var(--accent-info);
              text-decoration: underline;
            }

            .error-link:hover {
              color: var(--accent-secondary);
            }

            /* Mobile responsiveness */
            @media (max-width: 767px) {
              .error-boundary {
                min-height: 60vh;
                padding: var(--space-6) var(--space-3);
              }

              .error-icon {
                font-size: 3rem;
              }

              .error-title {
                font-size: var(--font-xl);
              }

              .error-message {
                font-size: var(--font-base);
              }

              .error-actions {
                flex-direction: column;
                align-items: center;
              }

              .btn {
                width: 100%;
                max-width: 280px;
              }

              .error-search,
              .error-suggestions,
              .error-details {
                padding: var(--space-4);
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;