const COOKIE_KEY = 'octile_cookie_uuid';

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID if available, otherwise fallback to Math.random
 */
function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Get or generate browser UUID for anonymous analytics
 * Stored in localStorage for persistence across sessions
 */
export function getBrowserUUID() {
  let uuid = localStorage.getItem(COOKIE_KEY);
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem(COOKIE_KEY, uuid);
  }
  return uuid;
}

/**
 * Capture server-issued UUID from response header
 * If server provides X-Cookie-UUID, save it for future requests
 */
export function captureCookieUUID(response) {
  if (!response?.headers) return;
  const cookieUUID = response.headers.get('X-Cookie-UUID');
  if (cookieUUID) {
    localStorage.setItem(COOKIE_KEY, cookieUUID);
  }
}

/**
 * Generate a new submission ID for each score submission
 */
export function generateSubmissionID() {
  return generateUUID();
}
