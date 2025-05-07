import { BridgeConfig } from '../config/defaultConfig.js';
/** Export Taskmaster JSON to Jira */
export declare function exportToJira(file: string, cfg: BridgeConfig): Promise<void>;
/** Import Jira issues into Taskmaster JSON */
export declare function importFromJira(out: string, cfg: BridgeConfig): Promise<void>;
/** Diff: not yet implemented */
export declare function diffProjects(cfg: BridgeConfig): Promise<void>;
