import { JiraClientOptions } from '../src/jiraClient.js';
export interface JiraServiceConfig {
    type: 'jira';
    projectKey: string;
    baseUrl: string;
    email: string;
    token: string;
}
export interface LinearServiceConfig {
    type: 'linear';
    teamKey: string;
    apiKey: string;
}
export type ServiceConfig = JiraServiceConfig | LinearServiceConfig;
export interface BridgeConfig {
    service: ServiceConfig;
    batchSize: number;
    defaultProjectKey?: string;
}
/**
 * Load configuration from .taskmasterbridgerc file or environment variables
 * @param {boolean} verbose - Whether to output verbose messages about configuration sources
 * @returns {BridgeConfig} The loaded configuration
 */
export declare function loadConfig(verbose?: boolean): BridgeConfig;
/**
 * Get Jira client options from the configuration
 */
export declare function getJiraOptions(config: BridgeConfig): JiraClientOptions;
/**
 * Get project key from the configuration
 */
export declare function getProjectKey(config: BridgeConfig, overrideKey?: string): string;
