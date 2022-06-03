# StashKu
StashKu is a data storage agnostic, flat-data framework that provides an interface for RESTful operations against common data storage mediums. The framework provides the tools needed to begin leveraging and extending it out of the box. Specifically, two "engines" are provided to get you started- One for in-memory storage, and another for fetch requests.

"Engines" act as the translator of StashKu RESTful requests to whatever data storage medium is on the other end - whether it's a hard disk, a hardware sensor, a database, or even an API. They are responsible for crafting standardized responses which StashKu hands back off to the requestor. As long as it can be interacted with through RESTful requests such as GET, POST, PUT, PATCH, DELETE, and OPTIONS, StashKu could *potentially* have an engine for it. If you'd like to create your own engine, check out the tutorials on our formal [documentation site](https://appku.github.io/stashku/index.html).

StashKu supports some amazing features:

- Can be used in modern browsers or on server-side (node). ─=≡Σ(((ﾉ☉ヮ⚆)ﾉ
- [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) via [RESTful](https://en.wikipedia.org/wiki/Representational_state_transfer) requests, paging, sorting, constraining properties, and even filtering via conditional expressions.
- Sorting through objects or string expressions:    
  *e.g. `{FirstName} DESC` `{LastName} ASC`*
- Filtering through objects, chained callback objects, or string expressions:    
  *e.g. `({FirstName} CONTAINS "Chris" OR {Age} >= 30) AND {Ticket} == true`*
- Support of models with JSDoc & VS Code intellisense. 
- A command line interface which allows you to make GET and OPTIONS requests (generate models).    
  *See: [Going next-level with Models](https://appku.github.io/stashku/tutorial-Going%20Next-Level%20with%20Models.html).*
- Middleware support.    
  *See: [Writing your own middleware tutorial](https://appku.github.io/stashku/tutorial-Writing%20Your%20Own%20Middleware.html).*
- Pluggable engine support.    
  *See: [Writing your own engine tutorial](https://appku.github.io/stashku/tutorial-Writing%20Your%20Own%20Engine.html).*
- Built-in logging extensibility through standard logger callbacks.    
  *Check out our console/file log middleware [stashku-log](https://github.com/appku/stashku-log).*

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
Optionally, supplying a JSON array from a file of resource names to export:
```sh
npx stashku options ./model-list.json -x ./models/
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

  **JavaScript Example**
  ```js
  new StashKu({
      engine: '@appku/stashku-sql'
  })
  ```
  **Shell/Environment Example**
  ```sh
  export STASHKU_ENGINE='@appku/stashku-sql'
  ```

- **`STASHKU_MODEL_NAME_REMOVE`**    
  Used by the `ModelUtility` for defining regular expressions that match text to be removed from a generated model's class name (derived from a resource name). By default the configured expressions will strip "dbo.", "etl.", and "rpt." prefixes from resource names. The regular expressions must be declared within a JSON array in string format.
  - Type: `String`
  - Default: `["/^\\[?dbo\\]?\\./i", "/^\\[?etl\\]?\\./i", "/^\\[?rpt\\]?\\./i"]`

  **Shell/Environment Example**
  ```sh
  export STASHKU_MODEL_NAME_REMOVE='["/^\\[?schema\\]?\\./i"]'
  ```

- **`STASHKU_MODEL_HEADER`** 
  Instructs StashKu to add a header `model` with the value of the `$stashku` definition to all modelled RESTful requests. Certain engines, such as `fetch` may offer advanced features that leverage model information in their operation. This is disabled by default.
  - Type: `Boolean`
  - Default: `false`
  - StashKu configuration property: `model.header`.

  **JavaScript Example**
  ```js
  new StashKu({
      model: { header: false }
  })
  ```
  **Shell/Environment Example**
  ```sh
  export STASHKU_MODEL_HEADER=false
  ```

The built-in engines all have their own supported configuration's as well, you can find them described through their API documentation or the available tutorials:

- Memory: [Tutorial](https://appku.github.io/stashku/tutorial-Using%20the%20Memory%20Engine.html) or [API](https://appku.github.io/stashku/MemoryEngine.html)
- Fetch: [Tutorial](https://appku.github.io/stashku/tutorial-Using%20the%20Fetch%20Engine.html) or [API](https://appku.github.io/stashku/FetchEngine.html)

## Development
StashKu is developed under the [AppKu](https://www.appku.com) umbrella, sponsored and backed by [Append](https://append.media). It is built using JavaScript in module format. 

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