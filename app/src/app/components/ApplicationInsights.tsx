'use client';

import { useEffect } from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const ApplicationInsightsConnection = () => {
  useEffect(() => {
    const connectionString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (connectionString) {
      const appInsights = new ApplicationInsights({
        config: {
          connectionString,
          enableAutoRouteTracking: true,
        },
      });
      appInsights.loadAppInsights();
    }
  }, []);

  return null;
};

export default ApplicationInsightsConnection;
