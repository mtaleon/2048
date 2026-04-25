import { getBrowserUUID, captureCookieUUID, generateSubmissionID } from './uuid.js';

let API_URL = 'https://api.octile.eu.cc';
let SCORE_URL = API_URL + '/2048/score';
let _scoreEnabled = true;

const QUEUE_KEY = '2048_score_queue_v1';
const MAX_QUEUE = 200;
const FETCH_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 35000; // Initial retry delay from config

/**
 * Apply configuration from config.json
 */
export function applyConfig(config) {
  if (config.workerUrl) {
    API_URL = config.workerUrl;
    SCORE_URL = API_URL + '/2048/score';
  }
  if (config.features?.score_submission === false) {
    _scoreEnabled = false;
  }
}

/**
 * Submit score entry (online immediately, or queue if offline)
 *
 * Entry format:
 * {
 *   final_score: number,
 *   max_tile: number,
 *   moves: number,
 *   time_seconds: number,
 *   browser_uuid: string,
 *   timestamp_utc: string (ISO format),
 *   ota_version_code: number,
 *   platform: string ('android', 'ios', or 'web')
 * }
 */
export async function submitScore(entry) {
  if (!_scoreEnabled) return;

  // Add submission_id if not present
  if (!entry.submission_id) {
    entry.submission_id = generateSubmissionID();
  }

  // Ensure browser_uuid is present
  if (!entry.browser_uuid) {
    entry.browser_uuid = getBrowserUUID();
  }

  // If offline, queue immediately
  if (!navigator.onLine) {
    _queueScore(entry);
    return;
  }

  // Try to send immediately
  try {
    await _sendScore(entry);
  } catch (e) {
    console.warn('Score submission failed, queuing:', e.message);
    _queueScore(entry);
  }
}

/**
 * Send score to backend API
 * @private
 */
async function _sendScore(entry) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(SCORE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '2048-Android/1.0 (Octile)',
      },
      body: JSON.stringify(entry),
      signal: controller.signal,
    });

    // Capture server-issued UUID if provided
    captureCookieUUID(res);

    // Don't retry on client errors (400, 422)
    if (res.status === 400 || res.status === 422) {
      console.warn('Score submission rejected (client error):', res.status);
      return null;
    }

    // Throw on server errors (will trigger retry via queue)
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Add score entry to offline queue
 * @private
 */
function _queueScore(entry) {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push(entry);

    // Cap queue size to prevent unbounded growth
    while (queue.length > MAX_QUEUE) {
      queue.shift();
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('Score queued for retry. Queue size:', queue.length);
  } catch (e) {
    console.error('Failed to queue score:', e);
  }
}

/**
 * Flush offline queue when back online
 * Called on window 'online' event
 * Uses exponential backoff for retries
 */
export async function flushQueue() {
  if (!_scoreEnabled) return;

  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return;

  let queue;
  try {
    queue = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse score queue:', e);
    localStorage.removeItem(QUEUE_KEY);
    return;
  }

  if (queue.length === 0) return;

  console.log('Flushing score queue:', queue.length, 'entries');

  let delay = RETRY_DELAY_MS;
  const maxDelay = 300000; // 5 minutes

  while (queue.length > 0) {
    try {
      await _sendScore(queue[0]);
      queue.shift(); // Remove successfully sent entry
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      delay = RETRY_DELAY_MS; // Reset delay on success
    } catch (e) {
      console.warn('Queue flush failed, retrying with backoff:', e.message);
      // Exponential backoff with jitter
      delay = Math.min(delay * 2, maxDelay) + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  console.log('Score queue flushed successfully');
}
