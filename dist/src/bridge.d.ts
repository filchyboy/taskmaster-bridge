import { JiraClientOptions } from './jiraClient.js';
import { TaskmasterTask } from './taskmaster.js';
import { BridgeConfig } from '../config/defaultConfig.js';
interface LegacyBridgeConfig {
    projectKey: string;
    batchSize: number;
    jira: JiraClientOptions;
}
/** Export Taskmaster JSON to Jira */
export declare function exportToJira(file: string, cfg: BridgeConfig | LegacyBridgeConfig, verbose?: boolean): Promise<void>;
/** Import options for report generation */
interface ImportOptions {
    generateReport?: boolean;
    reportDir?: string;
}
/** Import Jira issues into Taskmaster JSON */
export declare function importFromJira(out: string, cfg: BridgeConfig | LegacyBridgeConfig, verbose?: boolean, options?: ImportOptions): Promise<void>;
/** Diff: not yet implemented */
export declare function diffProjects(cfg: BridgeConfig | LegacyBridgeConfig): Promise<void>;
/**
 * Map a Taskmaster task to a Jira issue
 */
export declare function mapTaskmasterToJira(task: TaskmasterTask, projectKey: string): {
    fields: {
        project: {
            key: string;
        };
        summary: string;
        description: {
            type: string;
            version: number;
            content: {
                type: string;
                content: {
                    type: string;
                    text: string;
                }[];
            }[];
        } | null;
        issuetype: {
            name: string;
        };
        labels: string[];
    };
};
/**
 * Map a Taskmaster subtask to a Jira subtask
 */
export declare function mapSubtaskToJira(subtask: TaskmasterTask, projectKey: string, parentKey: string, subtaskTypeId: string): {
    fields: {
        project: {
            key: string;
        };
        summary: string;
        description: {
            type: string;
            version: number;
            content: {
                type: string;
                content: {
                    type: string;
                    text: string;
                }[];
            }[];
        } | null;
        issuetype: {
            id: string;
        };
        parent: {
            key: string;
        };
        labels: string[];
    };
};
/**
 * Map a Jira issue to a Taskmaster task
 */
export declare function mapJiraToTaskmaster(issue: any, isSubtask?: boolean): TaskmasterTask;
export {};
