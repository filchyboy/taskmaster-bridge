import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import readline from 'readline';
import { BridgeConfig, JiraServiceConfig, LinearServiceConfig } from '../config/defaultConfig.js';

/**
 * Interactive onboarding to set up Taskmaster Bridge configuration
 */
export async function runOnboarding(): Promise<void> {
  console.log('🚀 Welcome to Taskmaster Bridge Onboarding!');
  console.log('Let\'s set up your issue tracking service connection.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Choose service type
  const serviceType = await promptChoice(
    rl,
    'Which issue tracking service would you like to use?',
    ['jira', 'linear'],
    'jira'
  );

  let config: BridgeConfig;

  if (serviceType === 'jira') {
    config = await setupJiraConfig(rl);
  } else if (serviceType === 'linear') {
    config = await setupLinearConfig(rl);
  } else {
    throw new Error(`Unsupported service type: ${serviceType}`);
  }

  rl.close();

  // Save configuration
  const configPath = path.resolve('.taskmasterbridgerc');
  fs.writeFileSync(configPath, yaml.stringify(config));

  console.log(`\n✅ Configuration saved to ${configPath}`);
  console.log('You can now use Taskmaster Bridge with your issue tracking service!');

  if (serviceType === 'jira') {
    const jiraConfig = config.service as JiraServiceConfig;
    console.log(`Try running: taskmaster-bridge export tasks/test-tasks.json --project ${jiraConfig.projectKey}`);
  } else {
    console.log(`Try running: taskmaster-bridge export tasks/test-tasks.json`);
  }
}

/**
 * Set up Jira configuration
 */
async function setupJiraConfig(rl: readline.Interface): Promise<BridgeConfig> {
  console.log('\n📋 Setting up Jira configuration...');

  // Check for environment variables first
  const envVars = {
    projectKey: process.env.JIRA_PROJECT_KEY,
    baseUrl: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    token: process.env.JIRA_TOKEN
  };

  // Check if any Jira environment variables are set
  const hasJiraEnvVars = Object.values(envVars).some(value => !!value);

  // Create Jira service config
  const jiraConfig: JiraServiceConfig = {
    type: 'jira',
    projectKey: '',
    baseUrl: '',
    email: '',
    token: ''
  };

  if (hasJiraEnvVars) {
    console.log('✅ Found Jira credentials in your environment variables.');

    // Use environment variables directly for what's available
    if (envVars.baseUrl) {
      jiraConfig.baseUrl = envVars.baseUrl;
      console.log(`Using JIRA_BASE_URL: ${jiraConfig.baseUrl}`);
    }

    if (envVars.email) {
      jiraConfig.email = envVars.email;
      console.log(`Using JIRA_EMAIL: ${jiraConfig.email}`);
    }

    if (envVars.token) {
      jiraConfig.token = envVars.token;
      console.log(`Using JIRA_TOKEN: ********`);
    }

    console.log(''); // Add a blank line for readability
  } else {
    console.log('ℹ️ No Jira credentials found in your environment variables.');

    // Ask user if they want instructions or to enter credentials directly
    const choice = await promptChoice(
      rl,
      'How would you like to proceed?',
      [
        'Enter credentials and store them locally in a YAML file',
        'Show instructions for adding credentials to your environment'
      ],
      'Enter credentials and store them locally in a YAML file'
    );

    if (choice === 'Show instructions for adding credentials to your environment') {
      console.log('\n📝 To add Jira credentials to your environment, add these lines to your shell profile:');
      console.log('```');
      console.log('export JIRA_BASE_URL="https://your-company.atlassian.net"');
      console.log('export JIRA_EMAIL="your-email@example.com"');
      console.log('export JIRA_TOKEN="your-api-token"');
      console.log('```');
      console.log('\nAfter adding these to your profile, restart your terminal or run:');
      console.log('```');
      console.log('source ~/.bash_profile  # or ~/.zshrc, ~/.bashrc, etc.');
      console.log('```');
      console.log('\nLet\'s continue with the setup to create a local configuration file.\n');
    }
  }

  // Prompt for values that aren't set in environment variables
  if (!jiraConfig.baseUrl) {
    // Prompt for company name and construct the full URL
    const company = await prompt(
      rl,
      'Enter your Atlassian company name:',
      'your-company'
    );

    jiraConfig.baseUrl = `https://${company}.atlassian.net`;
  }

  // Always prompt for Project Key since it should be configurable per project
  jiraConfig.projectKey = await prompt(
    rl,
    'Enter your Jira project key (e.g., TEST):',
    'TEST'
  );

  // Prompt for email if not set
  if (!jiraConfig.email) {
    jiraConfig.email = await prompt(
      rl,
      'Enter your Jira email address:',
      ''
    );
  }

  // Prompt for token if not set
  if (!jiraConfig.token) {
    jiraConfig.token = await prompt(
      rl,
      'Enter your Jira API token (create one at https://id.atlassian.com/manage-profile/security/api-tokens):',
      '',
      true
    );
  }

  return {
    service: jiraConfig,
    batchSize: 100,
    defaultProjectKey: jiraConfig.projectKey
  };
}

/**
 * Set up Linear configuration
 */
async function setupLinearConfig(rl: readline.Interface): Promise<BridgeConfig> {
  console.log('\n📋 Setting up Linear configuration...');

  // Check for environment variables first
  const envVars = {
    teamKey: process.env.LINEAR_TEAM_KEY,
    apiKey: process.env.LINEAR_API_KEY
  };

  // Check if any Linear environment variables are set
  const hasLinearEnvVars = Object.values(envVars).some(value => !!value);

  // Create Linear service config
  const linearConfig: LinearServiceConfig = {
    type: 'linear',
    teamKey: '',
    apiKey: ''
  };

  if (hasLinearEnvVars) {
    console.log('✅ Found Linear credentials in your environment variables.');

    // Use environment variables directly for what's available
    if (envVars.teamKey) {
      linearConfig.teamKey = envVars.teamKey;
      console.log(`Using LINEAR_TEAM_KEY: ${linearConfig.teamKey}`);
    }

    if (envVars.apiKey) {
      linearConfig.apiKey = envVars.apiKey;
      console.log(`Using LINEAR_API_KEY: ********`);
    }

    console.log(''); // Add a blank line for readability
  } else {
    console.log('ℹ️ No Linear credentials found in your environment variables.');

    // Ask user if they want instructions or to enter credentials directly
    const choice = await promptChoice(
      rl,
      'How would you like to proceed?',
      [
        'Enter credentials and store them locally in a YAML file',
        'Show instructions for adding credentials to your environment'
      ],
      'Enter credentials and store them locally in a YAML file'
    );

    if (choice === 'Show instructions for adding credentials to your environment') {
      console.log('\n📝 To add Linear credentials to your environment, add these lines to your shell profile:');
      console.log('```');
      console.log('export LINEAR_TEAM_KEY="YOUR_TEAM_KEY"');
      console.log('export LINEAR_API_KEY="your-linear-api-key"');
      console.log('```');
      console.log('\nAfter adding these to your profile, restart your terminal or run:');
      console.log('```');
      console.log('source ~/.bash_profile  # or ~/.zshrc, ~/.bashrc, etc.');
      console.log('```');
      console.log('\nLet\'s continue with the setup to create a local configuration file.\n');
    }
  }

  // Prompt for team key if not set
  if (!linearConfig.teamKey) {
    linearConfig.teamKey = await prompt(
      rl,
      'Enter your Linear team key:',
      ''
    );
  }

  // Prompt for API key if not set
  if (!linearConfig.apiKey) {
    linearConfig.apiKey = await prompt(
      rl,
      'Enter your Linear API key (create one at https://linear.app/settings/api):',
      '',
      true
    );
  }

  return {
    service: linearConfig,
    batchSize: 100
  };
}

/**
 * Prompt the user for input with a default value
 */
async function prompt(
  rl: readline.Interface,
  question: string,
  defaultValue: string,
  isSecret: boolean = false
): Promise<string> {
  return new Promise((resolve) => {
    const displayQuestion = defaultValue
      ? `${question} (default: ${isSecret ? '********' : defaultValue}): `
      : `${question} `;

    rl.question(displayQuestion, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Prompt the user to choose from a list of options
 */
async function promptChoice(
  rl: readline.Interface,
  question: string,
  choices: string[],
  defaultChoice: string
): Promise<string> {
  const choicesDisplay = choices.map((choice, index) => {
    const isDefault = choice === defaultChoice;
    return `${index + 1}. ${choice}${isDefault ? ' (default)' : ''}`;
  }).join('\n');

  const displayQuestion = `${question}\n${choicesDisplay}\nEnter your choice (1-${choices.length}): `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      const trimmedAnswer = answer.trim();

      // If empty, use default
      if (!trimmedAnswer) {
        return resolve(defaultChoice);
      }

      // If number, use as index
      const index = parseInt(trimmedAnswer, 10) - 1;
      if (!isNaN(index) && index >= 0 && index < choices.length) {
        return resolve(choices[index]);
      }

      // If exact match to a choice, use that
      if (choices.includes(trimmedAnswer)) {
        return resolve(trimmedAnswer);
      }

      // Otherwise, use default
      console.log(`Invalid choice. Using default: ${defaultChoice}`);
      return resolve(defaultChoice);
    });
  });
}
