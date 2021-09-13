# Keystone Project Parter

Welcome to Keystone!

Run

```
npm keystone dev
```

To view the config for your new app, look at [./keystone.ts](./keystone.ts)

This project starter is designed to give you a sense of the power keystone can offer you, and show off some of its main features. It's also a pretty simple setup if you want to build out from it.

We recommend you use this alongside our [getting started walkthrough](https://keystonejs.com/docs/walkthroughs/getting-started-with-create-keystone-app) which will walk you through what you get as part of this starter.

If you want an overview of all the features keystone offers, check out our [why keystone](https://keystonejs.com/why-keystone) page.

## Some Quick Notes On Getting Started

### Changing the database

We've set you up with an [sqlite database](https://keystonejs.com/docs/apis/config#sqlite) for ease-of-use. If you're wanting to use postgres, you can!

Just change the `db` property on line 16 of the keystone file [./keystone.ts](./keystone.ts) to

```typescript
db: {
    adapter: 'prisma_postgresql',
    url: process.env.DATABASE_URL || 'DATABASE_URL_TO_REPLACE',
}
```

For more on database configuration, check out or [db api docs](https://keystonejs.com/docs/apis/config#db)

### Auth

We have put auth into its own file to make this humble codebase easier to navigate. If you want to just browse without auth turned on, you can comment out the `isAccessAllowed` on line 21 of the keystone file [./keystone.ts](./keystone.ts) if you want to explore the setup and admin UI without worrying about auth right now.

For more on auth, check out our [authentication API docs](https://keystonejs.com/docs/apis/auth#authentication-api)

### Adding a frontend

Keystone is frontend agnostic, and provides a graphql endpoint you can write queries against at `/api/graphql` (by default [http://localhost:3000/api/graphql](http://localhost:3000/api/graphql)). At Thinkmill, we tend to use [Next.js](https://nextjs.org/) and [Apollo graphql](https://www.apollographql.com/docs/react/get-started/) as our frontend and way to write queries, but if you have your own favourite, feel free to pick that up.

A walkthrough on how to do this is forthcoming, but in the meantime our [todo example](https://github.com/keystonejs/keystone-react-todo-demo) shows a keystone set up with a frontend. For a more full example, you can also look at an example app we built for [prisma day 2021](https://github.com/keystonejs/prisma-day-2021-workshop)

### Next embedded keystone

While keystone works as a standalone app, you can embed your keystone app into a [Next.js](https://nextjs.org/) app. This is quite a different setup to the starter, and we recommend checking out our walkthrough for that [here](https://keystonejs.com/docs/walkthroughs/embedded-mode-with-sqlite-nextjs#how-to-embed-keystone-sq-lite-in-a-next-js-app).
