StashKu includes a built-in default storage engine for storing in-memory objects. This engine is used when the StashKu configuration has an `engine` with the value `"memory"`, which is the default in node environments. Contents stored in this engine are lost if the application runtime stops for any reason. 

## Configuration
The memory engine can be configured using the following variables.

- **`STASHKU_MEMORY_LIMIT`**    
  Limits the maximum number of objects that can be stored in the memory engine per resource name. If this limit is reached, POST requests will throw an error.
  - Type: `Number`
  - Default: `0` (no limit)
  - Configuration property: `engine`.

  **JavaScript Example**
  ```js
  new StashKu({
      engine: 'memory',
      memory: {
          limit: 0
      }
  })
  ```
  **Shell/Environment Example**
  ```sh
  export STASHKU_MEMORY_LIMIT=0
  ```

- **`STASHKU_MEMORY_CASE_SENSITIVE`**    
  Controls whether all resource names are stored in lower-case, and tracked case-insensitively or not. 
  - Type: `Number`
  - Default: `0` (no limit)
  - Configuration property: `engine`.

  **JavaScript Example**
  ```js
  new StashKu({
      engine: 'memory',
      memory: {
          limit: 0
      }
  })
  ```
  **Shell/Environment Example**
  ```sh
  export STASHKU_MEMORY_CASE_SENSITIVE=false
  ```
