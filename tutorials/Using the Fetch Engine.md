
*Coming Soon*



  
- **`STASHKU_FETCH_MODEL_HEADER`**    
  Determines whether the fetch request to the HTTP endpoint will forward the model header when `STASHKU_MODEL_HEADER` is enabled. By default this is disabled and the header `model` property will *not* be sent. Setting this flag to `true` will forward the `model` header of the StashKu request.

  **JavaScript Example**
  ```js
  new StashKu({
      fetch: { 
          model: { header: false } } 
      }
  })
  ```
  **Shell/Environment Example**
  ```sh
  export STASHKU_FETCH_MODEL_HEADER=false
  ```

- **`STASHKU_FETCH_MODEL_PATH_PROPERTY`**    
  Instructs StashKu which property from the `$stashku` object on a model type to populate the resource (`to` or `from`) on a request. Can be `"name"`, `"slug"`, `"plural.name"`, `"plural.slug"`, or `"resource"` (default).

  This requires that the `STASHKU_MODEL_HEADER` setting is `true`, or that you manually pass the appropriate `model` header object in requests to the fetch engine. If the appropriate property is not found in the header, the request's resource (`to`/`from`) is used instead.

  **JavaScript Example**
  ```js
  new StashKu({
      fetch: { 
          model: { pathProperty: 'plural.slug' } }
      }
  })
  ```
  **Shell/Environment Example**
  ```sh
  export STASHKU_FETCH_MODEL_PATH_PROPERTY=plural.slug
  ```