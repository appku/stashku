import Response from './response.js';

describe('#constructor', () => {
    it('sets the data in the "objects" argument with a total to match.', () => {
        expect(new Response([{}, {}]).data.length).toBe(2);
        expect(new Response([{}, {}]).total).toBe(2);
        expect(new Response().total).toBe(0);
    });
    it('sets the total from arguments.', () => {
        expect(new Response(null, 123).total).toBe(123);
        expect(new Response(null, null).total).toBe(0);
    });
    it('sets the affected from arguments.', () => {
        expect(new Response(null, null, 123).affected).toBe(123);
        expect(new Response(null, null, null).affected).toBe(0);
    });
    it('sets the returned from arguments.', () => {
        expect(new Response(null, null, null, 123).returned).toBe(123);
        expect(new Response(null, null, null, null).returned).toBe(0);
    });
    it('sets the code from arguments.', () => {
        expect(new Response(null, null, null, null, 500).code).toBe(500);
        expect(new Response(null, null, null, null, null).code).toBe(200);
    });
});

describe('.empty', () => {
    it('returns an empty response.', () => {
        expect(Response.empty().data.length).toBe(0);
        expect(Response.empty().code).toBe(200);
        expect(Response.empty().total).toBe(0);
        expect(Response.empty().affected).toBe(0);
        expect(Response.empty().returned).toBe(0);
    });
});
describe('.one', () => {
    it('returns only the first record.', () => {
        let r = new Response(['a', 'b', 'c'], 1, 2, 1);
        expect(r.one()).toBe('a');
        r = new Response([{ hi: 'mom' }], 1, 2, 1);
        expect(r.one()).toEqual({ hi: 'mom' });
    });
    it('returns null if no data.', () => {
        let r = new Response(null, 1, 2, 1);
        expect(r.one()).toBe(null);
        r.data = null;
        expect(r.one()).toBe(null);
    });
});