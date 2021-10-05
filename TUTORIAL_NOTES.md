# Things Stuff

- Some extra graphical stuff I want to do in our tutorials
  - annotated images (obv)
  - Explanation blocks in a separate colour to aid in skimming
  - hiding helper text (like how to node) in fold out bits, so it doesn't break flow

## Lesson 0: A quick tour

> In this lesson, we will look at the working Keystone starter project, how to run it, and how to add an item using the graphql playground

- Set up the project starter
- start running the project
- Direct a user around the Admin UI, adding a user and a post
- Edit a post using the graphql API

## Lesson 1: Setting up a Keystone

> In this lesson we will install the keystone package, create our first list, and get Keystone running

- install package(s)
- Create a keystone.js file
- Create a user list with name and email
- Start the keystone, see the list

## Lesson 2: Adding the blog list

> In this lesson we will add a second list, and talk about Keystone's relationships

- pick up from lesson 1
- Add a new list, blog
- Add a relationship between a user and a blog
- discuss relationships
- create a new user and new blog post in the admin UI
- look at how we can query for user's blog posts from the GraphQL API

## Lesson 3: Add in auth

> In this lesson we will set up auth for the keystone admin UI

- pick up from lesson 2
- add the password field to user
- install the auth package
- write the `createAuth` function call that gives us `withAuth`
- write the session function, and export both `session` and `withAuth`
- import `withAuth` and `session` into the keystone file and apply them
- Open the admin UI, it's locked!
- Add in the `initFirstItem` config :D
- create a new user, hurrah, now we are authed!

## Lesson X0: Add a simple frontend app

> In this lesson we will add a frontend app that calls the graphql endpoint

> WARN: Thinkmill uses next and apollo as our stack. This example uses these tools, however Keystone works with any frontend or graphql request

- pick up from lesson 0
- `yarn add next react react-dom`
- create `pages/index.js`
- add a react component to the index saying it will list all the current blog posts to that page
- `install urql`

Guides:

- Send an email when there is a new user
