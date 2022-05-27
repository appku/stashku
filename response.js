/**
 * A standard response from a StashKu storage engine that completes a request.
 * @template M
 */
class Response {

    /**
     * Creates a standard response of the data returned by a StashKu storage engine.
     * @param {Array.<M>} data - The data to be returned to the requesting caller.
     * @param {Number} [total=0] - The total number of objects available to the request. If not specified the count of data objects is used.
     * @param {Number} [affected=0] - The number of objects affected in storage.
     * @param {Number} [returned=0] - The number of objects returned from storage.
     * @param {Number} [code=200] - Optional status code to include as part of the response. If you are returning an
     * error, consider throwing a `RestError` instead.
     */
    constructor(data, total, affected, returned, code) {

        /**
         * @type {Number}
         */
        this.code = code || 200;

        /**
         * An array of the objects returned from storage.
         * @type {Array.<M>}
         */
        this.data = data || [];

        /**
         * The number of objects (records) *available* (i.e. resulting from) the request query in consideration of
         * any `where` conditions, but disregarding any `skip` and `take` paging limitations.    
         * @type {Number}
         */
        this.total = parseInt(total) || 0;

        /**
         * The number of objects (records) affected (altered/touched/created) in storage as a result of the request.
         * 
         * This number is always `0` for GET requests.
         * @type {Number}
         */
        this.affected = parseInt(affected) || 0;

        /**
         * The number of objects (records) returned from storage as a result of the request.    
         * 
         * This number *will be* populated on GET requests utilizing the `.count()` flag, even though no objects are returned in `data`.
         * @type {Number}
         */
        this.returned = parseInt(returned) || 0;

        if (!this.total && this.data && this.data.length) {
            this.total = this.data.length;
        }
    }

    /**
     * Returns an empty response with no objects and a total of 0.
     * @returns {Response}
     */
    static empty() {
        return new Response();
    }

    /**
     * Returns the first data record from the response. If no data records are present, null is returned.
     * @returns {M}
     */
    one() {
        if (this.data && this.data.length) {
            return this.data[0];
        }
        return null;
    }

}

export default Response;