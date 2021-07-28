import ModelConfiguration from './model-configuration.js';

describe('#constructor', () => {
    it('sets the "resource" from the constructor.', () => {
        expect(new ModelConfiguration().resource).toBeNull();
        expect(new ModelConfiguration('abc').resource).toBe('abc');
        expect(new ModelConfiguration({}).resource).toEqual({});
    });
    it('sets the "pk" from the constructor.', () => {
        expect(new ModelConfiguration().pk).toEqual([]);
        expect(new ModelConfiguration('abc', '1', 'b', 'a').pk).toEqual(['1', 'b', 'a']);
    });
});