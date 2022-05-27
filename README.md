# StashKu
StashKu is a data storage agnostic, flat-data framework provides mechanisms for model usage and pure, RESTful operations against common data storage engines & mediums. The framework provides the tools and engines to begin leveraging it out of the box. Specifically the engines for in-memory storage and fetch requests (ideal for the browser-side of applications) are provided.

Other engines can be built on top of StashKu to provide even more support of other storage mediums, including APIs, disks and other hardware, and even websites. As long as it can be interacted with through RESTful requests such as GET, POST, PUT, PATCH, DELETE, and OPTIONS, StashKu could potentially have an engine for it.

StashKu supports being used directly in the browser, or on server-side (node). ─=≡Σ(((ﾉ☉ヮ⚆)ﾉ

You may be interested in these other engines:
- [stashku-sql](https://github.com/appku/stashku-sql): A library for interacting with Microsoft SQL Server and Postgres databases through StashKu.
- [stashku-log](https://github.com/appku/stashku-log): A logging library that taps into the logging interface of StashKu and provides reusable log handling and output options for applications.

## Getting Started
```sh
npm i --save @appku/stashku
```

Once installed, you can begin using the StashKu package in your code and the `stashku` CLI.

### Code Quick-Start
Using StashKu is meant to be painless - easy to learn but advanced when needed.

To use StashKu from the browser, you can bring in StashKu from a CDN, or copy the latest bundle from the 
`web/stashku-*.js` repository path, or use the `npm` installed package in your bundling project (React, Vue, etc.).

When StashKu starts, if an engine is not configured then a default one will be loaded. In-browser, the `fetch` engine
is the default. On node, the `memory` engine is the default. You can use another engine by specifying it's package
name (on node), or setting the engine value to the custom engine's instance.

```js
import StashKu from '@appku/stashku';
//...
let stash = new StashKu();
//...or
let stash = new StashKu({ engine: '@appku/stashku-sql' });
//...or
let myEngine = new WhateverEngine();
await myEngine.configure({ /* custom engine settings */ }, stash.log);
let stash = new StashKu({ engine: myEngine });
```

#### Making RESTful Requests
The beauty of StashKu is it's alignment with REST. Out-of-the-box, StashKu provides six (6) request methods:
- GET: For retrieving resource data.
- POST: For creating resource data.
- PUT: For updating keyed resource data.
- PATCH: For updating any resource data.
- DELETE: For destroying resource data.
- OPTIONS: For retrieving resource schema.

You can use these methods to submit a RESTful request to your loaded engine and act on it's resources.
No matter the engine, the *request* and *response* structure and interface is the **same**. (ღ˘⌣˘ღ)

> **For Example**    
> The `@appku/stashku-sql` engine provides an interface to a database. Submitting a GET request through 
> StashKu would be handed to the engine and translated into a `SELECT` SQL query and run on the database to retrieve
> table or view ("resources") data. The engine grabs the database query results and translates them into a standardized
> StashKu `Response` and hands them back to the requestor.

##### GET
```js
let stash = new StashKu();
let response = await stash.get(r => r
    .from('Contacts')
    .properties('ID', 'First_Name', 'Last_Name')
    .skip(5)
    .take(10)
    .where('{First_Name} CONTAINS "Bob" AND {Age} GTE 33')
    .sort('{ID} ASC', 'First_Name', 'Last_Name')
);
//Response { data: [...], total, returned, affected }
```

##### POST
```js
let stash = new StashKu();
let response = await stash.post(r => r
    .to('Contacts')
    .objects(
        { First_Name: 'Bob', Last_Name: 'Gorbermon', Age: 55 },
        { First_Name: 'Susan', Last_Name: 'Miller', Age: 23 },
        { First_Name: 'Christopher', Last_Name: 'Eaton', Age: 967 }
    )
);
//Response { data: [...], total, returned, affected }
```

##### PUT
```js
let stash = new StashKu();
let response = await stash.put(r => r
    .to('Contacts')
    .pk('ID')
    .objects({ ID: 344, Last_Name: 'Geeberman' })
);
//Response { data: [...], total, returned, affected }
```

##### PATCH
```js
let stash = new StashKu();
let response = await stash.patch(r => r
    .to('Contacts')
    .template({ Attended_Event: true })
    .where( f => f
        .and('Ticket', f.OP.EQUALS, true)
        .and('Attended_Event', f.OP.EQUALS, false)
        .or('Age', f.OP.GREATERTHAN, 40)
        .or('First_Name', f.OP.STARTSWITH, 'B')
    )
);
//Response { data: [...], total, returned, affected }
```

##### DELETE
```js
let stash = new StashKu();
let response = await stash.delete(r => r
    .from('Contacts')
    .where( f => f
        .or('First_Name', f.OP.ISNULL)
        .or('Age', f.OP.LESSTHAN, 18)
    )
);
//Response { data: [...], total, returned, affected }
```

##### OPTIONS
```js
let stash = new StashKu();
let response = await stash.options(r => r.from('Contacts'));
//Response { data: [...], total, returned, affected }
```

### CLI Quick-Start
Stashku provides a CLI that is available via the `stashku` command. This can be used when installed locally with the 
`npx` command. Optionally you can `npm i @appku/stashku -g`, and with the `-g` flag the command is available anywhere
on your system.

> Want to know more? Check out the [CLI tutorial](https://github.com/appku/stashku/tutorial-Using%20the%20CLI.html) on the [official documentation site](https://github.com/appku/stashku).

```sh
npx stashku
```

The CLI currently supports running GET and OPTIONS queries using the settings discovered from your environment 
(including a `.env` file). 

Using the CLI, you can retrieve data directly from the configured engine with a `get` command:
```sh
npx stashku get "ContactRecords"
```
and even do advanced queries with `where` and `sort` logic:
```sh
npx stashku get "ContactRecords" -w '{Name} CONTAINS "joe"' -sb '{ID} DESC'
```

You can also gain an understanding of your resource schema using the `options` command:
```sh
npx stashku options "Products"
```
Taking it a step further, you can generate extensible JavaScript models representing your resource:
```sh
npx stashku options "Products" -x ./models/
```
The generated models are 100% usable in StashKu and are designed to provide VS-Code compatible intellisense proper
JSdoc tags.

> Curious about models? Find the [model tutorial here](https://github.com/appku/stashku/tutorial-Going%20Next-Level%20with%20Models.html).

## Documentation
Formal documentation is [available here](https://github.com/appku/stashku). 

*This is currently a work-in-progress as of v-1.0.0 and will continue to be improved.*

## Configuration
StashKu can be configured using the following variables.

- **`STASHKU_ENGINE`**    
  Specifies the name of the StashKu engine (or package) to initialize. The built-in options are: `"memory"` and `"fetch"`.
  - Type: `String`
  - Default: `"memory"` (node) or `"default"` (browser)
  - StashKu configuration property: `engine`.

- **`STASHKU_MODEL_NAME_REMOVE`**    
  Used by the `ModelUtility` for defining regular expressions that match text to be removed from a generated model's class name (derived from a resource name). By default the configured expressions will strip "dbo.", "etl.", and "rpt." prefixes from resource names. The regular expressions must be declared within a JSON array in string format.
  - Type: `String`
  - Default: `["/^\\[?dbo\\]?\\./i", "/^\\[?etl\\]?\\./i", "/^\\[?rpt\\]?\\./i"]`

- **`STASHKU_MODEL_RESOURCE`**    
  Instructs StashKu which property from the `$stashku` object on a model type to populate the resource (`to` or `from`) on a request. Can be `"name"`, `"slug"`, `"plural.name"`, `"plural.slug"`, or `"resource"` (default).
  - Type: `String`
  - Default: `"resource"`
  - StashKu configuration property: `model.resource`.

## Development
StashKu is developed under the [AppKu]() umbrella, sponsored and backed by [Append](https://append.media). It is built using JavaScript in module format. 

### Generating Documentation
You can generate a static JSDoc site under the `docs/` path using the command `npm run docs`. Once generated, you can run `npm run serve-docs` to run a local web server that shows the generated documentation.

### Generating a Web Bundle
To generate a new web bundle, run `npm run build`. This will compile StashKu into a single `.js` file under the `web/` directory with the local version number.

## Testing
This project uses `jest` to perform unit tests.

### Running Tests
Run `npm test` to run jest unit tests.

Run `npm run lint` to run ESLint, optionally install the Visual Studio Code ESLint extension to have linting issues show in your "Problems" tab and be highlighted.

If you are writing unit tests, you may need to `npm install @types/jest` to get intellisense in Visual Studio Code if for some reason it did not get installed.

## Publishing
Only maintainers with proper access can publish this package to npm. To do so as maintainers, you can publish by running the following command:

```sh
npm publish --registry=https://registry.npmjs.org --access=public
```