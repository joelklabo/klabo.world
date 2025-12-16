'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const ApplicationInsightsConnection = () => {
  const appInsightsRef = useRef<ApplicationInsights | null>(null);

  // Initialize Application Insights once
  useEffect(() => {
    const connectionString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (connectionString && !appInsightsRef.current) {
      appInsightsRef.current = new ApplicationInsights({
        config: {
          connectionString,
          enableAutoRouteTracking: true,
        },
      });
      appInsightsRef.current.loadAppInsights();
    }
  }, []);

  // Event handler using useCallback to prevent recreating on every render
  // This is the React 19 pattern - stable event handlers with ref access
  const handleClick = useCallback((event: MouseEvent) => {
    const appInsights = appInsightsRef.current;
    if (!appInsights) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;

    const target = event.target as Element | null;
    if (!target) return;

    const clickable = target.closest<HTMLElement>('[data-analytics-event]');
    if (!clickable) return;

    const { analyticsEvent, analyticsLabel, analyticsFeatured } = clickable.dataset;
    if (!analyticsEvent) return;

    const anchor = clickable.closest('a');
    const href = anchor?.getAttribute('href') ?? undefined;

    appInsights.trackEvent(
      { name: analyticsEvent },
      {
        label: analyticsLabel,
        featured: analyticsFeatured,
        href,
      },
    );
  }, []);

  // Set up event listener
  useEffect(() => {
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [handleClick]);

  return null;
};

export default ApplicationInsightsConnection;
