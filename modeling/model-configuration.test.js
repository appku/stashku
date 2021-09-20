import ModelConfiguration from './model-configuration.js';

describe('#constructor', () => {
    it('sets the "resource" from the constructor.', () => {
        expect(new ModelConfiguration().resource).toBeNull();
        expect(new ModelConfiguration('abc').resource).toBe('abc');
        expect(new ModelConfiguration({}).resource).toEqual({});
    });
});