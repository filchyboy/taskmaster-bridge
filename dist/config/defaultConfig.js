import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
// Default Jira configuration
const DEFAULT_JIRA_CONFIG = {
    type: 'jira',
    projectKey: process.env.JIRA_PROJECT_KEY ?? 'TEST',
    baseUrl: process.env.JIRA_BASE_URL ?? 'https://your-site.atlassian.net',
    email: process.env.JIRA_EMAIL ?? '',
    token: process.env.JIRA_TOKEN ?? ''
};
// Default Linear configuration (for future use)
const DEFAULT_LINEAR_CONFIG = {
    type: 'linear',
    teamKey: process.env.LINEAR_TEAM_KEY ?? '',
    apiKey: process.env.LINEAR_API_KEY ?? ''
};
// Default configuration
const DEFAULTS = {
    service: DEFAULT_JIRA_CONFIG,
    batchSize: 100,
    defaultProjectKey: process.env.DEFAULT_PROJECT_KEY
};
/**
 * Load configuration from .taskmasterbridgerc file or environment variables
 * @param {boolean} verbose - Whether to output verbose messages about configuration sources
 * @returns {BridgeConfig} The loaded configuration
 */
export function loadConfig(verbose = false) {
    // Always check for environment variables first
    const envVars = {
        jira: {
            projectKey: process.env.JIRA_PROJECT_KEY,
            baseUrl: process.env.JIRA_BASE_URL,
            email: process.env.JIRA_EMAIL,
            token: process.env.JIRA_TOKEN
        },
        linear: {
            teamKey: process.env.LINEAR_TEAM_KEY,
            apiKey: process.env.LINEAR_API_KEY
        }
    };
    const envVarsFound = checkEnvironmentVariables(verbose);
    // Check for configuration file
    const rcPath = path.resolve('.taskmasterbridgerc');
    let fileConfig = {};
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
            fileConfig = {
                service: {
                    type: 'jira',
                    projectKey: parsed.projectKey,
                    baseUrl: parsed.jira.baseUrl,
                    email: parsed.jira.email,
                    token: parsed.jira.token
                },
                batchSize: parsed.batchSize || DEFAULTS.batchSize,
                defaultProjectKey: parsed.projectKey
            };
        }
        else {
            fileConfig = parsed;
        }
    }
    else if (verbose && !envVarsFound) {
        console.log('⚠️ No configuration file found');
        console.log('ℹ️ Using default configuration. Run `taskmaster-bridge setup` to configure.');
    }
    // Start with defaults
    const config = { ...DEFAULTS };
    // Apply file config
    if (fileConfig.service) {
        config.service = { ...config.service, ...fileConfig.service };
        if (fileConfig.batchSize)
            config.batchSize = fileConfig.batchSize;
        if (fileConfig.defaultProjectKey)
            config.defaultProjectKey = fileConfig.defaultProjectKey;
    }
    // Override with environment variables (highest priority)
    if (config.service.type === 'jira') {
        const jiraConfig = config.service;
        if (envVars.jira.baseUrl) {
            jiraConfig.baseUrl = envVars.jira.baseUrl;
            if (verbose)
                console.log(`🔑 Using JIRA_BASE_URL from environment: ${jiraConfig.baseUrl}`);
        }
        if (envVars.jira.email) {
            jiraConfig.email = envVars.jira.email;
            if (verbose)
                console.log(`🔑 Using JIRA_EMAIL from environment: ${jiraConfig.email}`);
        }
        if (envVars.jira.token) {
            jiraConfig.token = envVars.jira.token;
            if (verbose)
                console.log(`🔑 Using JIRA_TOKEN from environment: ********`);
        }
        if (envVars.jira.projectKey) {
            jiraConfig.projectKey = envVars.jira.projectKey;
            if (verbose)
                console.log(`🔑 Using JIRA_PROJECT_KEY from environment: ${jiraConfig.projectKey}`);
        }
    }
    else if (config.service.type === 'linear') {
        const linearConfig = config.service;
        if (envVars.linear.teamKey) {
            linearConfig.teamKey = envVars.linear.teamKey;
            if (verbose)
                console.log(`🔑 Using LINEAR_TEAM_KEY from environment: ${linearConfig.teamKey}`);
        }
        if (envVars.linear.apiKey) {
            linearConfig.apiKey = envVars.linear.apiKey;
            if (verbose)
                console.log(`🔑 Using LINEAR_API_KEY from environment: ********`);
        }
    }
    return config;
}
/**
 * Check if required environment variables are set
 * @param {boolean} verbose - Whether to output verbose messages
 * @returns {boolean} Whether any environment variables were found
 */
export function checkEnvironmentVariables(verbose = false) {
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
        }
        else if (verbose) {
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
        }
        else if (verbose) {
            console.log(`❌ Missing environment variable: ${key}`);
        }
    }
    return jiraVarsFound || linearVarsFound;
}
/**
 * Get Jira client options from the configuration
 */
export function getJiraOptions(config) {
    if (config.service.type !== 'jira') {
        throw new Error(`Service type '${config.service.type}' is not supported for this operation. Use 'jira' instead.`);
    }
    const jiraConfig = config.service;
    return {
        baseUrl: jiraConfig.baseUrl,
        email: jiraConfig.email,
        token: jiraConfig.token
    };
}
/**
 * Get project key from the configuration
 */
export function getProjectKey(config, overrideKey) {
    // Use override key if provided
    if (overrideKey) {
        return overrideKey;
    }
    // Use service-specific project key
    if (config.service.type === 'jira') {
        return config.service.projectKey;
    }
    // Fall back to default project key
    if (config.defaultProjectKey) {
        return config.defaultProjectKey;
    }
    throw new Error('No project key specified. Use --project option or configure a default project key.');
}
