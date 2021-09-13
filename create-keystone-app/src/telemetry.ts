import os from 'os';
import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { machineIdSync } from 'node-machine-id';
import currentPkgJson from '../package.json';

// To update default with production endpoint when available
const TELEMETRY_ENDPOINT =
  process.env.TELEMETRY_ENDPOINT || 'http://localhost:4000';

const hashText = (text: string) => {
  return createHash('sha256').update(text).digest('hex');
};

export async function sendTelemetryEvent(
  event: string,
  environment: string,
  cwd: string
) {
  try {
    if (process.env.TELEMETRY_DISABLED === 'true') {
      return;
    }

    const version = currentPkgJson.version;

    const eventData = {
      device: machineIdSync(), // Will be hashed by default
      project: process.env.TELEMETRY_PROJECT || hashText(cwd),
      keystoneVersion: version,
      environment,
      os: os.platform(),
      osLanguage:
        process.env.LC_ALL ||
        process.env.LC_MESSAGES ||
        process.env.LANG ||
        process.env.LANGUAGE,
      event,
    };

    // Do not `await` to keep non-blocking
    fetch(`${TELEMETRY_ENDPOINT}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
      .then()
      .catch(() => {});
  } catch (err) {
    // Fail silently
  }
}
