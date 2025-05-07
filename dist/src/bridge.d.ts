import { TaskmasterTask } from './taskmaster.js';
import { BridgeConfig } from '../config/defaultConfig.js';
/** Export Taskmaster JSON to Jira */
export declare function exportToJira(file: string, cfg: BridgeConfig): Promise<void>;
/** Import Jira issues into Taskmaster JSON */
export declare function importFromJira(out: string, cfg: BridgeConfig): Promise<void>;
/** Diff: not yet implemented */
export declare function diffProjects(cfg: BridgeConfig): Promise<void>;
export declare function mapTaskmasterToJira(task: TaskmasterTask, cfg: BridgeConfig): {
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
