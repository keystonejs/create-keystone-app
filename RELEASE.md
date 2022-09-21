# Release Guidelines

## How to do a release

> **Note**
> This can only be done by a short list of contributors

The [`Version Packages`](https://github.com/keystonejs/create-keystone-app/actions/workflows/version_packages.yml) GitHub action should trigger automatically in the presence of any merged `.changesets`.

Upon merging the `Version Packages` pull request to `main`, you can trigger the `Publish` GitHub action.
This repository only has 1 public package, `create-keystone-app`; if no changesets exist for that package, nothing will be published.
