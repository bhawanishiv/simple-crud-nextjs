import { getEnvNumericValue } from '@/lib/utils';

const idToRequestCount = new Map<string, number>(); // keeps track of individual users and features
const rateLimiter = {
  windowStart: Date.now(),
};

const DEFAULT_RATE_LIMIT_CONFIG = {
  feature: 'default',
  maxRequests: getEnvNumericValue(process.env.RATE_LIMIT_MAX_REQUESTS, 2),
  windowSize: getEnvNumericValue(
    process.env.RATE_LIMIT_WINDOW_SECONDS,
    24 * 60 * 60 * 1000,
  ), // Milliseconds (currently 1 day)
};

/**
 * Implements a rate-limiting mechanism to restrict the number of requests
 * from a specific IP address for a given feature within a specified time window.
 *
 * @param ip - The IP address of the client making the request. Used to uniquely identify the requester.
 * @param options - Optional configuration for rate limiting.
 * @param options.feature - A string representing the feature being accessed. Defaults to 'default'.
 * @param options.maxRequests - The maximum number of requests allowed within the time window. Defaults to 2.
 * @param options.windowSize - The size of the time window in milliseconds. Defaults to 24 hours (1 day).
 *
 * @returns A boolean indicating whether the request exceeds the rate limit.
 *          Returns `true` if the limit is exceeded, otherwise `false`.
 */
export const rateLimit = (
  ip: string,
  options?: { feature?: string; maxRequests?: number; windowSize?: number },
) => {
  const {
    feature = DEFAULT_RATE_LIMIT_CONFIG.feature,
    maxRequests = DEFAULT_RATE_LIMIT_CONFIG.maxRequests,
    windowSize = DEFAULT_RATE_LIMIT_CONFIG.windowSize,
  } = options || DEFAULT_RATE_LIMIT_CONFIG;
  // Check and update current window

  console.log(
    'idToRequestCount:',
    { windowSize, feature, maxRequests },
    JSON.stringify(Object.fromEntries(idToRequestCount)),
  );
  const now = Date.now();
  const isNewWindow = now - rateLimiter.windowStart > windowSize;

  if (isNewWindow) {
    rateLimiter.windowStart = now;
    idToRequestCount.clear(); // Clear all counts for the new window
  }

  // Generate a unique key for the IP and feature
  const key = `${ip}:${feature}`;

  // Check and update current request limits
  const currentRequestCount = idToRequestCount.get(key) ?? 0;

  if (currentRequestCount >= maxRequests) return true;
  idToRequestCount.set(key, currentRequestCount + 1);

  return false;
};
