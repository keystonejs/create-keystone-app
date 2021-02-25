import getPackageJson from 'package-json';
import currentPkgJson from '../package.json';
import * as semver from 'semver';
export async function checkVersion() {
  try {
    const { version } = await getPackageJson('create-keystone-next-app');
    if (typeof version !== 'string') {
      throw new Error(
        'version from package metadata was expected to be a string but was not'
      );
    }
    if (semver.lt(currentPkgJson.version, version)) {
      console.error(
        "You're running an old version of create-keystone-next-app, version"
      );
    }
  } catch (err) {
    console.error(
      'A problem occurred fetching the latest version of create-keystone-next-app'
    );
    console.error(err);
  }
}
