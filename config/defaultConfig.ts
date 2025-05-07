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
 * @param {boolean} verbose - Whether to output verbose messages about configuration sources
 * @returns {BridgeConfig} The loaded configuration
 */
export function loadConfig(verbose: boolean = false): BridgeConfig {
  // Check for configuration file
  const rcPath = path.resolve('.taskmasterbridgerc');
  if (fs.existsSync(rcPath)) {
    if (verbose) {
      console.log('📄 Found configuration file: .taskmasterbridgerc');
    }

    const raw = fs.readFileSync(rcPath, 'utf8');
    const parsed = yaml.parse(raw);

    // Handle legacy configuration format
    if (parsed.jira && !parsed.service) {
      if (verbose) {
        console.log('⚠️ Using legacy configuration format. Consider running `taskmaster-bridge setup` to update.');
      }
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

  // Check for environment variables
  const envVarsFound = checkEnvironmentVariables(verbose);

  if (envVarsFound) {
    if (verbose) {
      console.log('🔑 Using credentials from environment variables');
    }
    return DEFAULTS;
  }

  if (verbose) {
    console.log('⚠️ No configuration file or environment variables found');
    console.log('ℹ️ Using default configuration. Run `taskmaster-bridge setup` to configure.');
  }

  return DEFAULTS;
}

/**
 * Check if required environment variables are set
 * @param {boolean} verbose - Whether to output verbose messages
 * @returns {boolean} Whether any environment variables were found
 */
function checkEnvironmentVariables(verbose: boolean = false): boolean {
  // Check for Jira environment variables
  const jiraVars = {
    'JIRA_PROJECT_KEY': process.env.JIRA_PROJECT_KEY,
    'JIRA_BASE_URL': process.env.JIRA_BASE_URL,
    'JIRA_EMAIL': process.env.JIRA_EMAIL,
    'JIRA_TOKEN': process.env.JIRA_TOKEN
  };

  // Check for Linear environment variables
  const linearVars = {
    'LINEAR_TEAM_KEY': process.env.LINEAR_TEAM_KEY,
    'LINEAR_API_KEY': process.env.LINEAR_API_KEY
  };

  let jiraVarsFound = false;
  let linearVarsFound = false;

  // Check if any Jira variables are set
  for (const [key, value] of Object.entries(jiraVars)) {
    if (value) {
      jiraVarsFound = true;
      if (verbose) {
        console.log(`✅ Found environment variable: ${key}`);
      }
    } else if (verbose) {
      console.log(`❌ Missing environment variable: ${key}`);
    }
  }

  // Check if any Linear variables are set
  for (const [key, value] of Object.entries(linearVars)) {
    if (value) {
      linearVarsFound = true;
      if (verbose) {
        console.log(`✅ Found environment variable: ${key}`);
      }
    } else if (verbose) {
      console.log(`❌ Missing environment variable: ${key}`);
    }
  }

  return jiraVarsFound || linearVarsFound;
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