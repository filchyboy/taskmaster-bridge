import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import readline from 'readline';
import { BridgeConfig } from '../config/defaultConfig.js';

/**
 * Interactive onboarding to set up Taskmaster Bridge configuration
 */
export async function runOnboarding(): Promise<void> {
  console.log('🚀 Welcome to Taskmaster Bridge Onboarding!');
  console.log('Let\'s set up your Jira connection details.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const config: BridgeConfig = {
    projectKey: '',
    batchSize: 100,
    jira: {
      baseUrl: '',
      email: '',
      token: ''
    }
  };

  // Prompt for Jira URL
  config.jira.baseUrl = await prompt(
    rl,
    'Enter your Jira URL (e.g., https://your-company.atlassian.net):',
    'https://your-company.atlassian.net'
  );

  // Prompt for Project Key
  config.projectKey = await prompt(
    rl,
    'Enter your Jira project key (e.g., TEST):',
    'TEST'
  );

  // Prompt for Jira email
  config.jira.email = await prompt(
    rl,
    'Enter your Jira email address:',
    ''
  );

  // Prompt for Jira API token
  config.jira.token = await prompt(
    rl,
    'Enter your Jira API token (create one at https://id.atlassian.com/manage-profile/security/api-tokens):',
    '',
    true
  );

  rl.close();

  // Save configuration
  const configPath = path.resolve('.taskmasterbridgerc');
  fs.writeFileSync(configPath, yaml.stringify(config));

  console.log(`\n✅ Configuration saved to ${configPath}`);
  console.log('You can now use Taskmaster Bridge with your Jira project!');
  console.log(`Try running: taskmaster-bridge export tasks/test-tasks.json --project ${config.projectKey}`);
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
