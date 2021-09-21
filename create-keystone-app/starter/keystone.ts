/*
Welcome to keystone! This file is what keystone uses to start the app.

It looks at the default export, and expects a keystone config object.

You can find all the config options in our docs here: https://keystonejs.com/docs/apis/config
*/

import { config } from '@keystone-next/keystone';

// Look in the schema file for how we define our lists, and how users interact with them through graphql or the admin UI
import { lists } from './schema';
// Keystone auth is easy to set up - check out the basic auth setup in the auth file.
import { withAuth, session } from './auth';

export default withAuth(
  // Using the config function ensures our exported config is correct and throws useful errors if we've made a mistake
  config({
    // the db sets the database provider - we're using sqlite for the fastest startup experience
    db: {
      provider: 'sqlite',
      url: 'file:./keystone.db',
    },
    // This config allows us to set up features of the admin UI https://keystonejs.com/docs/apis/config#ui
    ui: {
      // For our starter, we check that someone has session data before letting them see the admin UI.
      isAccessAllowed: (context) => !!context.session?.data,
    },
    // lists and session config can be a bit big, so we've put them in other files
    lists,
    session,
  })
);
