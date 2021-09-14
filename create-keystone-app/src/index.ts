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
  console.log(`ℹ️  You're about to generate a project using ${c.bold(
    'Keystone Next'
  )} packages.

   If you'd like to use ${c.bold(
     'Keystone 5'
   )}, please use \`create-keystone-5-app\` instead.

   ${terminalLink(
     'Learn more',
     'https://keystonejs.com/guides/keystone-5-vs-keystone-next'
   )} about the changes between ${c.bold('Keystone 5')} and ${c.bold(
    'Keystone Next'
  )} on our website.
  `);
};

async function normalizeArgs(): Promise<Args> {
  let directory = cli.input[0];
  if (!directory) {
    process.stdout.write('\n'); // needed because `yarn create` or `npx` doesn't end with a new line
    ({ directory } = await enquirer.prompt({
      type: 'input',
      name: 'directory',
      message:
        'What directory should create-keystone-app generate your app into?',
      validate: (x) => !!x,
    }));
  }
  return {
    directory: path.resolve(directory),
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
  console.log(`🎉  Keystone created a starter project in: ${c.bold(
    relativeProjectDir
  )}

  ${c.bold('To launch your app, run:')}

  - cd ${relativeProjectDir}
  - ${packageManager === 'yarn' ? 'yarn' : 'npm run'} dev

  ${c.bold('Next steps:')}

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
})().catch((err) => {
  if (err instanceof UserError) {
    console.error(err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});
