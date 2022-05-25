import fs from 'fs';
import path from 'path';

/**
 * Attempts to load a node package by name which should be a StashKu engine.
 * @param {String} packageName - The name of the package containing the stashku engine.
 * @returns {Promise.<BaseEngine>}
 */
async function PackageLoader(packageName) {
    //check if the configured engine is the same name as the package in current directory (if any).
    let localPackageFilePath = path.join(process.cwd(), 'package.json');
    try {
        let localPackage = JSON.parse(fs.readFileSync(localPackageFilePath, 'utf8'));
        if (localPackage.name === packageName) {
            if (localPackage.type === 'module') {
                packageName = path.join(process.cwd(), localPackage.main);
            } else {
                packageName = process.cwd();
            }
        }
    } catch (err) {
        throw new Error(`Failed to find package.json in current working directory. Tried "${localPackageFilePath}" but received: ${err?.message}`);
    }
    return import(packageName);
}

export default PackageLoader;