import Logger from './logger.js';
import jest from 'jest-mock';

describe('#constructor', () => {
    it('sets the callback function from the argument.', () => {
        expect(new Logger().callback).toBeNull();
        let cb = () => { };
        expect(new Logger(cb).callback).toBe(cb);
    });
});

for (let severity of ['debug', 'info', 'warn', 'error']) {
    describe(`#${severity}`, () => {
        it('calls the specified callback with the proper state & severity.', async () => {
            let cb = jest.fn();
            let log = new Logger(cb);
            let args = ['test', 123, true, new Date(), { hello: 'world' }];
            await log[severity](...args);
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith('log', severity, args);
        });
        it('does not error when the callback is not present.', async () => {
            expect.assertions(1);
            let log = new Logger();
            await log[severity]('test', 123);
            expect(true).toBe(true);
        });
    });
}