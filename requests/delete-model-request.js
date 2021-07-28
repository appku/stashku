import DeleteRequest from './delete-request.js';
import RESTError from '../rest-error.js';
import Filter from '../filter.js';
import ModelUtility from '../modeling/model-utility.js';

/**
 * Validates a filter or logical group's conditions recursively.
 * 
 * @throws Error when the condition field is not specified in the model type.
 * @param {*} modelType - The model type constraining the filter conditions.
 * @param {Filter|Filter.FilterLogicalGroup|Filter.FilterCondition} tree - The filter or filter logical group or conditions to validate.
 * @param {Map.<String, String>} [map] - A generated mapping for the model type. If not specified it will be generated.
 */
const validateConditions = (modelType, tree, map) => {
    if (!modelType) {
        throw new RESTError(500, 'Unable to validate filter conditions. The "modelType" argument is missing or invalid.');
    }
    if (!map) {
        map = ModelUtility.map(modelType);
    }
    if (tree) {
        if (tree.field) { //is a FilterCondition
            if (map.has(tree.field) === false) {
                throw new RESTError(400, `The where property field "${tree.field}" is not defined in the model "${modelType.name}".`);
            }
        } else if (tree.logic && tree.filters) { //is a FilterLogicalGroup
            for (let fg of tree.filters) {
                validateConditions(modelType, tree, map);
            }
        }
    }
};

/**
 * Validates a filter or logical group's conditions recursively.
 * @param {*} modelType - The model type constraining the filter conditions.
 * @param {Filter|Filter.FilterLogicalGroup|Filter.FilterCondition} tree - The filter or filter logical group or conditions to validate.
 * @param {Map.<String, String>} [map] - A generated mapping for the model type. If not specified it will be generated.
 */
const translateConditions = (modelType, tree, map) => {
    if (!modelType) {
        throw new RESTError(500, 'Unable to validate filter conditions. The "modelType" argument is missing or invalid.');
    }
    if (!map) {
        map = ModelUtility.map(modelType);
    }
    if (tree) {
        if (tree.field) { //is a FilterCondition
            if (map.has(tree.field) === false) {
                throw new RESTError(400, `The where property field "${tree.field}" is not defined in the model "${modelType.name}".`);
            }
        } else if (tree.logic && tree.filters) { //is a FilterLogicalGroup
            for (let fg of tree.filters) {
                translateConditions(modelType, tree, map);
            }
        }
    }
};

/**
 * This class defines a specialized `DeleteRequest` that enforces validation and translation of a specific model type.
 * @template MT
 */
class DeleteModelRequest extends DeleteRequest {
    /**
     * Creates a new DELETE request that enforces and translates information about a specific model type.
     * A DELETE request instructs StashKu to delete objects from storage that match the specified criteria.
     * @param {MT} modelType - The model-type to be enforced on this request.
     */
    constructor(modelType) {
        super();
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        this.metadata.model = modelType;
        this.from(ModelUtility.resource(modelType, this.method));
    }

    /**
     * @inheritdoc
     * @throws Error if the "conditions" argument must be null or a Filter instance.
     * @param {Filter|ConditionCallback} conditions - The conditions to be used to filter out results.
     * @returns {DeleteRequest}
     */
    where(conditions) {
        let map = ModelUtility.map(this.metadata.model);
        //validate condition names.
        validateConditions(this.metadata.model, conditions, map);
        //translate the names.
        //TODO
        //set the filter
        return super.where(conditions);
    }
}

export default DeleteModelRequest;