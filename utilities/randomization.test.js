import Randomization from'./randomization.js';
const multiplier = 6; //number of 1024 iterations to test random value generation functions.

test('number: does not overflow.', () => {
    expect(Randomization.number).not.toThrowError();
    for (let x = 0; x < 1024 * multiplier; x++) {
        let n = Randomization.number();
        expect(n).toBeGreaterThanOrEqual(Number.MIN_SAFE_INTEGER);
        expect(n).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    }
});

test('number: returns a number in the specified range.', () => {
    expect(Randomization.number).not.toThrowError();
    for (let x = 0; x < 1024 * multiplier; x++) {
        let n = Randomization.number(x, x * 2);
        expect(n).toBeGreaterThanOrEqual(x);
        expect(n).toBeLessThanOrEqual(x * 2);
    }
});

test('number: returns whole number', () => {
    expect(Randomization.number).not.toThrowError();
    for (let x = 0; x < 1024 * multiplier; x++) {
        let n = Randomization.number(x, x * 2);
        expect(n).toEqual(Math.round(n));
    }
});

test('float: returns a number in the specified range.', () => {
    expect(Randomization.float).not.toThrowError();
    for (let x = 0; x < 1024 * multiplier; x++) {
        let n = Randomization.float(x, x * 2);
        expect(n).toBeGreaterThanOrEqual(x);
        expect(n).toBeLessThanOrEqual(x * 2);
    }
});

test('float: returns non-whole numbers', () => {
    let fpCount = 0;
    for (let x = 0; x < 1024 * multiplier; x++) {
        let n = Randomization.float(x, x * 2);
        if (n !== Math.round(n)) {
            fpCount++;
        }
    }
    //at least 50% of the random numbers should be non-whole.
    //technically this could flag, but it is a very, very low probability.
    expect(fpCount).toBeGreaterThan(1024 * multiplier / 2);
});

test('uuidv4: returns a valid v4 uuid', () => {
    expect(Randomization.uuidv4).not.toThrowError();
    let uuid = Randomization.uuidv4();
    expect(uuid).toBeTruthy();
    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBe(36);
    expect(uuid).toContain('-');
    expect(uuid).toBe(uuid.toLowerCase());
    expect(uuid).toMatch(/^[0-9a-f-]+$/);
});
