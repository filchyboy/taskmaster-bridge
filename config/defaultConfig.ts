import { JiraClientOptions } from '../src/jiraClient.js';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

// Service-specific configuration interfaces
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

// Union type for all supported services
export type ServiceConfig = JiraServiceConfig | LinearServiceConfig;

// Main configuration interface
export interface BridgeConfig {
  service: ServiceConfig;
  batchSize: number;
  defaultProjectKey?: string; // For backward compatibility
}

// Default Jira configuration
const DEFAULT_JIRA_CONFIG: JiraServiceConfig = {
  type: 'jira',
  projectKey: process.env.JIRA_PROJECT_KEY ?? 'TEST',
  baseUrl: process.env.JIRA_BASE_URL ?? 'https://your-site.atlassian.net',
  email: process.env.JIRA_EMAIL ?? '',
  token: process.env.JIRA_TOKEN ?? ''
};

// Default Linear configuration (for future use)
const DEFAULT_LINEAR_CONFIG: LinearServiceConfig = {
  type: 'linear',
  teamKey: process.env.LINEAR_TEAM_KEY ?? '',
  apiKey: process.env.LINEAR_API_KEY ?? ''
};

// Default configuration
const DEFAULTS: BridgeConfig = {
  service: DEFAULT_JIRA_CONFIG,
  batchSize: 100,
  defaultProjectKey: process.env.DEFAULT_PROJECT_KEY
};

/**
 * Load configuration from .taskmasterbridgerc file or environment variables
 */
export function loadConfig(): BridgeConfig {
  const rcPath = path.resolve('.taskmasterbridgerc');
  if (fs.existsSync(rcPath)) {
    const raw = fs.readFileSync(rcPath, 'utf8');
    const parsed = yaml.parse(raw);

    // Handle legacy configuration format
    if (parsed.jira && !parsed.service) {
      console.log('⚠️ Using legacy configuration format. Consider running `taskmaster-bridge setup` to update.');
      return {
        service: {
          type: 'jira',
          projectKey: parsed.projectKey || DEFAULT_JIRA_CONFIG.projectKey,
          baseUrl: parsed.jira.baseUrl || DEFAULT_JIRA_CONFIG.baseUrl,
          email: parsed.jira.email || DEFAULT_JIRA_CONFIG.email,
          token: parsed.jira.token || DEFAULT_JIRA_CONFIG.token
        },
        batchSize: parsed.batchSize || DEFAULTS.batchSize,
        defaultProjectKey: parsed.projectKey
      };
    }

    return { ...DEFAULTS, ...parsed } as BridgeConfig;
  }

  return DEFAULTS;
}

/**
 * Get Jira client options from the configuration
 */
export function getJiraOptions(config: BridgeConfig): JiraClientOptions {
  if (config.service.type !== 'jira') {
    throw new Error(`Service type '${config.service.type}' is not supported for this operation. Use 'jira' instead.`);
  }

  const jiraConfig = config.service as JiraServiceConfig;
  return {
    baseUrl: jiraConfig.baseUrl,
    email: jiraConfig.email,
    token: jiraConfig.token
  };
}

/**
 * Get project key from the configuration
 */
export function getProjectKey(config: BridgeConfig, overrideKey?: string): string {
  // Use override key if provided
  if (overrideKey) {
    return overrideKey;
  }

  // Use service-specific project key
  if (config.service.type === 'jira') {
    return (config.service as JiraServiceConfig).projectKey;
  }

  // Fall back to default project key
  if (config.defaultProjectKey) {
    return config.defaultProjectKey;
  }

  throw new Error('No project key specified. Use --project option or configure a default project key.');
}