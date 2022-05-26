StashKu includes a built-in default storage engine for storing in-memory objects. This engine is used when the StashKu configuration has an `engine` with the value `"memory"`, which is the default. Contents stored in this engine are lost if the application runtime stops for any reason. 

### Configuration
| Property | ENV | Type | Default | Description |
|-|-|-|-|-|
| `limit` | STASHKU_MEMORY_LIMIT | `Number` | `0` | Limits the maximum number of objects that can be stored in the memory engine per resource name. If this limit is reached, POST requests will throw an error. |
| `caseSensitive` | STASHKU_MEMORY_CASE_SENSITIVE | `Boolean` | `false` | Controls whether all resource names are stored in lower-case, and tracked case-insensitively or not. By default this is unset in the configuration which will default to `false` internally and allow it to be overridden by request headers. If set explicitly, the request header's `caseSensitive` flag will be ignored. |
