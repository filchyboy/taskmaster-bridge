export interface JiraClientOptions {
    baseUrl: string;
    email: string;
    token: string;
    concurrency?: number;
}
export declare class JiraClient {
    private opts;
    private api;
    constructor(opts: JiraClientOptions);
    /** Get the total number of non‑subtask issues in the project */
    countIssues(projectKey: string): Promise<number>;
    /** Fetch a single page of issues. */
    fetchIssues(projectKey: string, startAt?: number, maxResults?: number): Promise<any>;
    /** Create or update an issue. */
    upsertIssue(issue: Record<string, unknown>): Promise<void>;
}
