import { config } from '@keystone-next/keystone';
import { statelessSessions } from '@keystone-next/keystone/session';

import { lists } from './schema';
import { withAuth, sessionSecret } from './auth';

let sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret!,
});

export default withAuth(
  config({
    db: {
      provider: 'sqlite',
      url: 'file:./keystone.db',
    },
    ui: {
      isAccessAllowed: (context) => !!context.session?.data,
    },
    lists,
    session,
  })
);
