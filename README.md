# create-keystone-next-app

TODO:

- When a release goes out with the Babel config changes, remove the default Babel config

## FAQ

### Why is this in a different repository to the rest of Keystone

We want to be able to have tests that create an app with create-keystone-next-app and then test to ensure it starts. This wouldn't be possible in the main Keystone repo since it relies on the rest of the packages being published (unless we published the packages to a local registry like Verdaccio but that would still add complexity and the chance for something to go wrong compared to the proper published versions to npm).
