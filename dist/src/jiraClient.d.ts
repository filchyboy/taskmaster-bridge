export interface JiraClientOptions {
    baseUrl: string;
    email: string;
    token: string;
    concurrency?: number;
    verbose?: boolean;
}
export declare class JiraClient {
    private opts;
    private api;
    private subtaskType;
    constructor(opts: JiraClientOptions);
    /**
     * Get available issue types for a project
     */
    getIssueTypes(projectKey: string): Promise<any[]>;
    /**
     * Find the subtask issue type for a project
     */
    findSubtaskType(projectKey: string): Promise<string>;
    /** Get the total number of issues in the project */
    countIssues(projectKey: string, includeSubtasks?: boolean): Promise<number>;
    /** Fetch a single page of issues. */
    fetchIssues(projectKey: string, startAt?: number, maxResults?: number, includeSubtasks?: boolean): Promise<any>;
    /** Fetch all subtasks for a parent issue */
    fetchSubtasks(parentKey: string): Promise<any>;
    /** Create or update an issue. */
    upsertIssue(issue: Record<string, any>): Promise<{
        updated: boolean;
        key: any;
        created?: undefined;
    } | {
        created: boolean;
        key: any;
        updated?: undefined;
    }>;
}
