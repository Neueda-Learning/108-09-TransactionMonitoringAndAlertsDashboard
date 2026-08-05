import { useState } from 'react';

export default function ErrorState({
  message = 'Something went wrong.',
  error = '',
  onRetry,
  retryLabel = 'Retry'
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const technicalDetails = typeof error === 'string' ? error : error ? String(error) : '';

  return (
    <div className="error-state" role="alert">
      <p className="error-state-message">{message}</p>

      <div className="error-state-actions">
        {onRetry ? (
          <button className="btn" type="button" onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}

        {technicalDetails ? (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setShowTechnicalDetails((previous) => !previous)}
            aria-expanded={showTechnicalDetails}
          >
            {showTechnicalDetails ? 'Hide technical details' : 'Show technical details'}
          </button>
        ) : null}
      </div>

      {showTechnicalDetails && technicalDetails ? (
        <pre className="error-state-details">{technicalDetails}</pre>
      ) : null}
    </div>
  );
}

