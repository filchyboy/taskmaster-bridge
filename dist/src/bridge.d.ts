import { JiraClientOptions } from './jiraClient.js';
import { TaskmasterTask } from './taskmaster.js';
import { BridgeConfig } from '../config/defaultConfig.js';
interface LegacyBridgeConfig {
    projectKey: string;
    batchSize: number;
    jira: JiraClientOptions;
}
/** Export Taskmaster JSON to Jira */
export declare function exportToJira(file: string, cfg: BridgeConfig | LegacyBridgeConfig): Promise<void>;
/** Import Jira issues into Taskmaster JSON */
export declare function importFromJira(out: string, cfg: BridgeConfig | LegacyBridgeConfig): Promise<void>;
/** Diff: not yet implemented */
export declare function diffProjects(cfg: BridgeConfig | LegacyBridgeConfig): Promise<void>;
export declare function mapTaskmasterToJira(task: TaskmasterTask, projectKey: string): {
    fields: {
        project: {
            key: string;
        };
        summary: string;
        description: string;
        issuetype: {
            name: string;
        };
        labels: string[];
    };
};
export declare function mapJiraToTaskmaster(issue: any): TaskmasterTask;
export {};
