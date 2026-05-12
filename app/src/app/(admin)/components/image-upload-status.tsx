import type { ReactNode } from 'react';

import type { ImageUploadStatus } from './image-upload-hook';

type ImageUploadStatusProps = {
  status: ImageUploadStatus;
  statusTestId?: string;
  uploadingMessage?: ReactNode;
  successMessage?: ReactNode;
  errorMessage?: ReactNode;
  quarantinedMessage?: string;
  rateLimitedMessage?: string;
  retryAfterSeconds?: number | null;
  uploadingClassName?: string;
  successClassName?: string;
  errorClassName?: string;
  quarantinedClassName?: string;
  rateLimitedClassName?: string;
  successRole?: 'status' | false;
  successAriaLive?: 'polite' | 'assertive' | 'off';
};

export function ImageUploadStatus({
  status,
  statusTestId,
  uploadingMessage = 'Uploading…',
  successMessage,
  errorMessage,
  quarantinedMessage,
  rateLimitedMessage,
  retryAfterSeconds,
  uploadingClassName = 'text-muted-foreground',
  successClassName = 'text-muted-foreground',
  errorClassName = 'text-destructive',
  quarantinedClassName = 'text-amber-600',
  rateLimitedClassName = 'text-amber-600',
  successRole,
  successAriaLive = 'polite',
}: ImageUploadStatusProps) {
  if (status === 'uploading') {
    return (
      <span className={uploadingClassName} role="status" aria-live="polite" data-testid={statusTestId}>
        {uploadingMessage}
      </span>
    );
  }

  if (status === 'success' && successMessage !== undefined && successMessage !== null) {
    const props = successRole
      ? { role: successRole, 'aria-live': successAriaLive }
      : {};

    return (
      <span className={successClassName} {...props} data-testid={statusTestId}>
        {successMessage}
      </span>
    );
  }

  if (status === 'error' && errorMessage) {
    return (
      <span className={errorClassName} role="alert" aria-live="assertive" data-testid={statusTestId}>
        {errorMessage}
      </span>
    );
  }

  if (status === 'quarantined' && quarantinedMessage) {
    return (
      <span className={quarantinedClassName} data-testid={statusTestId}>
        {quarantinedMessage}
      </span>
    );
  }

  if (status === 'rate-limited' && rateLimitedMessage) {
    const retrySuffix = retryAfterSeconds ? ` Try again in ${retryAfterSeconds}s.` : '';
    return (
      <span className={rateLimitedClassName} data-testid={statusTestId}>
        {rateLimitedMessage}
        {retrySuffix}
      </span>
    );
  }

  return null;
}
