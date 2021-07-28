import objects from './objects.js';

describe('.fromEntries', () => {
    it('creates an object with the properties and values from an array of tuples.', () => {
        let a = [['abc', 123], ['moose', 'goose'], ['gas']];
        let o = objects.fromEntries(a);
        expect(o.abc).toBe(123);
        expect(o.moose).toBe('goose');
        expect(o.gas).toBeUndefined();
        expect(Object.keys(o)).toContain('gas');
    });
});

describe('.getPrototype', () => {
    it('Returns null on no matches.', () => {
        class TestA {
            constructor() { }
        }
        class TestB extends TestA {
            constructor() { super(); }
        }
        class TestC extends TestB {
            constructor() { super(); }
        }
        expect(objects.getPrototype(new TestA(), 'TestA')).toBeNull();
        expect(objects.getPrototype(new TestB(), 'TestB')).toBeNull();
        expect(objects.getPrototype(new TestC(), 'TestC')).toBeNull();
        expect(objects.getPrototype(new TestA(), 'DoesntExist')).toBeNull();
        expect(objects.getPrototype(new TestB(), 'DoesntExist')).toBeNull();
        expect(objects.getPrototype(new TestC(), 'DoesntExist')).toBeNull();
        expect(objects.getPrototype(new TestA(), TestA)).toBeNull();
        expect(objects.getPrototype(new TestA(), TestB)).toBeNull();
        expect(objects.getPrototype(new TestA(), TestC)).toBeNull();
        expect(objects.getPrototype(new TestB(), TestC)).toBeNull();
        expect(objects.getPrototype(new TestC(), TestC)).toBeNull();
        expect(objects.getPrototype(new TestA(), 'TestA', 'TestB', 'TestC')).toBeNull();
    });
    it('Returns protoype object on match from classes.', () => {
        class TestA {
            constructor() { }
        }
        class TestB extends TestA {
            constructor() { super(); }
        }
        class TestC extends TestB {
            constructor() { super(); }
        }
        expect(objects.getPrototype(new TestB(), 'TestA')).toBeInstanceOf(TestA);
        expect(objects.getPrototype(new TestB(), 'TestA')).not.toBeInstanceOf(TestB);
        expect(objects.getPrototype(new TestC(), 'TestA')).toBeInstanceOf(TestA);
        expect(objects.getPrototype(new TestC(), 'TestB')).toBeInstanceOf(TestB);
        expect(objects.getPrototype(new TestA(), 'Object')).toBeInstanceOf(Object);
        expect(objects.getPrototype(new TestB(), 'Object')).toBeInstanceOf(Object);
        expect(objects.getPrototype(new TestC(), 'Object')).toBeInstanceOf(Object);
        expect(objects.getPrototype(new TestB(), 'TestB', TestA)).toBeInstanceOf(TestA);
        expect(objects.getPrototype(new TestC(), 'Object', 'TestA')).toBeInstanceOf(TestA);
    });
    it('Returns protoype object on match from traditional objects.', () => {
        let TestA = function () { };
        let TestB = function () {
            TestA.call(this);
        };
        let TestC = function () {
            TestB.call(this);
        };
        TestB.prototype = Object.create(TestA.prototype);
        TestB.prototype.constructor = TestB;
        TestC.prototype = Object.create(TestB.prototype);
        TestC.prototype.constructor = TestC;
        expect(objects.getPrototype(new TestB(), 'TestA')).toBeInstanceOf(TestA);
        expect(objects.getPrototype(new TestB(), 'TestA')).not.toBeInstanceOf(TestB);
        expect(objects.getPrototype(new TestC(), 'TestA')).toBeInstanceOf(TestA);
        expect(objects.getPrototype(new TestC(), 'TestB')).toBeInstanceOf(TestB);
        expect(objects.getPrototype(new TestA(), 'Object')).toBeInstanceOf(Object);
        expect(objects.getPrototype(new TestB(), 'Object')).toBeInstanceOf(Object);
        expect(objects.getPrototype(new TestC(), 'Object')).toBeInstanceOf(Object);
        expect(objects.getPrototype(new TestB(), 'TestB', TestA)).toBeInstanceOf(TestA);
        expect(objects.getPrototype(new TestC(), 'Object', 'TestA')).toBeInstanceOf(TestA);
    });
});

describe('.getPropertyNames', () => {
    it('gets valid property names of standard objects.', () => {
        let x = {
            test: () => { }
        };
        expect(objects.getPropertyNames(x)).toBeTruthy();
        expect(Array.isArray(objects.getPropertyNames(x))).toBe(true);
        expect(objects.getPropertyNames(x).length).toBe(13);
        expect(objects.getPropertyNames(x)).toContain('test');
    });
    it('gets valid property names of es6 objects.', () => {
        class test {
            constructor() { }

            add(x, y) { return x + y; }
        }
        let x = new test();
        expect(objects.getPropertyNames(x)).toBeTruthy();
        expect(Array.isArray(objects.getPropertyNames(x))).toBe(true);
        expect(objects.getPropertyNames(x).length).toBeGreaterThan(1);
        expect(objects.getPropertyNames(x)).toContain('add');
    });
    describe('@options', () => {
        it('object = false, hides default object properties.', () => {
            class test {
                constructor() { }

                add(x, y) { return x + y; }
            }
            let x = new test();
            expect(objects.getPropertyNames(x, { object: false })).toContain('add');
            expect(objects.getPropertyNames(x, { object: false }).length).toBe(1);
            x = {
                test: () => { }
            };
            expect(objects.getPropertyNames(x, { object: false })).toContain('test');
            expect(objects.getPropertyNames(x, { object: false })).not.toContain('constructor');
            expect(objects.getPropertyNames(x, { object: false })).not.toContain('prototype');
            expect(objects.getPropertyNames(x, { object: false })).not.toContain('__proto__');
        });
        it('depth, scans to depth maximum down prototype chain.', () => {
            class base {
                add(x, y) { return x + y; }
            }
            class foundation extends base {
                constructor() { super(); }

                subtract(x, y) { return x - y; }
            }
            class test extends foundation {
                constructor() { super(); }

                multiply(x, y) { return x * y; }
            }
            let x = new test();
            expect(objects.getPropertyNames(x, { depth: 1 })).toContain('subtract');
            expect(objects.getPropertyNames(x, { depth: 1 })).not.toContain('add');
            expect(objects.getPropertyNames(x, { depth: 2 })).toContain('add');
            expect(objects.getPropertyNames(x, { depth: 0 })).not.toContain('subtract');
            expect(objects.getPropertyNames(x, { depth: 0 })).not.toContain('add');
        });
        it('stopTypes, scans up to a specified stopType.', () => {
            class base {
                add(x, y) { return x + y; }
            }
            class foundation extends base {
                constructor() { super(); }

                subtract(x, y) { return x - y; }
            }
            class test extends foundation {
                constructor() { super(); }

                multiply(x, y) { return x * y; }
            }
            let x = new test();
            expect(objects.getPropertyNames(x, { stopTypes: [foundation] })).toContain('multiply');
            expect(objects.getPropertyNames(x, { stopTypes: [foundation] })).not.toContain('subtract');
            expect(objects.getPropertyNames(x, { stopTypes: [base] })).toContain('multiply');
            expect(objects.getPropertyNames(x, { stopTypes: [base] })).toContain('subtract');
            expect(objects.getPropertyNames(x, { stopTypes: [base] })).not.toContain('add');
        });
        it('ignore, skips properties specified.', () => {
            class test {
                constructor() { }

                add(x, y) { return x + y; }

                remove() { }

                clear() { }
            }
            let x = new test();
            let results = objects.getPropertyNames(x, { ignore: ['clear'] });
            expect(results).toContain('add');
            expect(results).toContain('remove');
            expect(results).toContain('constructor');
            expect(results).not.toContain('clear');
        });
    });
});