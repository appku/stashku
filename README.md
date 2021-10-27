# StashKu
StashKu is a data storage framework provides mechanisms for model extraction, injection, diffs, and RESTful operations against common data storage engines & mediums. This is the core packaged library that provides the RESTful and standardized interface for all plugins and middleware.

## Planned Features
- [ ] Provide better documentation of features and usage by publishing jsdoc.

\* CLI and migration features have been moved to [StashKu Migrate](https://github.com/appku/stashku-migrate).

### Next Release
- [ ] Support in-browser use of StashKu (core).
- [ ] 100% line unit-test coverage on all files.
  - [x] Modeling
  - [x] Requests
  - [ ] Utilities
  - [ ] Base Classes

# Running
This is the core StashKu package and doesn not provide a CLI interface, as it is meant to be leveraged as a package. See the 
[StashKu Migrate](https://github.com/appku/stashku-migrate) for the `stashku` CLI tool.

# Configuration
StashKu can be configured using environmental variables.

| Property | ENV | Type | Default | Description |
|-|-|-|-|-|
| engine | STASHKU_ENGINE | `String` | `"memory"` | Specifies the name of the StashKu engine (or package) to initialize. The built-in options are: `"memory"`.

### Memory Storage Engine Configuration
| Property | ENV | Type | Default | Description |
|-|-|-|-|-|
| limit | STASHKU_MEMORY_LIMIT | `Number` | `0` | Specifies the maximum number of records allowed to be stored in the memory engine. Attempts to write more than this number will throw an exception. Set to a value of `0` or less to not enforce a limit. |

## Code Documentation
You can generate a static JSDoc site under the `docs/` path using the command `npm run docs`.

# Testing
This project uses `jest` to perform unit tests.

## Running Tests
Run `npm test` to run jest unit tests.

Run `npm run lint` to run ESLint, optionally install the Visual Studio Code ESLint extension to have linting issues show in your "Problems" tab and be highlighted.

If you are writing unit tests, you may need to `npm install @types/jest` to get intellisense in Visual Studio Code if for some reason it did not get installed.

# Publishing
Only maintainers with proper access can publish this package to npm. To do so as maintainers, you can publish by running the following command:

```sh
npm publish --registry=https://registry.npmjs.org --access=public
```