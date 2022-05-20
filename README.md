# StashKu
StashKu is a data storage framework provides mechanisms for model extraction, injection, diffs, and RESTful operations against common data storage engines & mediums. This is the core packaged library that provides the RESTful and standardized interface for all plugins and middleware.

## Planned Features
- [ ] Provide better documentation of features and usage by publishing jsdoc.
- [ ] Support in-browser use of StashKu.
- [ ] 100% line unit-test coverage on all files.
  - [x] Modeling
  - [x] Requests
  - [ ] Utilities
  - [ ] Base Classes

\* CLI and migration features have been moved to [StashKu Migrate](https://github.com/appku/stashku-migrate).

## Running
This is the core StashKu package and doesn not provide a CLI interface, as it is meant to be leveraged as a package. See the 
[StashKu Migrate](https://github.com/appku/stashku-migrate) for the `stashku` CLI tool.

## Configuration
StashKu can be configured using environmental variables.

| Property | ENV | Type | Default | Description |
|-|-|-|-|-|
| engine | STASHKU_ENGINE | `String` | `"memory"` | Specifies the name of the StashKu engine (or package) to initialize. The built-in options are: `"memory"`. |
| - | STASHKU_MODEL_NAME_REMOVE | `String` | `["/^dbo\\./i", "/^etl\\./i", "/^rpt\\./i"]` | Allows you to configure one or more regular expressions that are removed from a generated model's class name (derived from a resource name). By default the configured expressions will strip "dbo.", "etl.", and "rpt." prefixes from resource names. The regular expressions must be declared within a JSON array in string format. |

## Memory Storage Engine
StashKu includes a built-in default storage engine for storing in-memory objects. This engine is used when the StashKu configuration has an `engine` with the value `"memory"`, which is the default. Contents stored in this engine are lost if the application runtime stops for any reason. 

### Configuration
| Property | ENV | Type | Default | Description |
|-|-|-|-|-|
| `limit` | STASHKU_MEMORY_LIMIT | `Number` | `0` | Limits the maximum number of objects that can be stored in the memory engine per resource name. If this limit is reached, POST requests will throw an error. |
| `caseSensitive` | STASHKU_MEMORY_CASE_SENSITIVE | `Boolean` | `false` | Controls whether all resource names are stored in lower-case, and tracked case-insensitively or not. By default this is unset in the configuration which will default to `false` internally and allow it to be overridden by request headers. If set explicitly, the request header's `caseSensitive` flag will be ignored. |

## Code Documentation
You can generate a static JSDoc site under the `docs/` path using the command `npm run docs`.

## Installing
```sh
npm i --registry=https://registry.npmjs.org
```

## Testing
This project uses `jest` to perform unit tests.

## Running Tests
Run `npm test` to run jest unit tests.

Run `npm run lint` to run ESLint, optionally install the Visual Studio Code ESLint extension to have linting issues show in your "Problems" tab and be highlighted.

If you are writing unit tests, you may need to `npm install @types/jest` to get intellisense in Visual Studio Code if for some reason it did not get installed.

## Publishing
Only maintainers with proper access can publish this package to npm. To do so as maintainers, you can publish by running the following command:

```sh
npm publish --registry=https://registry.npmjs.org --access=public
```