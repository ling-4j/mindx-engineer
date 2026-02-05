import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
        value: webcrypto,
        writable: false,
        configurable: false
    });
}

import 'dotenv/config';
import * as appInsights from 'applicationinsights';

const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

if (connectionString) {
    try {
        appInsights.setup(connectionString)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true, true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setAutoCollectConsole(true, true)
            .setUseDiskRetryCaching(true)
            .setSendLiveMetrics(true)
            .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
            .start();
        console.log('[Instrumentation] Application Insights initialized successfully');
    } catch (error) {
        console.error('[Instrumentation] Failed to initialize Application Insights:', error);
    }
} else {
    console.warn('[Instrumentation] Skipped: APPLICATIONINSIGHTS_CONNECTION_STRING is missing');
}
