export function readTaskmasterFile(path) {
    // TODO: read & validate schema
    return JSON.parse(require('fs').readFileSync(path, 'utf8'));
}
export function writeTaskmasterFile(path, data) {
    require('fs').writeFileSync(path, JSON.stringify(data, null, 2));
}
