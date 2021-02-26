import execa from 'execa';
import { chromium, ElementHandle } from 'playwright';
import tempy from 'tempy';
import path from 'path';
import { queries } from 'playwright-testing-library';

// this'll take a while
jest.setTimeout(10000000000000000);

const sleep = (time: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

const promiseSignal = (): Promise<void> & { resolve: () => void } => {
  let resolve;
  let promise = new Promise<void>((_resolve) => {
    resolve = _resolve;
  });
  return Object.assign(promise, { resolve: resolve as any });
};

test('can create a basic project', async () => {
  //   const cwd = tempy.directory();
  //   let createKeystoneAppProcess = execa(
  //     'node',
  //     [
  //       require.resolve('./create-keystone-next-app/bin.js'),
  //       'test-project',
  //       `--database-url=${process.env.DATABASE_URL}`,
  //     ],
  //     { cwd, all: true }
  //   );
  //   let outputFromCreateKeystoneAppProcess;
  //   createKeystoneAppProcess.all!.on('data', (chunk) => {
  //     const stringified = chunk.toString('utf8');
  //     if (!stringified.includes('warning')) {
  //       console.log(stringified);
  //     }
  //   });
  //   await createKeystoneAppProcess;
  let keystoneProcess = execa('yarn', ['dev'], {
    // cwd: path.join(cwd, 'test-project'),
    cwd: path.join(process.cwd(), 'create-keystone-next-app', 'starter'),
    all: true,
  });
  let adminUIReady = promiseSignal();
  keystoneProcess.all!.on('data', (chunk) => {
    let stringified = chunk.toString('utf8');
    console.log(stringified);
    if (stringified.includes('Admin UI and graphQL API ready')) {
      adminUIReady.resolve();
    }
  });

  await adminUIReady;

  await deleteAllData();

  let browser = await chromium.launch({ headless: false });
  let page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const body = (await page.$('body'))!;
  (await findInputByLabelSibling(body, 'Name')).type('Admin');
  (await findInputByLabelSibling(body, 'Email')).type('admin@keystonejs.com');
  await page.click('button:has-text("Set Password")');
  await page.type('[placeholder="New Password"]', 'password');
  await page.type('[placeholder="Confirm Password"]', 'password');
  await page.click('button:has-text("Get started")');
  await page.uncheck('input[type=checkbox]', { force: true });
  await page.click('text=Continue');
  await page.click('h3:has-text("Users")');
  await sleep(5000);
  await browser.close();
  keystoneProcess.cancel();
});

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
  element: ElementHandle<HTMLElement>,
  text: string
) {
  const nameLabel = await queries.findByText(element, text);
  const nameInput = await (await nameLabel.$('xpath=..'))!.$('input');
  return nameInput!;
}
