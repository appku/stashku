import Sort from './sort.js';

describe('#constructor', () => {
    it('sets a property name if given', () => {
        expect(new Sort('test').property).toBe('test');
    });
    it('sets a property name and sort order if given', () => {
        expect(new Sort('test', Sort.DIR.DESC).property).toBe('test');
        expect(new Sort('test', Sort.DIR.DESC).dir).toBe(Sort.DIR.DESC);
    });
    it('sets the default sort direction to ascending.', () => {
        expect(new Sort().dir).toBe(Sort.DIR.ASC);
    });
});

describe('.asc', () => {
    it('returns a new Sort instance sorted in ASC direction.', () => {
        expect(Sort.asc('abc').property).toBe('abc');
        expect(Sort.asc('abc').dir).toBe(Sort.DIR.ASC);
    });
});

describe('.desc', () => {
    it('returns a new Sort instance sorted in DESC direction.', () => {
        expect(Sort.desc('abc').property).toBe('abc');
        expect(Sort.desc('abc').dir).toBe(Sort.DIR.DESC);
    });
});