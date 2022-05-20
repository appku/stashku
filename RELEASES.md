# v-0.5.0: Full Model Support
- Supports modeling through all requests.
- Added CLI interface and bin command "stashku".

# v-0.4.9: Final Pre-model Supporting Version
- Bug fixes, general stability corrections.

# v-0.4.3: JSON Stringify Support
- New `fromObject` support to `Filter` class.
- New `requestFromFile` and `requestFromObject` static StashKu functions to generate request instances from untyped objects (or JSON files).
- Depreciate use of term "field" and use "property" instead to align with requests, models, and other areas of StashKu.
  - The `GetRequest` `sort` function prefers `property` over a `field` property on a sort object passed.
  - (*Breaking*) The `Filter` now uses `property` instead of `field`. The constructor will convert `field` properties to `property`.

# v-0.4.2: JSON Stringify Support
- Add `toJSON` support to `Filter` class.
- Add `toJSON` support to `DeleteRequest` class.
- Add `toJSON` support to `GetRequest` class.
- Add `toJSON` support to `PatchRequest` class.
- Add `toJSON` support to `PostRequest` class.
- Add `toJSON` support to `PutRequest` class.
- Add `toJSON` support to `OptionsRequest` class.

# v-0.4.1: Filter & Sort Parsing
- Add `toString` and static `parse` functions to `Sort` class.
- Add `toString` and static `parse` functions to `Filter` class.

# v-0.4.0: Models
- Support for a new OPTIONS request, which should return a schema of the target resource. 
- Full support for model usage in all request types:
  - GET
  - POST
  - PUT
  - DELETE
- Support empty GET request calls (to retrieve all data).
- Support request `headers` for per-request, per-engine configuration options.
- Support exporting model instances to yaml, toml, or json using the new `export` function.

## Memory Engine
- Add support for new OPTIONS requests.
- Add support for header `caseSensitive`.
- Case-insensitive memory storage resource name support by default.

## Breaking Changes
- Remove depreciated `key` and `keys` functions on PUT request (use `pk` instead).
- The `meta` function on all request types has been depreciated in lieu of `headers`. It will be removed in a future release.

# v-0.3.28: Baseline
This is the final 0.3.x release and completes the baseline release of StashKu, performing exceptionally well in production scenarios. The Append team is super happy to release this amazing package to the world under an open-source license.

- Support for all CRUD based RESTful methods (POST, GET, PUT, DELETE respectively).
- Request <-> Response architecture.
- Support for middleware plugins.
- Configurable engines for handling request.