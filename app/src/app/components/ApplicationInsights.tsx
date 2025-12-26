'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import type { Metric } from 'web-vitals';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

const ApplicationInsightsConnection = () => {
  const appInsightsRef = useRef<ApplicationInsights | null>(null);
  const vitalsInitializedRef = useRef(false);

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

  useEffect(() => {
    const appInsights = appInsightsRef.current;
    if (!appInsights || vitalsInitializedRef.current) return;
    const connectionString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (!connectionString) return;

    vitalsInitializedRef.current = true;

    const path = globalThis.location?.pathname ?? '';
    const device = globalThis.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'pointer';

    const reportMetric = (metric: Metric) => {
      appInsights.trackMetric(
        { name: `WebVitals.${metric.name}`, average: metric.value },
        {
          id: metric.id,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
          path,
          device,
        },
      );
    };

    onCLS(reportMetric);
    onFCP(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
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
