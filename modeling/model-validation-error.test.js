import ModelValidationError from './model-validation-error';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('sets the "property" property when specified.', () => {
        expect(new ModelValidationError('test').property).toBe('test');
    });
    it('sets a default error message when only specifying the property.', () => {
        expect(new ModelValidationError('test123').message).toMatch(/"test123"/);
    });
    it('can be thrown like a normal error.', () => {
        expect(() => {
            throw new ModelValidationError('pirates');
        }).toThrow(/"pirates"/);
        try {
            throw new ModelValidationError('pirates', 'hi there');
        } catch (err) {
            expect(err.message).toBe('hi there');
            expect(err.stack).toBeTruthy();
        }
    });
});