import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const connectionString = import.meta.env.VITE_APPLICATIONINSIGHTS_CONNECTION_STRING;

export const appInsights = new ApplicationInsights({
    config: {
        connectionString: connectionString,
        enableAutoRouteTracking: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
    }
});

export const initMetrics = () => {
    if (connectionString) {
        appInsights.loadAppInsights();
        appInsights.trackPageView(); // Initial page view
        console.log('Application Insights initialized on frontend');
    } else {
        console.warn('Frontend Application Insights connection string not found (VITE_APPLICATIONINSIGHTS_CONNECTION_STRING)');
    }
};

export const trackEvent = (name: string, properties?: { [key: string]: any }) => {
    // Track in Application Insights
    if (connectionString) {
        appInsights.trackEvent({ name }, properties);
    }

    // Track in Google Analytics (gtag)
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', name, properties);
    }

    console.log(`[Metric] ${name}`, properties);
};

export const trackException = (exception: Error, severityLevel?: number) => {
    if (connectionString) {
        appInsights.trackException({ exception, severityLevel });
    }
    console.error(`[Metric Error]`, exception);
};

export const trackMetric = (name: string, average: number, properties?: { [key: string]: any }) => {
    if (connectionString) {
        appInsights.trackMetric({ name, average }, properties);
    }
};
