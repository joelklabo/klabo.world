'use client';

import { useEffect } from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const ApplicationInsightsConnection = () => {
  useEffect(() => {
    const connectionString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;
    const appInsights = connectionString
      ? new ApplicationInsights({
          config: {
            connectionString,
            enableAutoRouteTracking: true,
          },
        })
      : null;

    if (appInsights) {
      appInsights.loadAppInsights();
    }

    const handler = (event: MouseEvent) => {
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
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
};

export default ApplicationInsightsConnection;
