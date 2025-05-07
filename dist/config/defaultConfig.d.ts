import { JiraClientOptions } from '../src/jiraClient.js';
export interface BridgeConfig {
    projectKey: string;
    batchSize: number;
    jira: JiraClientOptions;
}
export declare function loadConfig(): BridgeConfig;
