import fs from 'fs-extra';
import path from 'path';
import meow from 'meow';
import { checkVersion } from './checkVersion';

const createKeystoneNextAppDir = path.dirname(
  require.resolve('create-keystone-next-app/package.json')
);

const starterDir = path.join(createKeystoneNextAppDir, 'starter');

const cli = meow(``, {
  flags: {
    name: {
      type: 'string',
      isRequired: true,
    },
    database: {
      type: 'string',
      isRequired: true,
    },
  },
  allowUnknownFlags: false,
});

(async () => {
  await checkVersion();
  await fs.mkdir(cli.flags.name);
  await fs.copy(starterDir, cli.flags.name);
  console.log('');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
