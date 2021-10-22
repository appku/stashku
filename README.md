# StashKu
StashKu is a data storage framework provides mechanisms for model extraction, injection, diffs, and RESTful operations against common data storage engines & mediums.

## Planned Features for Next Release
- [ ] Provide better documentation of features and usage by publishing jsdoc.
- [ ] Support for a new OPTIONS request, which should return a schema of the target resource. 
- [x] Full support for model usage in all request types:
  - [x] GET
  - [x] POST
  - [x] PUT
  - [x] DELETE
- [x] Support empty GET request calls (to retrieve all data).
- [ ] Support models with validation rules.
- [x] Support request `headers` for per-request, per-engine configuration options.
- [ ] Support schema to model generation through a new `generate` function on stashku instances.
  - [ ] Allow `generate` to export to a folder-based export to model directory.

### Memory Engine
- [ ] Add support for new OPTIONS requests.
- [ ] Add support for header `caseSensitive`.
- [x] Case-insensitive memory storage resource name support by default.

### Breaking Changes
- [x] Remove depreciated `key` and `keys` functions on PUT requestsion (use `pk` instead).
- [x] The `meta` function on all request types has been depreciated in lieu of `headers`. It will be removed in a future release.

# Running
StashKu can be run as a globally installed package with a CLI available to perform a number of operations.

You can also run `npm start` and pass arguments directly within this project.

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