import os from 'os';
import { machineIdSync } from 'node-machine-id';

// Get locale from process settings and remove any encoding
// e.g. en_AU.UTF8 => en_AU
const locale = () => {
  const env = process.env;
  const localeWithEncoding =
    env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE || env.LC_NAME;

  if (!localeWithEncoding) {
    return null;
  }

  const encodingIndex = localeWithEncoding.indexOf('.');
  return encodingIndex > -1
    ? localeWithEncoding.substring(0, encodingIndex)
    : localeWithEncoding;
};

export function deviceInfo() {
  return {
    deviceHash: machineIdSync(), // Will be hashed by default
    os: os.platform(),
    osVersion: os.release(),
    nodeVersion: process.version,
    locale: locale(),
  };
}
