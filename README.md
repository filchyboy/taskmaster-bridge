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
2. Enter service-specific configuration details

#### Jira Configuration
If you choose Jira, you'll be prompted for:
- Jira URL (e.g., https://your-company.atlassian.net)
- Jira project key (e.g., TEST)
- Jira email address
- Jira API token (create one at https://id.atlassian.com/manage-profile/security/api-tokens)

#### Linear Configuration
If you choose Linear, you'll be prompted for:
- Linear team key
- Linear API key (create one at https://linear.app/settings/api)

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

#### Linear Configuration Example
```yaml
service:
  type: linear
  teamKey: TEAM
  apiKey: your-linear-api-key
batchSize: 100
```

### Using Environment Variables

You can also use environment variables instead of the configuration file:

#### For Jira
```bash
export JIRA_PROJECT_KEY="TEST"
export JIRA_EMAIL="your-email@example.com"
export JIRA_TOKEN="your-api-token"
export JIRA_BASE_URL="https://your-company.atlassian.net"
```

#### For Linear
```bash
export LINEAR_TEAM_KEY="TEAM"
export LINEAR_API_KEY="your-linear-api-key"
```

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
✅ Found environment variable: JIRA_EMAIL
✅ Found environment variable: JIRA_TOKEN
🔑 Using credentials from environment variables
Using jira project key: TEST
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
taskmaster-bridge import -o taskmaster_tasks.json
```

### Show Differences

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
```

#### Linear-Specific (Coming Soon)

```bash
# Export to Linear
taskmaster-bridge --service linear export tasks.json

# Import from Linear
taskmaster-bridge --service linear import -o linear_tasks.json
```

## License

MIT License – see full text in file.

---

## Development Roadmap

* Flesh out `jira.upsertIssue` and mapping functions to support parent/child relations and status updates.
* Implement the `diff` command (two‑way reconciliation).
* Add telemetry stub with opt‑in check.
* Publish the first alpha to npm under your scope.
