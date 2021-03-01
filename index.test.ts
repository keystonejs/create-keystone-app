import execa from 'execa';
import * as playwright from 'playwright';
import tempy from 'tempy';
import path from 'path';
import { queries } from 'playwright-testing-library';

// this'll take a while
jest.setTimeout(100000000000000);

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

let keystoneProcess: execa.ExecaChildProcess<string> = undefined as any;

afterAll(async () => {
  keystoneProcess.kill();
});

if (process.env.CREATE_PROJECT === 'true') {
  test('can create a basic project', async () => {
    const cwd = tempy.directory();
    let createKeystoneAppProcess = execa(
      'node',
      [
        require.resolve('./create-keystone-next-app/bin.js'),
        'test-project',
        `--database-url=${process.env.DATABASE_URL}`,
      ],
      { cwd, all: true }
    );
    createKeystoneAppProcess.all!.on('data', (chunk) => {
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

// starting keystone is the slowest part of this so we start keystone out of the loop
test('start keystone', async () => {
  keystoneProcess = execa('yarn', ['dev'], {
    cwd: projectDir,
    all: true,
  });
  let adminUIReady = promiseSignal();
  keystoneProcess.all!.on('data', (chunk: any) => {
    let stringified = chunk.toString('utf8');
    console.log(stringified);
    if (stringified.includes('Admin UI and graphQL API ready')) {
      adminUIReady.resolve();
    }
  });

  await adminUIReady;
});

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
      const body = (await page.$('body'))!;
      (await findInputByLabelSibling(body, 'Name')).fill('Admin');
      (await findInputByLabelSibling(body, 'Email')).fill(
        'admin@keystonejs.com'
      );
      await page.click('button:has-text("Set Password")');
      await page.fill('[placeholder="New Password"]', 'password');
      await page.fill('[placeholder="Confirm Password"]', 'password');
      await page.click('button:has-text("Get started")');
      await page.uncheck('input[type="checkbox"]', { force: true });
      await page.click('text=Continue');
    });

    test('change name of admin', async () => {
      await page.click('h3:has-text("Users")');
      await Promise.all([
        page.waitForNavigation(),
        page.click('a:has-text("Admin")'),
      ]);
      const body = (await page.$('body'))!;
      (await findInputByLabelSibling(body, 'Name')).type('1');
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
      browser.close();
    });
  }
);

async function deleteAllData() {
  const {
    PrismaClient,
  } = require('./create-keystone-next-app/starter/.keystone/prisma/generated-client');

  let prisma = new PrismaClient();

  await Promise.all([
    prisma.post.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.$disconnect();
}

// the Admin UI really needs to use labels correctly
async function findInputByLabelSibling(
  element: playwright.ElementHandle<HTMLElement>,
  text: string
) {
  const nameLabel = await queries.findByText(element, text);
  const nameInput = await (await nameLabel.$('xpath=..'))!.$('input');
  if (!nameInput) {
    throw new Error('Could not find input sibling of label with text: ' + text);
  }
  return nameInput;
}
