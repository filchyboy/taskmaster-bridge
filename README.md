# Taskmaster Bridge

A tool to connect Taskmaster with issue tracking systems like Jira.

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

This will guide you through configuring your Jira connection:
1. Enter your Jira URL (e.g., https://your-company.atlassian.net)
2. Enter your Jira project key (e.g., TEST)
3. Enter your Jira email address
4. Enter your Jira API token (create one at https://id.atlassian.com/manage-profile/security/api-tokens)

Your configuration will be saved to `.taskmasterbridgerc` in the current directory. This file is automatically added to `.gitignore` to prevent accidentally committing your credentials.

### Configuration Security

**Important:** Never commit your `.taskmasterbridgerc` file to version control. It contains sensitive credentials.

The configuration file is in YAML format and looks like this:
```yaml
projectKey: TEST
batchSize: 100
jira:
  baseUrl: https://your-company.atlassian.net
  email: your-email@example.com
  token: your-api-token
```

### Using Environment Variables

You can also use environment variables instead of the configuration file:

```bash
export JIRA_EMAIL="your-email@example.com"
export JIRA_TOKEN="your-api-token"
export JIRA_BASE_URL="https://your-company.atlassian.net"
```

## Usage

### Export Taskmaster → Jira

```bash
taskmaster-bridge export tasks.json
```

You can override the project key from the configuration:
```bash
taskmaster-bridge export tasks.json --project TEST
```

### Import Jira → Taskmaster JSON

```bash
taskmaster-bridge import -o jira.json
```

### Show Differences

```bash
taskmaster-bridge diff
```

## License

MIT License – see full text in file.

---

## Development Roadmap

* Flesh out `jira.upsertIssue` and mapping functions to support parent/child relations and status updates.
* Implement the `diff` command (two‑way reconciliation).
* Add telemetry stub with opt‑in check.
* Publish the first alpha to npm under your scope.
