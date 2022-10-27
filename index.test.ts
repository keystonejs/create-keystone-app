import * as playwright from 'playwright';
import { execFile } from 'child_process';
import tempy from 'tempy';
import path from 'path';
import { promisify } from 'util';
import _treeKill from 'tree-kill';
import retry from 'async-retry';
import { randomBytes } from 'crypto';

const treeKill = promisify(_treeKill);
const execFileAsync = promisify(execFile);

// some tests are slow
jest.setTimeout(30000);

// WARNING:
//   the order of tests is important, and why we use --runInBand
//   `keystone dev` creates the database for production

// playwright tips
//   for debugging, you'll want to set the env var PWDEBUG=1
//   this will open the browser in a headed mode and open the inspector
//   https://playwright.dev/docs/inspector

let projectDir = path.join(__dirname, 'create-keystone-app', 'starter');

if (process.env.TEST_MATRIX_NAME === 'cka') {
  test('can create a basic project', async () => {
    const cwd = tempy.directory();
    const createKeystoneAppProcess = execFileAsync(
      'node',
      [require.resolve('./create-keystone-app/bin.js'), 'test-project'],
      { cwd }
    );
    createKeystoneAppProcess.child.stdout!.pipe(process.stdout);
    await createKeystoneAppProcess;
    projectDir = path.join(cwd, 'test-project');
  }, 60000);
}

async function startKeystone(
  command: 'start' | 'dev',
  env: Record<string, any> = process.env
) {
  const keystoneProcess = execFile('yarn', [command], {
    cwd: projectDir,
    env,
  });
  keystoneProcess.stdout!.pipe(process.stdout);

  const adminUIReady = new Promise((resolve, reject) => {
    keystoneProcess.stdout!.on('data', (buffer: Buffer) => {
      if (buffer.toString('utf-8').includes('Admin UI ready')) {
        return resolve(true);
      }
    });
  });

  const cleanupKeystoneProcess = async () => {
    keystoneProcess.stdout!.unpipe(process.stdout);
    // childProcess.kill will only kill the direct child process
    // so we use tree-kill to kill the process and it's children
    if (keystoneProcess.pid) {
      await treeKill(keystoneProcess.pid);
    }
  };

  await adminUIReady;
  return cleanupKeystoneProcess;
}

describe.each(['development', 'production'] as const)('%s', (mode) => {
  let cleanupKeystoneProcess = () => {};
  afterAll(async () => {
    await cleanupKeystoneProcess();
  });

  if (mode === 'development') {
    // process.env.SESSION_SECRET is randomly generated for this
    test('start keystone in dev', async () => {
      cleanupKeystoneProcess = await startKeystone('dev');
    }, 40000);
  } else if (mode === 'production') {
    const env = {
      NODE_ENV: 'production',
      SESSION_SECRET: randomBytes(32).toString('hex'),
    };

    test('build keystone', async () => {
      const keystoneBuildProcess = execFileAsync('yarn', ['build'], {
        cwd: projectDir,
        env: {
          ...process.env,
          ...env,
        },
      });
      keystoneBuildProcess.child.stdout!.pipe(process.stdout);
      keystoneBuildProcess.child.stderr!.pipe(process.stdout);
      await keystoneBuildProcess;
    }, 100000);

    test('start keystone in prod', async () => {
      cleanupKeystoneProcess = await startKeystone('start', {
        ...process.env,
        ...env,
      });
    }, 40000);
  }

  describe.each(['chromium'] as const)('%s', (browserName) => {
    let page: playwright.Page = undefined as any;
    let browser: playwright.Browser = undefined as any;

    beforeAll(async () => {
      await deleteAllData(projectDir);
      browser = await playwright[browserName].launch();
      page = await browser.newPage();
      page.setDefaultNavigationTimeout(6000);
    });

    test('create user', async () => {
      await page.goto('http://localhost:3000');
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
      await page.click('text=Continue');
    });

    test('change admin name', async () => {
      await page.click('h3:has-text("Users")');
      await page.click('a:has-text("Admin")');
      await page.type('label:has-text("Name") >> .. >> input', '1');
      await page.click('button:has-text("Save changes")');
      await page.click('nav >> text=Users');
      expect(await page.textContent('a:has-text("Admin1")')).toBe('Admin1');
    });

    test('create a post', async () => {
      await page.click('nav >> text=Posts');
      await page.click('a:has-text("Create Post")');
      await page.fill('input[type="text"]', 'title');
      await page.click('button:has-text("Create Post")');
      await page.waitForTimeout(2000); // sleep for a second or two
      await page.fill('input[type="text"]', 'title again');
      await page.click('button:has-text("Save changes")');
    });

    afterAll(async () => {
      await browser.close();
    });
  });
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

    const prisma = new PrismaClient();

    await Promise.all(
      Object.values(prisma).map((x: any) => x?.deleteMany?.({}))
    );

    await prisma.$disconnect();
  } finally {
    process.cwd = prevCwd;
  }
}
