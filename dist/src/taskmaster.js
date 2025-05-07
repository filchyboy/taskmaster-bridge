import fs from 'fs';
export function readTaskmasterFile(path) {
    // TODO: read & validate schema
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}
export function writeTaskmasterFile(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
