# create-keystone-app

This starter-kit will get you up and running with a new [Keystone](https://next.keystonejs.com) project in just a few minutes. Run one of the following commands to get started.

```
yarn create keystone-app
```

or

```
npm init keystone-app
```

or

```
npx create-keystone-app
```

See the [Keystone website](https://next.keystonejs.com/docs/walkthroughs/getting-started-with-create-keystone-app) for more details on how to get started with Keystone.

## FAQ

### Why is this in a different repository to the rest of Keystone

We want to be able to have tests that create an app with `create-keystone-app` and then test to ensure it starts. This wouldn't be possible in the main Keystone repo since it relies on the rest of the packages being published (unless we published the packages to a local registry like Verdaccio but that would still add complexity and the chance for something to go wrong compared to the proper published versions to npm).
