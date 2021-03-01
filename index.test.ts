import * as playwright from 'playwright';
import childProcess from 'child_process';
import tempy from 'tempy';
import path from 'path';
import { promisify } from 'util';
import _treeKill from 'tree-kill';

const treeKill = promisify(_treeKill);

process.env.SESSION_SECRET =
  'adkjnfanskjdfnkjdsafnswkfjlswndjkfnwajskgfn wedjfbeqkhjfbqewhqewgkqegkjnknjjknwsdfkjnsdfkjn';

// this'll take a while
jest.setTimeout(100000);

const promiseSignal = (): Promise<void> & { resolve: () => void } => {
  let resolve;
  let promise = new Promise<void>((_resolve) => {
    resolve = _resolve;
  });
  return Object.assign(promise, { resolve: resolve as any });
};

// for debugging, you'll want to set the env var PWDEBUG=1
// this will open the browser in a headed mode and open the inspector
// https://playwright.dev/docs/inspector

const promisifiedExecFile = promisify(childProcess.execFile);

if (process.env.CREATE_PROJECT === 'create project') {
  test('can create a basic project', async () => {
    const cwd = tempy.directory();
    let createKeystoneAppProcess = promisifiedExecFile(
      'node',
      [
        require.resolve('./create-keystone-next-app/bin.js'),
        'test-project',
        `--database-url=${process.env.DATABASE_URL}`,
      ],
      { cwd }
    );
    createKeystoneAppProcess.child.stdout!.on('data', (chunk) => {
      const stringified = chunk.toString('utf8');
      if (!stringified.includes('warning')) {
        console.log(stringified);
      }
    });
    await createKeystoneAppProcess;
    projectDir = path.join(cwd, 'test-project');
  });
}

let projectDir = path.join(__dirname, 'create-keystone-next-app', 'starter');

const logChunk = (chunk: any) => {
  console.log(chunk.toString('utf8'));
};

describe.each(['prod', 'dev'] as const)('%s', (mode) => {
  let cleanupKeystoneProcess = () => {};

  afterAll(async () => {
    await cleanupKeystoneProcess();
  });

  if (mode === 'dev') {
    test('start keystone in dev', async () => {
      let keystoneProcess = childProcess.execFile('yarn', ['dev'], {
        cwd: projectDir,
        env: process.env,
      });
      let adminUIReady = promiseSignal();
      let listener = (chunk: any) => {
        let stringified = chunk.toString('utf8');
        console.log(stringified);
        if (stringified.includes('Admin UI and graphQL API ready')) {
          adminUIReady.resolve();
        }
      };
      keystoneProcess.stdout!.on('data', listener);

      cleanupKeystoneProcess = async () => {
        keystoneProcess.stdout!.off('data', listener);
        // childProcess.kill will only kill the direct child process
        // so we use tree-kill to kill the process and it's children
        await treeKill(keystoneProcess.pid);
      };

      await adminUIReady;
    });
  }

  if (mode === 'prod') {
    test('build keystone', async () => {
      let keystoneBuildProcess = promisifiedExecFile('yarn', ['build'], {
        cwd: projectDir,
        env: process.env,
      });
      keystoneBuildProcess.child.stdout!.on('data', logChunk);
      keystoneBuildProcess.child.stderr!.on('data', logChunk);
      await keystoneBuildProcess;
    });
    test('start keystone in prod', async () => {
      let keystoneProcess = childProcess.execFile('yarn', ['start'], {
        cwd: projectDir,
        env: process.env,
      });
      let adminUIReady = promiseSignal();
      let listener = (chunk: any) => {
        let stringified = chunk.toString('utf8');
        console.log(stringified);
        if (stringified.includes('Admin UI and graphQL API ready')) {
          adminUIReady.resolve();
        }
      };
      keystoneProcess.stdout!.on('data', listener);
      keystoneProcess.stderr!.on('data', listener);

      cleanupKeystoneProcess = async () => {
        keystoneProcess.stdout!.off('data', listener);
        keystoneProcess.stderr!.off('data', listener);
        // childProcess.kill will only kill the direct child process
        // so we use tree-kill to kill the process and it's children
        await treeKill(keystoneProcess.pid);
      };

      await adminUIReady;
    });
  }

  describe.each(['chromium', 'webkit', 'firefox'] as const)(
    '%s',
    (browserName) => {
      let page: playwright.Page = undefined as any;
      let browser: playwright.Browser = undefined as any;
      beforeAll(async () => {
        await deleteAllData();
        browser = await playwright[browserName].launch();
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
      });
      test('init user', async () => {
        await page.fill('label:has-text("Name") >> .. >> input', 'Admin');
        await page.fill(
          'label:has-text("Email") >> .. >> input',
          'admin@keystonejs.com'
        );
        await page.click('button:has-text("Set Password")');
        await page.fill('[placeholder="New Password"]', 'password');
        await page.fill('[placeholder="Confirm Password"]', 'password');
        await page.click('button:has-text("Get started")');
        await page.uncheck('input[type="checkbox"]', { force: true });
        await Promise.all([
          page.waitForNavigation(),
          page.click('text=Continue'),
        ]);
      });

      test('change name of admin', async () => {
        await page.click('h3:has-text("Users")');
        await Promise.all([
          page.waitForNavigation(),
          page.click('a:has-text("Admin")'),
        ]);
        await page.type('label:has-text("Name") >> .. >> input', '1');
        await page.click('button:has-text("Save changes")');
        await page.goto('http://localhost:3000/users');
        expect(await page.textContent('a:has-text("Admin1")')).toBe('Admin1');
      });

      test('create post', async () => {
        await Promise.all([
          page.waitForNavigation(),
          page.click('nav >> text=Posts'),
        ]);
        await page.click('button:has-text("Create Post")');
        await page.fill('input[type="text"]', 'content');
        await Promise.all([
          page.waitForNavigation(),
          page.click('form[role="dialog"] button:has-text("Create Post")'),
        ]);
        await page.type('input[type="text"]', '1');
        await page.click('button:has-text("Save changes")');
      });
      afterAll(async () => {
        await browser.close();
      });
    }
  );
});

async function deleteAllData() {
  const { PrismaClient } = require(path.join(
    projectDir,
    './.keystone/prisma/generated-client'
  ));

  let prisma = new PrismaClient();

  await Promise.all([
    prisma.post.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.$disconnect();
}
