import fs from 'fs-extra';
import path from 'path';
import meow from 'meow';
import enquirer from 'enquirer';
import execa, { ExecaError } from 'execa';
import ora from 'ora';
import { checkVersion } from './checkVersion';
import { UserError } from './utils';
import c from 'chalk';
import terminalLink from 'terminal-link';
import { sendTelemetryEvent } from './telemetry';

const starterDir = path.normalize(`${__dirname}/../starter`);

const cli = meow(
  `
Usage
  $ create-keystone-app [directory]
`
);

type Args = {
  directory: string;
};

const versionInfo = () => {
  process.stdout.write('\n');
  console.log(`✨ You're about to generate a project using ${c.bold(
    'Keystone 6'
  )} packages.
`);
};

async function normalizeArgs(): Promise<Args> {
  let directory = cli.input[0];
  if (!directory) {
    ({ directory } = await enquirer.prompt({
      type: 'input',
      name: 'directory',
      message:
        'What directory should create-keystone-app generate your app into?',
      validate: (x) => !!x,
    }));
    process.stdout.write('\n');
  }
  const directoryPath = path.resolve(directory);
  sendTelemetryEvent('create-keystone-app:start', directoryPath);
  return {
    directory: directoryPath,
  };
}

const installDeps = async (cwd: string): Promise<'yarn' | 'npm'> => {
  const spinner = ora(
    'Installing dependencies with yarn. This may take a few minutes.'
  ).start();
  try {
    await execa('yarn', ['install'], { cwd });
    spinner.succeed('Installed dependencies with yarn.');
    return 'yarn';
  } catch (_err: any) {
    let err: ExecaError = _err;
    if (err.failed) {
      process.stdout.write('\n');
      spinner.warn('Failed to install with yarn.');
      spinner.start(
        'Installing dependencies with npm. This may take a few minutes.'
      );
      try {
        await execa('npm', ['install'], { cwd });
        spinner.succeed('Installed dependencies with npm.');
      } catch (npmErr) {
        spinner.fail('Failed to install with npm.');
        throw npmErr;
      }
      process.stdout.write('\n');
      return 'npm';
    }
    throw err;
  }
};

(async () => {
  versionInfo();
  await checkVersion();
  const normalizedArgs = await normalizeArgs();
  await fs.mkdir(normalizedArgs.directory);
  await Promise.all([
    ...[
      '_gitignore',
      'schema.ts',
      'package.json',
      'tsconfig.json',
      'schema.graphql',
      'schema.prisma',
      'keystone.ts',
      'auth.ts',
      'README.md',
    ].map((filename) =>
      fs.copyFile(
        path.join(starterDir, filename),
        path.join(normalizedArgs.directory, filename.replace(/^_/, '.'))
      )
    ),
  ]);
  const packageManager = await installDeps(normalizedArgs.directory);
  const relativeProjectDir = path.relative(
    process.cwd(),
    normalizedArgs.directory
  );
  process.stdout.write('\n');
  console.log(`🎉  Keystone created a starter project in: ${c.bold(
    relativeProjectDir
  )}

  ${c.bold('To launch your app, run:')}

  - cd ${relativeProjectDir}
  - ${packageManager === 'yarn' ? 'yarn' : 'npm run'} dev

  ${c.bold('Next steps:')}

  - Read ${c.bold(
    `${relativeProjectDir}${path.sep}README.md`
  )} for additional getting started details.
  - Edit ${c.bold(
    `${relativeProjectDir}${path.sep}keystone.ts`
  )} to customize your app.
  - ${terminalLink('Open the Admin UI', 'http://localhost:3000')}
  - ${terminalLink('Open the Graphql API', 'http://localhost:3000/api/graphql')}
  - ${terminalLink('Read the docs', 'https://next.keystonejs.com')}
  - ${terminalLink(
    'Star Keystone on GitHub',
    'https://github.com/keystonejs/keystone'
  )}
`);
  sendTelemetryEvent('create-keystone-app:complete', normalizedArgs.directory);
})().catch((err) => {
  if (err instanceof UserError) {
    console.error(err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});
