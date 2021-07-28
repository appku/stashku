import RESTError from './rest-error.js';
import jest from 'jest-mock';

global.console = {
    warn: jest.fn()
};

describe('#constructor', () => {
    it('sets the code and message when specified.', () => {
        expect(new RESTError(404, 'not found').code).toBe(404);
        expect(new RESTError(404, 'not found').message).toBe('not found');
        expect(new RESTError(404, 'not found').name).toBe('Error');
    });
    it('warns when a bad error status code is provided', () => {
        new RESTError(200, 'ok');
        expect(global.console.warn).toHaveBeenCalled();
        try {
            throw new RESTError(606);
        } catch {
            //nothing
        }
        expect(global.console.warn).toHaveBeenCalledTimes(2);
    });
});

describe('throws', () => {
    it('throws ok', () => {
        expect(() => { throw RESTError(404); }).toThrow();
        expect(() => { throw new RESTError(404); }).toThrow();
    });
});