import { createHash } from 'crypto';
import fetch from 'node-fetch';
import Conf from 'conf';
import { deviceInfo } from './deviceInfo';
import pkgJson from '../package.json';

const userConfig = new Conf();
const userTelemetryDisabled = userConfig.get('telemetry.disabled');

if (userTelemetryDisabled) {
  process.env.KEYSTONE_TELEMETRY_DISABLED = '1';
}

// One way SHA256 hash. When reaching the server any hashed property
// will be rehashed with a salt before storage.
const hashText = (text: string) => {
  return createHash('sha256').update(text).digest('hex');
};

const TELEMETRY_ENDPOINT =
  process.env.KEYSTONE_TELEMETRY_ENDPOINT || 'https://telemetry.keystonejs.com';

export function sendTelemetryEvent(eventType: string, cwd: string) {
  try {
    if (process.env.KEYSTONE_TELEMETRY_DISABLED === '1') {
      return;
    }

    const telemetryUrl = `${TELEMETRY_ENDPOINT}/v1/event`;

    const eventData = {
      ...deviceInfo(),
      keystonePackages: {
        [pkgJson.name]: pkgJson.version,
      },
      pathHash: hashText(cwd),
      eventType,
    };

    if (process.env.KEYSTONE_TELEMETRY_DEBUG === '1') {
      console.log(`[Telemetry]: ${telemetryUrl}`);
      console.log(eventData);
    } else {
      // Do not `await` to keep non-blocking
      fetch(telemetryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
        .then(
          () => {},
          () => {}
        )
        // Catch silently
        .catch(() => {});
    }
  } catch (err) {
    // Fail silently
  }
}
