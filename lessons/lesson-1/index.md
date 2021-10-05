# Lesson 1: Setting up a Keystone

> In this lesson we will install the keystone package, create our first list, and get Keystone running

## Installing the packages you need

We will be using `yarn` for this. (link to get yarn)

`mkdir keystone-learning`
`cd keystone-learning`
`yarn init`

- select options as you want

`yarn add @keystone-next/keystone`

## Setting up Keystone

There are two bits of keystone's configuration that are required to start our project: the `lists`, and the `db`.

`touch keystone.js`

```js
export default {};
```

### Setting up a Database

```js
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

### Setting up a user list

```js
import { list } from '@keystone-next/keystone';
import { text } from '@keystone-next/keystone/fields';

export default {
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

This will give us:

```js
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

## Starting your new app

`yarn keystone-next dev`

Wait till command line shows

go to [http://localhost:3000](http://localhost:3000)

Hurray! You now have a running keystone app with one list.

Next lesson, we will add a new list so we can represent posts from users.
