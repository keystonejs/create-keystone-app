/*
Welcome to the auth file! Here we have put a config to do basic auth in Keystone.

`createAuth` is an implementation for an email-password login out of the box.
`statelessSessions` is a base implementation of session logic.

For more on auth, check out: https://keystonejs.com/docs/apis/auth#authentication-api
*/

import { randomBytes } from 'crypto';
import { createAuth } from '@keystone-6/auth';

// See https://keystonejs.com/docs/apis/session#session-api for the session docs
import { statelessSessions } from '@keystone-6/core/session';

// a SESSION_SECRET should always be provided in production
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV !== 'production') {
  sessionSecret = randomBytes(32).toString('hex')
}

// Here we define how auth relates to our schemas.
// What we are saying here is that we want to use the list `User`, and to log in
// we will need their email and password.
const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  sessionData: 'name',
  secretField: 'password',
  initFirstItem: {
    // If there are no items in the database, keystone will ask you to create
    // a new user, filling in these fields.
    fields: ['name', 'email', 'password'],
  },
});

// This defines how long people will remain logged in for.
// This will get refreshed when they log back in.
const sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

// This defines how sessions should work. For more details, check out: https://keystonejs.com/docs/apis/session#session-api
const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret!,
});

export { withAuth, session };
