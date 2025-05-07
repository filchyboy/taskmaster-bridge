import axios from 'axios';
export class JiraClient {
    constructor(opts) {
        this.opts = opts;
        this.api = axios.create({
            baseURL: `${opts.baseUrl}/rest/api/3`,
            auth: { username: opts.email, password: opts.token },
            headers: { Accept: 'application/json' }
        });
    }
    /** Get the total number of non‑subtask issues in the project */
    async countIssues(projectKey) {
        const res = await this.api.post('/search', {
            jql: `project = ${projectKey} AND issuetype NOT IN subTaskIssueTypes()`,
            maxResults: 0
        });
        return res.data.total;
    }
    /** Fetch a single page of issues. */
    async fetchIssues(projectKey, startAt = 0, maxResults = 100) {
        const res = await this.api.post('/search', {
            jql: `project = ${projectKey} AND issuetype NOT IN subTaskIssueTypes() ORDER BY key ASC`,
            fields: ['summary', 'description', 'labels', 'parent', 'issuetype', 'status'],
            startAt,
            maxResults
        });
        return res.data.issues;
    }
    /** Create or update an issue. */
    async upsertIssue(issue) {
        // TODO: check for existing issue by externalId label, then update or create
    }
}
