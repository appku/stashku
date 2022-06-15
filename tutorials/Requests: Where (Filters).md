StashKu includes the ability to build complex filters that support logical `AND` and `OR` conditions, with a variety
of comparative operators. Filters can be created using chained `and`/`or` function calls, or parsed from a string 
expression, making it easy to write filters for use in request `where` functions quick and painless.

The `Filter` also can operate on a spread array of objects using the `test` function, which will return only objects
matching the criteria.

## Getting Started
You can create a new Filter from a string expression:
```js
Filter.parse('{Name} ~~ "Doe" AND Age > 18');
```
...you can even using logical chain functions together into logical groups:

```js
Filter
    .and('{Name} ~~ "Doe" OR {Name} !~~ "Doey"')
    .and('Age > 18');
```
...or just group in your string:
```js
Filter.parse('({Name} ~~ "Doe" OR {Name} !~~ "Doey") AND Age > 18')
```
> *Yes!* Nested parenthesis are 100% supported to any depth. ~(˘▾˘~)

If you're feeling traditional, you can build filters in the traditional parameterized approach:
```js
Filter
    .and(Filter
        .or('Name', Filter.OP.CONTAINS, 'Doe')
        .or('Name', Filter.OP.NOTCONTAINS, 'Doey')
    )
    .and('Age', Filter.OP.GREATERTHAN, 18);
```
### Peeking at The Filter
Viewing the filter's expression tree is sometimes tiresome for troubleshooting, that's why the `Filter` instance
fully supports a `toString()` override that outputs the string expression equivalent of the tree.

This makes looking at a filter defined like this:
```js
let f = Filter
    .or('ID', Filter.OP.EQUALS, 1)
    .or('ID', Filter.OP.EQUALS, 2)
    .or(Filter
        .and('Name', Filter.OP.ISNULL)
        .and('Age', Filter.OP.GREATERTHAN, 24)
        .or('Products', Filter.OP.IN, [1, 2, 3])
    );
```
... into a string like this:
```
{ID} EQ 1 OR {ID} EQ 2 OR (({Name} ISNULL AND {test4} GREATERTHAN 24) OR {Products} IN [1, 2, 3])
```
Best of all, you can `Filter.parse` the `toString`'d value back into a new `Filter` instance.


### Filtering Object Arrays
In this example where we're going to filter an array of simple objects using the `test()` function, searching for
records with the `Name` property containing the value `"Doe"`:
```js
let contacts = [
    { Name: 'John Doe', Age: 22},
    { Name: 'Marcus Inger', Age: 45},
    { Name: 'Gilli Mokes', Age: 18},
    { Name: 'Susan Doe', Age: 21},
    { Name: 'Sally Sue', Age: 55}
];
let results = Filter
    .and('Name', Filter.OP.CONTAINS, 'Doe')
    .test(...contacts);
console.log(results);
// [ { Name: 'John Doe', Age: 22}, { Name: 'Susan Doe', Age: 21} ]
```

This is similar to using a JavaScript array's built-in `filter` method, but in this case we are using a portable and
cross-domain filter that is standardized. 

### Usage on a StashKu Request
Filters power StashKu requests, and are used by engines to translation conditional expressions into their resource
interface. Requests accept filters in their `where` function, which is only on `GetRequest`, `DeleteRequest` and
`PatchRequest` instances. 

The `where` functions accept a `Filter` string expression:

```js
await myStash.get(r => r
    .where('{Name} ~~ "Doe" OR {Name} !~~ "Doey"')
);
```
... or a `Filter` instance:
```js
let myConditions = Filter.and('Name', Filter.OP.CONTAINS, 'Doe');
await myStash.delete(r => r
    .where(myConditions)
);
```
... or a callback that lets you build on a filter already set on the request. This can be useful for cross-domain
StashKu requests.
```js
let myConditions = Filter.and('Name', Filter.OP.CONTAINS, 'Doe');
await myStash.patch(r => r
    .where(myConditions)
    .where((f, orig) => orig.or('{Name} ~~~ "Doey"'))
);
```
A cross-domain StashKu request, for example, could be a request passed from the `fetch` engine to a StashKu instance on
the server being served up on `express`- where you want the server wants constrain the results (let's say... only where
the `DateDeleted` property is `null`) could look like this:
```js
let inReq = StashKu.fromObject(httpReq);
await myStash.patch(inReq
    .where((f, orig) => Filter.and(orig).and('{DateDelete} ISNULL'))
);
```
> Want to see this in action? Check out the [node+browser demo](https://github.com/appku/stashku/tree/master/demo).

## Logic
The following logical conditions are available on `Filter` objects:

| Property | Value | Function |
| - | - | - |
| `Filter.LOGIC.AND` | `"and"` | `Filter.and(...)` |
| `Filter.LOGIC.OR` | `"or"` | `Filter.or(...)` |

## Operators
The following operators are available for use in an expression. All engines built-into StashKu support these operations. In string expressions, you should use the **uppercase** *value* or *alias*, though the property name will work as well.

| Property | Value | Aliases (String Expressions) |
| - | - | - |
| `Filter.OP.EQUALS` | `"eq"` | `"=="` |
| `Filter.OP.NOTEQUALS` | `"neq"` | `"!="` |
| `Filter.OP.ISNULL` | `"isnull"` | |
| `Filter.OP.ISNOTNULL` | `"isnotnull"` | |
| `Filter.OP.LESSTHAN` | `"lt"` | `"<"` |
| `Filter.OP.LESSTHANOREQUAL` | `"lte"` | `"<="` |
| `Filter.OP.GREATERTHAN` | `"gt"` | `">"` |
| `Filter.OP.GREATERTHANOREQUAL` | `"gte"` | `">="` |
| `Filter.OP.STARTSWITH` | `"startswith"` | |
| `Filter.OP.ENDSWITH` | `"endswith"` | |
| `Filter.OP.CONTAINS` | `"contains"` | `"~~"` |
| `Filter.OP.DOESNOTCONTAIN` | `"doesnotcontain"` | `"!~~"` |
| `Filter.OP.ISEMPTY` | `"isempty"` | |
| `Filter.OP.ISNOTEMPTY` | `"isnotempty"` | |
| `Filter.OP.IN` | `"in"` | |
| `Filter.OP.NOTIN` | `"nin"` | |

## Looking for More?
- Read more about `Filter` in the [API documentation here](https://appku.github.io/stashku/Filter.html).
- Ask a question or say hello on the [AppKu discussion board](https://github.com/orgs/appku/discussions).