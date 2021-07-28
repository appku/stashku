import Files from './files.js';
import path from 'path';
import fs from 'fs';

const moduleRoot = path.dirname(path.resolve('./utilities/files.js'));
const testRoot = path.join(moduleRoot, '../test/files/');

beforeAll(() => {
    if (fs.existsSync(testRoot) === false) {
        fs.mkdirSync(testRoot);
    }
});

afterAll(async () => {
    await fs.promises.rmdir(testRoot);
});

describe('#find', () => {
    beforeAll(() => {
        for (let x = 1; x <= 4; x++) {
            fs.writeFileSync(path.join(testRoot, `./find-test.${x}`), '');
        }
    });
    afterAll(async () => {
        for (let x = 1; x <= 4; x++) {
            await fs.promises.unlink(path.join(testRoot, `./find-test.${x}`)).catch(() => { });
        }
    });
    it('returns all files included resolved to an absolute path.', async () => {
        let results = await Files.including(
            path.join(testRoot, './find-test.1'),
            path.join(testRoot, './find-test.2'),
            path.join(testRoot, './find-test.3'),
            '/otherpath/find-test.4')
            .find();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 4; x++) {
            expect(results[x]).toMatch(new RegExp(`^/.+find-test.${x + 1}$`, 'i'));
        }
    });
    it('returns all files included resolved to an absolute path using the specified root.', async () => {
        let results = await Files.including(
            './files.test/find-test.1',
            './files.test/find-test.2',
            './files.test/find-test.3',
            '/otherpath/find-test.4')
            .root('/tacobell/')
            .find();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 3; x++) {
            expect(results[x]).toMatch(new RegExp(`^/tacobell/.+find-test.${x + 1}$`, 'i'));
        }
        expect(results[3]).toBe('/otherpath/find-test.4');
    });
    it('finds files using a glob pattern and returns absolute paths.', async () => {
        let results = await Files
            .glob(path.join(testRoot, './find-test.*'))
            .find();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 4; x++) {
            expect(results[x]).toMatch(new RegExp(`^/.+find-test.${x + 1}$`, 'i'));
        }
    });
    it('includes file paths but ignores those matching ignore globs.', async () => {
        let results = await Files.including(
            path.join(testRoot, './find-test.1'),
            path.join(testRoot, './find-test.2'),
            path.join(testRoot, './find-test.3'),
            '/otherpath/find-test.4')
            .ignore('/otherpath/*')
            .find();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(3);
        for (let x = 0; x < 3; x++) {
            expect(results[x]).toMatch(new RegExp(`^/.+find-test.${x + 1}$`, 'i'));
        }
    });
    it('includes file paths and found with globs but ignores those matching ignore globs.', async () => {
        let results = await Files.including(
            path.join(testRoot, './find-test.fake'),
            path.join(testRoot, './find-test.4'),
            '/otherpath/find-test.4')
            .glob(path.join(testRoot, './find-test.[1-2]'))
            .ignore('/otherpath/*', '**/*.fake')
            .find();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(3);
        for (let x = 0; x < 3; x++) {
            expect(results[x]).toMatch(/^\/.+find-test.[1-4]$/);
        }
    });
});

describe('#findSync', () => {
    beforeAll(() => {
        for (let x = 1; x <= 4; x++) {
            fs.writeFileSync(path.join(testRoot, `./find-sync-test.${x}`), '');
        }
    });
    afterAll(async () => {
        for (let x = 1; x <= 4; x++) {
            await fs.promises.unlink(path.join(testRoot, `./find-sync-test.${x}`)).catch(() => { });
        }
    });
    it('returns all files included resolved to an absolute path.', () => {
        let results = Files.including(
            path.join(testRoot, './find-sync-test.1'),
            path.join(testRoot, './find-sync-test.2'),
            path.join(testRoot, './find-sync-test.3'),
            '/otherpath/find-sync-test.4')
            .findSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 4; x++) {
            expect(results[x]).toMatch(new RegExp(`^/.+find-sync-test.${x + 1}$`, 'i'));
        }
    });
    it('returns all files included resolved to an absolute path using the specified root.', () => {
        let results = Files.including(
            './files.test/find-sync-test.1',
            './files.test/find-sync-test.2',
            './files.test/find-sync-test.3',
            '/otherpath/find-sync-test.4')
            .root('/tacobell/')
            .findSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 3; x++) {
            expect(results[x]).toMatch(new RegExp(`^/tacobell/.+find-sync-test.${x + 1}$`, 'i'));
        }
        expect(results[3]).toBe('/otherpath/find-sync-test.4');
    });
    it('finds files using a glob pattern and returns absolute paths.', () => {
        let results = Files
            .glob(path.join(testRoot, './find-sync-test.*'))
            .findSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 4; x++) {
            expect(results[x]).toMatch(new RegExp(`^/.+find-sync-test.${x + 1}$`, 'i'));
        }
    });
    it('includes file paths but ignores those matching ignore globs.', () => {
        let results = Files.including(
            path.join(testRoot, './find-sync-test.1'),
            path.join(testRoot, './find-sync-test.2'),
            path.join(testRoot, './find-sync-test.3'),
            '/otherpath/find-sync-test.4')
            .ignore('/otherpath/*')
            .findSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(3);
        for (let x = 0; x < 3; x++) {
            expect(results[x]).toMatch(new RegExp(`^/.+find-sync-test.${x + 1}$`, 'i'));
        }
    });
    it('includes file paths and found with globs but ignores those matching ignore globs.', () => {
        let results = Files.including(
            path.join(testRoot, './find-sync-test.fake'),
            path.join(testRoot, './find-sync-test.4'),
            '/otherpath/find-sync-test.4')
            .glob(path.join(testRoot, './find-sync-test.[1-2]'))
            .ignore('/otherpath/*', '**/*.fake')
            .findSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(3);
        for (let x = 0; x < 3; x++) {
            expect(results[x]).toMatch(/^\/.+find-sync-test.[1-4]$/);
        }
    });
});

describe('#stat', () => {
    beforeAll(() => {
        for (let x = 1; x <= 4; x++) {
            fs.writeFileSync(path.join(testRoot, `./stat-test.${x}`), '');
        }
    });
    afterAll(async () => {
        for (let x = 1; x <= 4; x++) {
            await fs.promises.unlink(path.join(testRoot, `./stat-test.${x}`)).catch(() => { });
        }
    });
    it('returns the stats for all files.', async () => {
        let results = await Files.including(
            path.join(testRoot, './stat-test.1'),
            path.join(testRoot, './stat-test.2'),
            path.join(testRoot, './stat-test.3'),
            path.join(testRoot, './stat-test.4')).stat();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 4; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`stat-test.${x + 1}$`, 'i'));
            expect(results[x].stat).toBeInstanceOf(fs.Stats);
        }
    });
    it('throws on missing file.', async () => {
        expect.assertions(1);
        try {
            await Files.including(
                path.join(testRoot, './stat-test.1'),
                path.join(testRoot, './stat-test.doesnotexist'),
                path.join(testRoot, './stat-test.3'),
                path.join(testRoot, './stat-test.4')).stat();
        } catch (err) {
            expect(err.stack).toBeTruthy();
        }
    });
    it('yields a null on missing file when "nullify" is enabled.', async () => {
        let results = await Files.including(
            path.join(testRoot, './stat-test.1'),
            path.join(testRoot, './stat-test.doesnotexist'),
            path.join(testRoot, './stat-test.3'),
            path.join(testRoot, './stat-test.4'))
            .nullify()
            .stat();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 4; x++) {
            if (x === 1) {
                expect(results[x].stat).toBeNull();
            } else {
                expect(results[x].filePath).toMatch(new RegExp(`stat-test.${x + 1}$`, 'i'));
                expect(results[x].stat).toBeInstanceOf(fs.Stats);
            }
        }
    });
});

describe('#normalize', () => {
    it('returns the normalized path for all files.', async () => {
        let results = await Files.including(
            path.join(testRoot, './normalize-test.1'),
            path.join(testRoot, './normalize-test.2'),
            path.join(testRoot, './normalize-test.3'),
            path.join(testRoot, './normalize-test.4')).normalize();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(4);
        for (let x = 0; x < 4; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`normalize-test.${x + 1}$`, 'i'));
            expect(results[x].normalized).toBe(path.normalize(path.join(testRoot, `normalize-test.${x + 1}`)));
        }
    });
});

describe('#unlink', () => {
    beforeAll(() => {
        for (let x = 1; x <= 10; x++) {
            fs.writeFileSync(path.join(testRoot, `./unlink-test.${x}`), '');
        }
    });
    afterAll(async () => {
        for (let x = 1; x <= 10; x++) {
            await fs.promises.unlink(path.join(testRoot, `./unlink-test.${x}`)).catch(() => { });
        }
    });
    it('unlinks specified files.', async () => {
        let results = await Files.including(
            path.join(testRoot, './unlink-test.1'),
            path.join(testRoot, './unlink-test.2'))
            .unlink();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`unlink-test.${x + 1}$`, 'i'));
            expect(results[x].unlinked).toBe(true);
        }
    });
    it('unlinks files using globs.', async () => {
        let results = await Files
            .glob(path.join(testRoot, './unlink-test.[3-5]'))
            .ignore('**/*.4')
            .unlink();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        expect(results[0].filePath).toMatch(/unlink-test.3$/i);
        expect(results[0].unlinked).toBe(true);
        expect(results[1].filePath).toMatch(/unlink-test.5$/i);
        expect(results[1].unlinked).toBe(true);
    });
    it('returns unlinked false on missing file when "nullify" is enabled.', async () => {
        let results = await Files
            .including(
                path.join(testRoot, './unlink-test.4'),
                path.join(testRoot, './unlink-test.doesntexist'))
            .glob(path.join(testRoot, './unlink-test.[6-8]'))
            .nullify()
            .unlink();
        expect(results[0].filePath).toMatch(/unlink-test.4$/i);
        expect(results[0].unlinked).toBe(true);
        expect(results[1].filePath).toMatch(/unlink-test.doesntexist$/i);
        expect(results[1].unlinked).toBe(false);
        for (let x = 2; x < 4; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`unlink-test.${x + 4}$`, 'i'));
            expect(results[x].unlinked).toBe(true);
        }
    });
});

describe('#write', () => {
    beforeAll(() => {
        for (let x = 1; x <= 2; x++) {
            fs.writeFileSync(path.join(testRoot, `./write-test.${x}`), '');
        }
    });
    afterAll(async () => {
        for (let x = 1; x <= 10; x++) {
            await fs.promises.unlink(path.join(testRoot, `./write-test.${x}`)).catch(() => { });
        }
        for (let x = 1; x <= 10; x++) {
            await fs.promises.unlink(path.join(testRoot, `./write-test.${x}.toml`)).catch(() => { });
            await fs.promises.unlink(path.join(testRoot, `./write-test.${x}.json`)).catch(() => { });
        }
    });
    it('overwrites existing files.', async () => {
        let results = await Files.including(
            path.join(testRoot, './write-test.1'),
            path.join(testRoot, './write-test.2'))
            .write('test');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`write-test.${x + 1}$`, 'i'));
            expect(results[x].written).toBe(true);
            expect(fs.statSync(results[x].filePath).size).toBe(4);
        }
    });
    it('writes to specified files that do not exist.', async () => {
        let results = await Files.including(
            path.join(testRoot, './write-test.3'),
            path.join(testRoot, './write-test.4'))
            .write('test');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`write-test.${x + 3}$`, 'i'));
            expect(results[x].written).toBe(true);
            expect(fs.statSync(results[x].filePath).size).toBe(4);
        }
    });
    it('writes stringified object, defaulting to JSON, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './write-test.5'))
            .stringify()
            .write({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/write-test.5$/);
        expect(results[0].written).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('{\n    "abc": 123,\n    "ok": true\n}');
    });
    it('writes stringified object, explicitly to JSON, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './write-test.6.toml'))
            .stringify('json')
            .write({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/write-test.6.toml$/);
        expect(results[0].written).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('{\n    "abc": 123,\n    "ok": true\n}');
    });
    it('writes stringified object, explicitly to TOML, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './write-test.7.json'))
            .stringify('toml')
            .write({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/write-test.7.json$/);
        expect(results[0].written).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('abc = 123\nok = true\n');
    });
    it('writes stringified object, explicitly to YAML, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './write-test.8.json'))
            .stringify('yaml')
            .write({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/write-test.8.json$/);
        expect(results[0].written).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('abc: 123\nok: true\n');
    });
    it('writes stringified object, based on file extension, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './write-test.2.json'))
            .including(path.join(testRoot, './write-test.2.toml'))
            .stringify()
            .write({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        expect(results[0].filePath).toMatch(/write-test.2.json$/);
        expect(results[0].written).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('{\n    "abc": 123,\n    "ok": true\n}');
        expect(results[1].filePath).toMatch(/write-test.2.toml$/);
        expect(results[1].written).toBe(true);
        expect(fs.readFileSync(results[1].filePath).toString()).toBe('abc = 123\nok = true\n');
    });
});

describe('#append', () => {
    beforeAll(() => {
        for (let x = 1; x <= 2; x++) {
            fs.writeFileSync(path.join(testRoot, `./append-test.${x}`), '123');
        }
    });
    afterAll(async () => {
        for (let x = 1; x <= 10; x++) {
            await fs.promises.unlink(path.join(testRoot, `./append-test.${x}`)).catch(() => { });
        }
        for (let x = 1; x <= 10; x++) {
            await fs.promises.unlink(path.join(testRoot, `./append-test.${x}.toml`)).catch(() => { });
            await fs.promises.unlink(path.join(testRoot, `./append-test.${x}.json`)).catch(() => { });
        }
    });
    it('appends existing files.', async () => {
        let results = await Files.including(
            path.join(testRoot, './append-test.1'),
            path.join(testRoot, './append-test.2'))
            .append('test');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`append-test.${x + 1}$`, 'i'));
            expect(results[x].appended).toBe(true);
            expect(fs.statSync(results[x].filePath).size).toBe(7);
        }
    });
    it('writes to specified files that do not exist.', async () => {
        let results = await Files.including(
            path.join(testRoot, './append-test.3'),
            path.join(testRoot, './append-test.4'))
            .append('test');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`append-test.${x + 3}$`, 'i'));
            expect(results[x].appended).toBe(true);
            expect(fs.statSync(results[x].filePath).size).toBe(4);
        }
    });
    it('appends stringified object, defaulting to JSON, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './append-test.5'))
            .stringify()
            .append({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/append-test.5$/);
        expect(results[0].appended).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('{\n    "abc": 123,\n    "ok": true\n}');
    });
    it('appends stringified object, explicitly to JSON, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './append-test.6.toml'))
            .stringify('json')
            .append({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/append-test.6.toml$/);
        expect(results[0].appended).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('{\n    "abc": 123,\n    "ok": true\n}');
    });
    it('appends stringified object, explicitly to TOML, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './append-test.7.json'))
            .stringify('toml')
            .append({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/append-test.7.json$/);
        expect(results[0].appended).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('abc = 123\nok = true\n');
    });
    it('appends stringified object, explicitly to YAML, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './append-test.8.json'))
            .stringify('yaml')
            .append({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/append-test.8.json$/);
        expect(results[0].appended).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('abc: 123\nok: true\n');
    });
    it('appends stringified object, based on file extension, to file.', async () => {
        let results = await Files
            .including(path.join(testRoot, './append-test.2.json'))
            .including(path.join(testRoot, './append-test.2.toml'))
            .stringify()
            .append({ abc: 123, ok: true });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        expect(results[0].filePath).toMatch(/append-test.2.json$/);
        expect(results[0].appended).toBe(true);
        expect(fs.readFileSync(results[0].filePath).toString()).toBe('{\n    "abc": 123,\n    "ok": true\n}');
        expect(results[1].filePath).toMatch(/append-test.2.toml$/);
        expect(results[1].appended).toBe(true);
        expect(fs.readFileSync(results[1].filePath).toString()).toBe('abc = 123\nok = true\n');
    });
});

describe('#read', () => {
    beforeAll(() => {
        for (let x = 1; x <= 2; x++) {
            fs.writeFileSync(path.join(testRoot, `./read-test.${x}`), '123');
        }
        for (let x = 3; x <= 4; x++) {
            fs.writeFileSync(path.join(testRoot, `./read-test.${x}.json`), JSON.stringify({ abc: 123, ok: true }));
        }
        for (let x = 5; x <= 6; x++) {
            fs.writeFileSync(path.join(testRoot, `./read-test.${x}.toml`), 'abc = 123\nok = true');
        }
        //create mis-matched files json<->toml
        fs.writeFileSync(path.join(testRoot, './read-test.7.json'), 'abc = 123\nok = true');
        fs.writeFileSync(path.join(testRoot, './read-test.8.toml'), JSON.stringify({ abc: 123, ok: true }));
        fs.writeFileSync(path.join(testRoot, './read-test.9.json'), 'abc: 123\nok: true');
    });
    afterAll(async () => {
        for (let x = 1; x <= 2; x++) {
            await fs.promises.unlink(path.join(testRoot, `./read-test.${x}`)).catch(() => { });
        }
        for (let x = 3; x <= 4; x++) {
            await fs.promises.unlink(path.join(testRoot, `./read-test.${x}.json`)).catch(() => { });
        }
        for (let x = 5; x <= 6; x++) {
            await fs.promises.unlink(path.join(testRoot, `./read-test.${x}.toml`)).catch(() => { });
        }
        await fs.promises.unlink(path.join(testRoot, './read-test.7.json')).catch(() => { });
        await fs.promises.unlink(path.join(testRoot, './read-test.8.toml')).catch(() => { });
        await fs.promises.unlink(path.join(testRoot, './read-test.9.json')).catch(() => { });
    });
    it('reads plain files to buffer.', async () => {
        let results = await Files
            .glob(path.join(testRoot, './read-test.[1-2]'))
            .read();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-test.${x + 1}$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(true);
            expect(results[x].data.toString()).toBe('123');
        }
    });
    it('reads json and toml files as text without parse specified.', async () => {
        let results = await Files
            .including(
                path.join(testRoot, './read-test.4.json'),
                path.join(testRoot, './read-test.5.toml')
            )
            .read();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-test.${x + 4}.(?:json|toml)$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(true);
        }
    });
    it('reads json and toml files into parsed objects when parse is enabled.', async () => {
        let results = await Files
            .including(
                path.join(testRoot, './read-test.4.json'),
                path.join(testRoot, './read-test.5.toml')
            )
            .parse()
            .read();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-test.${x + 4}.(?:json|toml)$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(false);
            expect(results[x].data).toEqual({ abc: 123, ok: true });
        }
    });
    it('reads contents into a parsed object when parse is explicitly json.', async () => {
        let results = await Files
            .including(path.join(testRoot, './read-test.8.toml'))
            .parse('json')
            .read();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/read-test.8.toml$/);
        expect(results[0].read).toBe(true);
        expect(Buffer.isBuffer(results[0].data)).toBe(false);
        expect(results[0].data).toEqual({ abc: 123, ok: true });
    });
    it('reads contents into a parsed object when parse is explicitly toml.', async () => {
        let results = await Files
            .including(path.join(testRoot, './read-test.7.json'))
            .parse('toml')
            .read();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/read-test.7.json$/);
        expect(results[0].read).toBe(true);
        expect(Buffer.isBuffer(results[0].data)).toBe(false);
        expect(results[0].data).toEqual({ abc: 123, ok: true });
    });
    it('reads contents into a parsed object when parse is explicitly yaml.', async () => {
        let results = await Files
            .including(path.join(testRoot, './read-test.9.json'))
            .parse('yaml')
            .read();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/read-test.9.json$/);
        expect(results[0].read).toBe(true);
        expect(Buffer.isBuffer(results[0].data)).toBe(false);
        expect(results[0].data).toEqual({ abc: 123, ok: true });
    });
    it('reads multiple files without throwing when nullify is enabled.', async () => {
        let results = await Files
            .including(path.join(testRoot, './read-test.doesntexist'))
            .glob(path.join(testRoot, './read-test.[1-2]'))
            .nullify()
            .read();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(3);
        expect(results[0].filePath).toMatch(/read-test\..+$/);
        expect(results[0].read).toBe(false);
        expect(results[0].data).toBeNull();
        for (let x = 1; x < 3; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-test.${x}$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(true);
        }
    });
});

describe('#readSync', () => {
    beforeAll(() => {
        for (let x = 1; x <= 2; x++) {
            fs.writeFileSync(path.join(testRoot, `./read-sync-test.${x}`), '123');
        }
        for (let x = 3; x <= 4; x++) {
            fs.writeFileSync(path.join(testRoot, `./read-sync-test.${x}.json`), JSON.stringify({ abc: 123, ok: true }));
        }
        for (let x = 5; x <= 6; x++) {
            fs.writeFileSync(path.join(testRoot, `./read-sync-test.${x}.toml`), 'abc = 123\nok = true');
        }
        //create mis-matched files json<->toml
        fs.writeFileSync(path.join(testRoot, './read-sync-test.7.json'), 'abc = 123\nok = true');
        fs.writeFileSync(path.join(testRoot, './read-sync-test.8.toml'), JSON.stringify({ abc: 123, ok: true }));
    });
    afterAll(async () => {
        for (let x = 1; x <= 2; x++) {
            await fs.promises.unlink(path.join(testRoot, `./read-sync-test.${x}`)).catch(() => { });
        }
        for (let x = 3; x <= 4; x++) {
            await fs.promises.unlink(path.join(testRoot, `./read-sync-test.${x}.json`)).catch(() => { });
        }
        for (let x = 5; x <= 6; x++) {
            await fs.promises.unlink(path.join(testRoot, `./read-sync-test.${x}.toml`)).catch(() => { });
        }
        await fs.promises.unlink(path.join(testRoot, './read-sync-test.7.json')).catch(() => { });
        await fs.promises.unlink(path.join(testRoot, './read-sync-test.8.toml')).catch(() => { });
    });
    it('reads plain files to buffer.', () => {
        let results = Files
            .glob(path.join(testRoot, './read-sync-test.[1-2]'))
            .readSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-sync-test.${x + 1}$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(true);
            expect(results[x].data.toString()).toBe('123');
        }
    });
    it('reads json and toml files as text without parse specified.', async () => {
        let results = Files
            .including(
                path.join(testRoot, './read-sync-test.4.json'),
                path.join(testRoot, './read-sync-test.5.toml')
            )
            .readSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-sync-test.${x + 4}.(?:json|toml)$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(true);
        }
    });
    it('reads json and toml files into parsed objects when parse is enabled.', async () => {
        let results = Files
            .including(
                path.join(testRoot, './read-sync-test.4.json'),
                path.join(testRoot, './read-sync-test.5.toml')
            )
            .parse()
            .readSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);
        for (let x = 0; x < 2; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-sync-test.${x + 4}.(?:json|toml)$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(false);
            expect(results[x].data).toEqual({ abc: 123, ok: true });
        }
    });
    it('reads contents into a parsed object when parse is explicitly json.', async () => {
        let results = Files
            .including(path.join(testRoot, './read-sync-test.8.toml'))
            .parse('json')
            .readSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/read-sync-test.8.toml$/);
        expect(results[0].read).toBe(true);
        expect(Buffer.isBuffer(results[0].data)).toBe(false);
        expect(results[0].data).toEqual({ abc: 123, ok: true });
    });
    it('reads contents into a parsed object when parse is explicitly toml.', async () => {
        let results = Files
            .including(path.join(testRoot, './read-sync-test.7.json'))
            .parse('toml')
            .readSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(1);
        expect(results[0].filePath).toMatch(/read-sync-test.7.json$/);
        expect(results[0].read).toBe(true);
        expect(Buffer.isBuffer(results[0].data)).toBe(false);
        expect(results[0].data).toEqual({ abc: 123, ok: true });
    });
    it('reads multiple files without throwing when nullify is enabled.', async () => {
        let results = Files
            .including(path.join(testRoot, './read-sync-test.doesntexist'))
            .glob(path.join(testRoot, './read-sync-test.[1-2]'))
            .nullify()
            .readSync();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(3);
        expect(results[0].filePath).toMatch(/read-sync-test\..+$/);
        expect(results[0].read).toBe(false);
        expect(results[0].data).toBeNull();
        for (let x = 1; x < 3; x++) {
            expect(results[x].filePath).toMatch(new RegExp(`read-sync-test.${x}$`, 'i'));
            expect(results[x].read).toBe(true);
            expect(Buffer.isBuffer(results[x].data)).toBe(true);
        }
    });
});