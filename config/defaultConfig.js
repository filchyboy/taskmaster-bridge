import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
const DEFAULTS = {
    projectKey: 'COL',
    batchSize: 100,
    jira: {
        baseUrl: process.env.JIRA_BASE_URL ?? 'https://your-site.atlassian.net',
        email: process.env.JIRA_EMAIL ?? '',
        token: process.env.JIRA_TOKEN ?? ''
    }
};
export function loadConfig() {
    const rcPath = path.resolve('.taskmasterbridgerc');
    if (fs.existsSync(rcPath)) {
        const raw = fs.readFileSync(rcPath, 'utf8');
        const parsed = yaml.parse(raw);
        return { ...DEFAULTS, ...parsed };
    }
    return DEFAULTS;
}
