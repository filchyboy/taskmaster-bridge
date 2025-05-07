# Taskmaster Bridge

A tool to connect Taskmaster with multiple issue tracking systems (Jira, Linear, and more).

## Installation

```bash
npm i taskmaster-bridge -g   # install globally
```

## Getting Started

### Interactive Setup

The easiest way to get started is to use the interactive setup:

```bash
taskmaster-bridge setup
```

This will guide you through configuring your issue tracking service:

1. Choose your service type (Jira, Linear)
2. Check for existing credentials in environment variables
3. Enter any missing configuration details

The setup process is smart about environment variables:
- If credentials are found in your environment, they'll be used automatically
- You'll only be prompted for values that aren't already set
- The project key is always configurable per project

#### Jira Configuration
If you choose Jira, you'll be prompted for:
- Jira company name (e.g., "your-company" for https://your-company.atlassian.net)
- Jira project key (e.g., TEST) - always prompted even if set in environment
- Jira email address (if not found in environment)
- Jira API token (if not found in environment, create one at https://id.atlassian.com/manage-profile/security/api-tokens)

#### Linear Configuration (TODO)
If you choose Linear, you'll be prompted for:
- Linear team key (if not found in environment)
- Linear API key (if not found in environment, create one at https://linear.app/settings/api)

Your configuration will be saved to `.taskmasterbridgerc` in the current directory. This file is automatically added to `.gitignore` to prevent accidentally committing your credentials.

### Configuration Security

**Important:** Never commit your `.taskmasterbridgerc` file to version control. It contains sensitive credentials.

The configuration file is in YAML format and looks like this:

#### Jira Configuration Example
```yaml
service:
  type: jira
  projectKey: TEST
  baseUrl: https://your-company.atlassian.net
  email: your-email@example.com
  token: your-api-token
batchSize: 100
```

#### Linear Configuration Example (TODO)
```yaml
service:
  type: linear
  teamKey: TEAM
  apiKey: your-linear-api-key
batchSize: 100
```

### Using Environment Variables

You can use environment variables instead of or alongside the configuration file. This is especially useful for CI/CD pipelines or for sharing common settings across projects.

#### Recommended Environment Variables for Jira
```bash
# These are recommended to set in your environment
export JIRA_EMAIL="your-email@example.com"
export JIRA_TOKEN="your-api-token"
export JIRA_BASE_URL="https://your-company.atlassian.net"

# Project key is typically configured per project, not in environment
# export JIRA_PROJECT_KEY="TEST"
```

#### For Linear (TODO)
```bash
export LINEAR_TEAM_KEY="TEAM"
export LINEAR_API_KEY="your-linear-api-key"
```

#### Environment Variable Behavior
- When running `taskmaster-bridge setup`, existing environment variables will be detected and used
- You'll only be prompted for values that aren't set in the environment
- Project key is always prompted for during setup, even if set in environment, but can be set in options
- Environment variables take precedence over values in the configuration file
- You can check which environment variables are being used with the `--verbose` flag

## Usage

### Global Options

```bash
# Show verbose output (credential sources, configuration details)
taskmaster-bridge --verbose export tasks.json

# Specify service type
taskmaster-bridge --service jira export tasks.json

# Specify project key
taskmaster-bridge --project TEST export tasks.json

# Combine options
taskmaster-bridge --verbose --service jira --project TEST export tasks.json
```

### Service Selection

You can specify which service to use with the `--service` option:

```bash
taskmaster-bridge --service jira export tasks.json
taskmaster-bridge --service linear export tasks.json
```

If not specified, it will use the service from your configuration file.

### Verbose Mode

Use the `--verbose` flag to see detailed information about:
- Where credentials are being loaded from (environment variables or config file)
- Which specific environment variables were found
- Which configuration file is being used
- Service-specific details

```bash
taskmaster-bridge --verbose export tasks.json
```

Example output:
```
🔍 Checking for configuration...
📄 Found configuration file: .taskmasterbridgerc
✅ Found environment variable: JIRA_BASE_URL
✅ Found environment variable: JIRA_EMAIL
✅ Found environment variable: JIRA_TOKEN
🔑 Using credentials from environment variables
Using jira project key: TEST
```

During setup, you'll see which credentials were found in your environment:
```
📋 Setting up Jira configuration...
✅ Found Jira credentials in your environment variables.
Using JIRA_BASE_URL: https://your-company.atlassian.net
Using JIRA_EMAIL: your-email@example.com
Using JIRA_TOKEN: ********

Enter your Jira project key (e.g., TEST):
```

### Export Taskmaster → Issue Tracking System

```bash
taskmaster-bridge export tasks.json
```

You can override the project key from the configuration:
```bash
taskmaster-bridge export tasks.json --project TEST
```

### Import Issues → Taskmaster JSON

```bash
# Basic import
taskmaster-bridge import -o taskmaster_tasks.json

# Specify project key
taskmaster-bridge import -o taskmaster_tasks.json --project TEST

# Disable report generation
taskmaster-bridge import -o taskmaster_tasks.json --no-report

# Specify custom report directory
taskmaster-bridge import -o taskmaster_tasks.json --report-dir custom/reports
```

#### Import Report Generation

By default, the import command generates a detailed Markdown report of all imported tasks and subtasks. The report includes:

- Date and time of the import
- Project key
- Summary of imported tasks and subtasks
- Table of all tasks with key, title, description, status, and subtask count
- Separate tables for each task's subtasks

Reports are saved to the `tasks/import_reports` directory by default, with filenames that include timestamps (e.g., `20250507_180747_Import_Report.md`). This ensures that multiple reports generated on the same day have unique filenames.

You can:
- Disable report generation with `--no-report`
- Specify a custom report directory with `--report-dir custom/path`

### Show Differences (TODO)

```bash
taskmaster-bridge diff
```

### Service-Specific Commands

#### Jira-Specific

```bash
# Export to Jira with specific project key
taskmaster-bridge --service jira --project TEST export tasks.json

# Import from Jira
taskmaster-bridge --service jira import -o jira_tasks.json

# Import from Jira with report options
taskmaster-bridge --service jira import -o jira_tasks.json --report-dir reports
```

#### Linear-Specific (TODO)

```bash
# Export to Linear
taskmaster-bridge --service linear export tasks.json

# Import from Linear
taskmaster-bridge --service linear import -o linear_tasks.json

# Import from Linear with report options
taskmaster-bridge --service linear import -o linear_tasks.json --report-dir reports
```

## License

MIT License – see full text in file.

---

## Development Roadmap

* Flesh out `jira.upsertIssue` and mapping functions to support parent/child relations and status updates.
* Implement the `diff` command (two‑way reconciliation).
* Add telemetry stub with opt‑in check.
* Publish the first alpha to npm under your scope.
