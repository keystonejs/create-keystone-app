# Lesson 2: Adding the blog list

> In this lesson we will add a second list, and talk about Keystone's relationships

## Where we left off

- we had installed the packages

We had made our keystone file with:

```js
// keystone.js
import { list } from '@keystone-next/keystone';
import { text } from '@keystone-next/keystone/fields';

export default {
  db: {
    provider: 'sqlite',
    url: 'file:./keystone.db',
  },
  lists: {
    User: list({
      fields: {
        name: text({ isRequired: true }),
        email: text({ isRequired: true }),
      },
    }),
  },
};
```

## Our goal this lesson

Users need to be able to have posts, which have a title, publishing info, and the 'content'.

## Adding a second list

First, let's pull lists out into its own object:

```js
import { list } from '@keystone-next/keystone';
import { text } from '@keystone-next/keystone/fields';

const lists = {
  User: list({
    fields: {
      name: text({ isRequired: true }),
      email: text({ isRequired: true }),
    },
  }),
};

export default {
  db: {
    provider: 'sqlite',
    url: 'file:./keystone.db',
  },
  lists,
};
```

You may find it handy at this point to move lists into its own file, and import it, but for this lesson, it should be fine to leave here.

The next thing we want to do is add a second list. To do this, we need to add a second key to our lists object, which we are going to title `Post`, and then provide it at least one field. We are going to start by adding the `title` field, and a `content` field both as `text`.

```js
import { text } from '@keystone-next/keystone/fields';

const lists = {
  User: list({
    fields: {
      name: text({ isRequired: true }),
      email: text({ isRequired: true }),
    },
  }),
  Post: list({
    fields: {
      title: text(),
      content: text(),
    },
  }),
};
```

Let's check that this works. Boot up our keystone app and have a look.

...TK

## Connecting users with posts

```js
import { relationship } from '@keystone-next/keystone/fields';

const lists = {
  User: list({
    fields: {
      ...previous config,
    posts: relationship({ ref: 'Post.author', many: true }),
    },
  }),
  Post: list({
    fields: {
      ...previous config,
      author: relationship({
        ref: 'User.posts',
      }),
    },
  }),
};
```

## Looking at the admin UI

- open the Admin UI, create the things

## Improving the Admin UI Experience

Immediately, there are some parts of the admin UI that could do with improvement. We are going to add some config to the admin UI to improve the experience.

### Using a text area for the content

### Improving the display of the User relationship in Posts

### Set the default columns for the user list view

## Exploring the Graphql API

## What We Have Now

At the end of this lesson, our app has a new `post` list, which has info for its title and content, as well as a link to the author, and a time stamp for when it will be published. It config file looks like:

```js
import { list } from '@keystone-next/keystone';
import { text, timestamp, relationship } from '@keystone-next/keystone/fields';

const lists = {
  User: list({
    fields: {
      name: text({ isRequired: true }),
      email: text({ isRequired: true }),
      posts: relationship({ ref: 'Post.author', many: true }),
    },
  }),
  Post: list({
    fields: {
      title: text(),
      publishedAt: timestamp(),
      author: relationship({ ref: 'User.posts' }),
      content: text({ ui: { displayMode: 'textarea' } }),
    },
  }),
};

export default {
  db: {
    provider: 'sqlite',
    url: 'file:./keystone.db',
  },
  lists,
};
```
