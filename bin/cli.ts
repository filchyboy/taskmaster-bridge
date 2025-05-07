#!/usr/bin/env node
import { Command } from 'commander';
import { exportToJira, importFromJira, diffProjects } from '../src/index.js';
import { loadConfig } from '../config/defaultConfig.js';
import { runOnboarding } from '../src/onboarding.js';
import fs from 'fs';
import path from 'path';

const program = new Command();
program
  .name('taskmaster-bridge')
  .description('Sync Taskmaster JSON with Jira')
  .version('0.1.0')
  .option('-p, --project <key>', 'Jira project key (e.g., TEST)');

program
  .command('setup')
  .description('Interactive setup to configure Jira connection')
  .action(async () => {
    await runOnboarding();
  });

program
  .command('export')
  .argument('<file>', 'Path to Taskmaster JSON file')
  .description('Create or update Jira issues from Taskmaster export')
  .action(async (file) => {
    const globalOpts = program.opts();
    const cfg = loadConfig();

    // Override project key if specified in CLI
    if (globalOpts.project) {
      cfg.projectKey = globalOpts.project;
    }

    // Check if configuration exists
    const configPath = path.resolve('.taskmasterbridgerc');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️ No configuration found. Running setup wizard...');
      await runOnboarding();
      console.log('Setup complete. Now continuing with export...');
    }

    console.log(`Using Jira project key: ${cfg.projectKey}`);
    await exportToJira(file, cfg);
  });

program
  .command('import')
  .option('-o, --out <file>', 'Output filename', 'jira_stories.json')
  .description('Download Jira issues and write Taskmaster‑style JSON')
  .action(async (opts) => {
    const globalOpts = program.opts();
    const cfg = loadConfig();

    // Override project key if specified in CLI
    if (globalOpts.project) {
      cfg.projectKey = globalOpts.project;
    }

    // Check if configuration exists
    const configPath = path.resolve('.taskmasterbridgerc');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️ No configuration found. Running setup wizard...');
      await runOnboarding();
      console.log('Setup complete. Now continuing with import...');
    }

    console.log(`Using Jira project key: ${cfg.projectKey}`);
    await importFromJira(opts.out, cfg);
  });

program
  .command('diff')
  .description('Show differences between Taskmaster JSON and Jira project')
  .action(async () => {
    const globalOpts = program.opts();
    const cfg = loadConfig();

    // Override project key if specified in CLI
    if (globalOpts.project) {
      cfg.projectKey = globalOpts.project;
    }

    // Check if configuration exists
    const configPath = path.resolve('.taskmasterbridgerc');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️ No configuration found. Running setup wizard...');
      await runOnboarding();
      console.log('Setup complete. Now continuing with diff...');
    }

    console.log(`Using Jira project key: ${cfg.projectKey}`);
    await diffProjects(cfg);
  });

program.parse();
