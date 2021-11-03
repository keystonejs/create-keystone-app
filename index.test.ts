import * as playwright from 'playwright';
import childProcess from 'child_process';
import tempy from 'tempy';
import path from 'path';
import { promisify } from 'util';
import _treeKill from 'tree-kill';
import retry from 'async-retry';

const treeKill = promisify(_treeKill);

process.env.SESSION_SECRET =
  'HbGUBzUcVC4ghjg4w4T2Dz4z7dByYCz7GTAUDwaUEEFc2WxkjuPMyqnTtZ4H3hMp';

// this'll take a while
jest.setTimeout(500000);

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
      [require.resolve('./create-keystone-app/bin.js'), 'test-project'],
      { cwd }
    );
    createKeystoneAppProcess.child.stdout!.on('data', (chunk) => {
      const stringified = chunk.toString('utf8');
      if (
        // we don't want to see all the peer dep/deprecation warnings
        !stringified.includes('warning')
      ) {
        console.log(stringified);
      }
    });
    await createKeystoneAppProcess;
    projectDir = path.join(cwd, 'test-project');
  });
}

let projectDir = path.join(__dirname, 'create-keystone-app', 'starter');

// the order here is important
// dev will initialise the database for prod
describe.each(['dev', 'prod'] as const)('%s', (mode) => {
  let cleanupKeystoneProcess = () => {};

  afterAll(async () => {
    await cleanupKeystoneProcess();
  });

  async function startKeystone(command: 'start' | 'dev') {
    let keystoneProcess = childProcess.execFile('yarn', [command], {
      cwd: projectDir,
      env: process.env,
    });
    let adminUIReady = promiseSignal();
    let listener = (chunk: any) => {
      let stringified = chunk.toString('utf8');
      console.log(stringified);
      if (stringified.includes('Admin UI ready')) {
        adminUIReady.resolve();
      }
    };
    keystoneProcess.stdout!.on('data', listener);

    cleanupKeystoneProcess = async () => {
      keystoneProcess.stdout!.off('data', listener);
      // childProcess.kill will only kill the direct child process
      // so we use tree-kill to kill the process and it's children
      if (keystoneProcess.pid) {
        await treeKill(keystoneProcess.pid);
      }
    };

    await adminUIReady;
  }

  if (mode === 'dev') {
    test('start keystone in dev', async () => {
      await startKeystone('dev');
    });
  }

  if (mode === 'prod') {
    test('build keystone', async () => {
      let keystoneBuildProcess = promisifiedExecFile('yarn', ['build'], {
        cwd: projectDir,
        env: process.env,
      });
      const logChunk = (chunk: any) => {
        console.log(chunk.toString('utf8'));
      };
      keystoneBuildProcess.child.stdout!.on('data', logChunk);
      keystoneBuildProcess.child.stderr!.on('data', logChunk);
      await keystoneBuildProcess;
    });
    test('start keystone in prod', async () => {
      await startKeystone('start');
    });
  }

  describe.each(['chromium', 'webkit', 'firefox'] as const)(
    '%s',
    (browserName) => {
      let page: playwright.Page = undefined as any;
      let browser: playwright.Browser = undefined as any;
      beforeAll(async () => {
        await retry(async () => {
          await deleteAllData(projectDir);
          browser = await playwright[browserName].launch();
          page = await browser.newPage();
          page.setDefaultNavigationTimeout(6000);
          await page.goto('http://localhost:3000');
        });
      });
      test('init user', async () => {
        await retry(async () => {
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
      });

      test('change name of admin', async () => {
        await retry(async () => {
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
      });

      test('create post', async () => {
        await retry(async () => {
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
      });
      afterAll(async () => {
        await browser.close();
      });
    }
  );
});

async function deleteAllData(projectDir: string) {
  /**
   * As of @prisma/client@3.1.1 it appears that the prisma client runtime tries to resolve the path to the prisma schema
   * from process.cwd(). This is not always the project directory we want to run keystone from.
   * Here we mutate the process.cwd global with a fn that returns the project directory we expect, such that prisma
   * can retrieve the correct schema file.
   */
  const prevCwd = process.cwd;
  try {
    process.cwd = () => {
      return projectDir;
    };
    const { PrismaClient } = require(path.join(
      projectDir,
      'node_modules/.prisma/client'
    ));

    let prisma = new PrismaClient();

    await Promise.all(
      Object.values(prisma).map((x: any) => x?.deleteMany?.({}))
    );

    await prisma.$disconnect();
  } finally {
    process.cwd = prevCwd;
  }
}
