'use client';

import { Component, type ReactNode } from 'react';

type ClientErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
  onError?: (error: Error) => void;
};

type ClientErrorBoundaryState = {
  hasError: boolean;
};

export class ClientErrorBoundary extends Component<ClientErrorBoundaryProps, ClientErrorBoundaryState> {
  state: ClientErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const label = this.props.label ? ` (${this.props.label})` : '';
    const message = error?.message ?? String(error);
    console.error(`ClientErrorBoundary${label}: ${message}`);
    if (error?.stack) {
      console.error(error.stack);
    }
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
