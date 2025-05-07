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

  // Create Jira service config
  const jiraConfig: JiraServiceConfig = {
    type: 'jira',
    projectKey: '',
    baseUrl: '',
    email: '',
    token: ''
  };

  // Prompt for Jira URL
  jiraConfig.baseUrl = await prompt(
    rl,
    'Enter your Jira URL (e.g., https://your-company.atlassian.net):',
    'https://your-company.atlassian.net'
  );

  // Prompt for Project Key
  jiraConfig.projectKey = await prompt(
    rl,
    'Enter your Jira project key (e.g., TEST):',
    'TEST'
  );

  // Prompt for Jira email
  jiraConfig.email = await prompt(
    rl,
    'Enter your Jira email address:',
    ''
  );

  // Prompt for Jira API token
  jiraConfig.token = await prompt(
    rl,
    'Enter your Jira API token (create one at https://id.atlassian.com/manage-profile/security/api-tokens):',
    '',
    true
  );

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

  // Create Linear service config
  const linearConfig: LinearServiceConfig = {
    type: 'linear',
    teamKey: '',
    apiKey: ''
  };

  // Prompt for Linear team key
  linearConfig.teamKey = await prompt(
    rl,
    'Enter your Linear team key:',
    ''
  );

  // Prompt for Linear API key
  linearConfig.apiKey = await prompt(
    rl,
    'Enter your Linear API key (create one at https://linear.app/settings/api):',
    '',
    true
  );

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
