/**
 * Reusable loading states and error components
 */

export function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
  const sizeClasses = {
    small: 'spinner-sm',
    medium: 'spinner-md',
    large: 'spinner-lg'
  };

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]}`} aria-label={message}></div>
      {message && <p className="loading-message">{message}</p>}

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          text-align: center;
        }

        .loading-spinner {
          border: 3px solid var(--bg-surface);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s ease-in-out infinite;
        }

        .spinner-sm {
          width: 20px;
          height: 20px;
          border-width: 2px;
        }

        .spinner-md {
          width: 40px;
          height: 40px;
          border-width: 3px;
        }

        .spinner-lg {
          width: 60px;
          height: 60px;
          border-width: 4px;
        }

        .loading-message {
          margin-top: var(--space-4);
          color: var(--text-secondary);
          font-size: var(--font-sm);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
            border-top-color: var(--accent-primary);
          }
        }
      `}</style>
    </div>
  );
}

export function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  message = 'No content to display',
  actionText = 'Go Home',
  actionHref = '/',
  children
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>

      {children || (
        <a href={actionHref} className="btn btn-primary">
          {actionText}
        </a>
      )}

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-10);
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-4);
          opacity: 0.7;
        }

        .empty-title {
          color: var(--text-primary);
          font-size: var(--font-xl);
          margin-bottom: var(--space-3);
          font-weight: 600;
        }

        .empty-message {
          margin-bottom: var(--space-6);
          font-size: var(--font-base);
          line-height: 1.5;
          max-width: 400px;
        }

        .btn {
          padding: var(--space-3) var(--space-5);
          background: var(--accent-primary);
          color: var(--bg-primary);
          text-decoration: none;
          border-radius: var(--border-radius);
          font-weight: 500;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          min-height: 48px;
        }

        .btn:hover {
          background: var(--accent-secondary);
          transform: translateY(-1px);
          text-decoration: none;
          color: var(--bg-primary);
        }

        @media (max-width: 767px) {
          .empty-state {
            padding: var(--space-8) var(--space-4);
          }

          .empty-icon {
            font-size: 3rem;
          }

          .empty-title {
            font-size: var(--font-lg);
          }

          .empty-message {
            font-size: var(--font-sm);
          }
        }
      `}</style>
    </div>
  );
}

export function ErrorMessage({
  type = 'error',
  title = 'Error',
  message = 'Something went wrong',
  onRetry = null,
  onDismiss = null,
  className = ''
}) {
  const typeStyles = {
    error: {
      background: 'var(--accent-error)',
      icon: '❌'
    },
    warning: {
      background: 'var(--accent-warning)',
      icon: '⚠️'
    },
    info: {
      background: 'var(--accent-info)',
      icon: 'ℹ️'
    }
  };

  const style = typeStyles[type] || typeStyles.error;

  return (
    <div className={`error-message ${className}`}>
      <div className="error-content">
        <div className="error-icon">{style.icon}</div>
        <div className="error-text">
          <h4 className="error-title">{title}</h4>
          <p className="error-description">{message}</p>
        </div>
        <div className="error-actions">
          {onRetry && (
            <button className="error-btn" onClick={onRetry}>
              🔄 Retry
            </button>
          )}
          {onDismiss && (
            <button className="error-btn error-btn-close" onClick={onDismiss}>
              ✕
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .error-message {
          background: ${style.background};
          color: var(--bg-primary);
          border-radius: var(--border-radius);
          padding: var(--space-4);
          margin: var(--space-4) 0;
          box-shadow: var(--box-shadow);
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .error-icon {
          font-size: var(--font-lg);
          flex-shrink: 0;
          margin-top: var(--space-1);
        }

        .error-text {
          flex: 1;
        }

        .error-title {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--font-base);
          font-weight: 600;
          color: inherit;
        }

        .error-description {
          margin: 0;
          font-size: var(--font-sm);
          opacity: 0.9;
          line-height: 1.4;
        }

        .error-actions {
          display: flex;
          gap: var(--space-2);
          flex-shrink: 0;
          margin-top: var(--space-1);
        }

        .error-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: inherit;
          border-radius: var(--border-radius-sm);
          padding: var(--space-1) var(--space-2);
          font-size: var(--font-xs);
          cursor: pointer;
          transition: var(--transition);
          min-height: 32px;
        }

        .error-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .error-btn-close {
          padding: var(--space-1);
          min-width: 32px;
        }

        @media (max-width: 767px) {
          .error-content {
            flex-direction: column;
            text-align: center;
          }

          .error-actions {
            justify-content: center;
            margin-top: var(--space-3);
          }
        }
      `}</style>
    </div>
  );
}

export function NetworkError({ onRetry }) {
  return (
    <ErrorMessage
      type="error"
      title="Network Error"
      message="Unable to load content. Please check your internet connection."
      onRetry={onRetry}
    />
  );
}

export function DataLoadError({ onRetry }) {
  return (
    <ErrorMessage
      type="warning"
      title="Data Load Error"
      message="Failed to load installation guides. This might be temporary."
      onRetry={onRetry}
    />
  );
}