#!/usr/bin/env node
import { Command } from 'commander';
import { exportToJira, importFromJira, diffProjects } from '../src/index.js';
import { loadConfig, getProjectKey, getJiraOptions } from '../config/defaultConfig.js';
import { runOnboarding } from '../src/onboarding.js';
import fs from 'fs';
import path from 'path';
const program = new Command();
program
    .name('taskmaster-bridge')
    .description('Sync Taskmaster with issue tracking systems')
    .version('0.1.0')
    .option('-p, --project <key>', 'Project key (e.g., TEST for Jira)')
    .option('-s, --service <type>', 'Service type (jira, linear)', 'jira')
    .option('-v, --verbose', 'Show verbose output', false);
program
    .command('setup')
    .description('Interactive setup to configure issue tracking service')
    .action(async () => {
    await runOnboarding();
});
program
    .command('export')
    .argument('<file>', 'Path to Taskmaster JSON file')
    .description('Create or update issues from Taskmaster export')
    .action(async (file) => {
    const globalOpts = program.opts();
    const verbose = globalOpts.verbose;
    if (verbose) {
        console.log('🔍 Checking for configuration...');
    }
    // Check if configuration exists
    const configPath = path.resolve('.taskmasterbridgerc');
    if (!fs.existsSync(configPath)) {
        console.log('⚠️ No configuration file found. Running setup wizard...');
        await runOnboarding();
        console.log('Setup complete. Now continuing with export...');
    }
    const cfg = loadConfig(verbose);
    // Ensure we're using the right service type
    if (globalOpts.service && cfg.service.type !== globalOpts.service) {
        console.log(`⚠️ Configuration is for ${cfg.service.type} but --service=${globalOpts.service} was specified.`);
        console.log(`Using ${cfg.service.type} configuration.`);
    }
    // Only support Jira for now
    if (cfg.service.type !== 'jira') {
        console.log(`⚠️ Export is currently only supported for Jira. Your configuration uses ${cfg.service.type}.`);
        console.log('Please run `taskmaster-bridge setup` to configure Jira.');
        return;
    }
    // Get project key (from CLI option, service config, or default)
    const projectKey = getProjectKey(cfg, globalOpts.project);
    if (verbose) {
        console.log(`Using ${cfg.service.type} project key: ${projectKey}`);
    }
    // Export to Jira
    await exportToJira(file, {
        projectKey,
        batchSize: cfg.batchSize,
        jira: getJiraOptions(cfg)
    }, verbose);
});
program
    .command('import')
    .option('-o, --out <file>', 'Output filename', 'taskmaster_tasks.json')
    .option('--no-report', 'Disable generating a Markdown report')
    .option('--report-dir <directory>', 'Directory for report output', 'tasks/import_reports')
    .description('Download issues and write Taskmaster‑style JSON')
    .action(async (opts) => {
    const globalOpts = program.opts();
    const verbose = globalOpts.verbose;
    if (verbose) {
        console.log('🔍 Checking for configuration...');
    }
    // Check if configuration exists
    const configPath = path.resolve('.taskmasterbridgerc');
    if (!fs.existsSync(configPath)) {
        console.log('⚠️ No configuration file found. Running setup wizard...');
        await runOnboarding();
        console.log('Setup complete. Now continuing with import...');
    }
    const cfg = loadConfig(verbose);
    // Ensure we're using the right service type
    if (globalOpts.service && cfg.service.type !== globalOpts.service) {
        console.log(`⚠️ Configuration is for ${cfg.service.type} but --service=${globalOpts.service} was specified.`);
        console.log(`Using ${cfg.service.type} configuration.`);
    }
    // Only support Jira for now
    if (cfg.service.type !== 'jira') {
        console.log(`⚠️ Import is currently only supported for Jira. Your configuration uses ${cfg.service.type}.`);
        console.log('Please run `taskmaster-bridge setup` to configure Jira.');
        return;
    }
    // Get project key (from CLI option, service config, or default)
    const projectKey = getProjectKey(cfg, globalOpts.project);
    if (verbose) {
        console.log(`Using ${cfg.service.type} project key: ${projectKey}`);
    }
    // Import from Jira
    await importFromJira(opts.out, {
        projectKey,
        batchSize: cfg.batchSize,
        jira: getJiraOptions(cfg)
    }, verbose, {
        generateReport: opts.report,
        reportDir: opts.reportDir
    });
});
program
    .command('diff')
    .description('Show differences between Taskmaster JSON and issue tracking system')
    .action(async () => {
    const globalOpts = program.opts();
    const verbose = globalOpts.verbose;
    if (verbose) {
        console.log('🔍 Checking for configuration...');
    }
    // Check if configuration exists
    const configPath = path.resolve('.taskmasterbridgerc');
    if (!fs.existsSync(configPath)) {
        console.log('⚠️ No configuration file found. Running setup wizard...');
        await runOnboarding();
        console.log('Setup complete. Now continuing with diff...');
    }
    const cfg = loadConfig(verbose);
    // Ensure we're using the right service type
    if (globalOpts.service && cfg.service.type !== globalOpts.service) {
        console.log(`⚠️ Configuration is for ${cfg.service.type} but --service=${globalOpts.service} was specified.`);
        console.log(`Using ${cfg.service.type} configuration.`);
    }
    // Only support Jira for now
    if (cfg.service.type !== 'jira') {
        console.log(`⚠️ Diff is currently only supported for Jira. Your configuration uses ${cfg.service.type}.`);
        console.log('Please run `taskmaster-bridge setup` to configure Jira.');
        return;
    }
    // Get project key (from CLI option, service config, or default)
    const projectKey = getProjectKey(cfg, globalOpts.project);
    if (verbose) {
        console.log(`Using ${cfg.service.type} project key: ${projectKey}`);
    }
    // Diff with Jira
    await diffProjects({
        projectKey,
        batchSize: cfg.batchSize,
        jira: getJiraOptions(cfg)
    });
});
program.parse();
