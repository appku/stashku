
/**
 * @namespace Filtering
 */

/**
 * @typedef Filtering.Condition
 * @property {String} property - The property name from the schema affected by the filter.
 * @property {String} op - The filter operator.
 * @property {*} [value] - The value used by the operator on the property value.
 */

/**
 * @typedef Filtering.LogicalGroup
 * @property {String} logic - The logical operator to apply to the filters.
 * @property {Array.<Filtering.Condition|Filtering.LogicalGroup>} filters - The filter items and groups under the logical operator.
 */

/**
 * @callback Filtering.WalkCallback
 * @param {Filtering.LogicalGroup | Filtering.Condition} filter
 * @param {Number} depth,
 * @param {Filtering.LogicalGroup | Filtering.Condition} [parent]
 */