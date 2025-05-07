#!/usr/bin/env node
import { Command } from 'commander';
import { exportToJira, importFromJira, diffProjects } from '../src/index.js';
import { loadConfig } from '../config/defaultConfig.js';
const program = new Command();
program
    .name('taskmaster-bridge')
    .description('Sync Taskmaster JSON with Jira')
    .version('0.1.0');
program
    .command('export')
    .argument('<file>', 'Path to Taskmaster JSON file')
    .description('Create or update Jira issues from Taskmaster export')
    .action(async (file) => {
    const cfg = loadConfig();
    await exportToJira(file, cfg);
});
program
    .command('import')
    .option('-o, --out <file>', 'Output filename', 'jira_stories.json')
    .description('Download Jira issues and write Taskmaster‑style JSON')
    .action(async (opts) => {
    const cfg = loadConfig();
    await importFromJira(opts.out, cfg);
});
program
    .command('diff')
    .description('Show differences between Taskmaster JSON and Jira project')
    .action(async () => {
    const cfg = loadConfig();
    await diffProjects(cfg);
});
program.parse();
