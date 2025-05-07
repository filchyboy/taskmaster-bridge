# taskmaster-bridge
Tool to connect taskmaster w/ issue tracking systems

Sync Taskmaster task lists with Jira.

```bash
npm i taskmaster-bridge -g   # install globally

# export Taskmaster → Jira
taskmaster-bridge export tasks.json

# import Jira → Taskmaster JSON
taskmaster-bridge import -o jira.json

Environment variables required:

JIRA_EMAIL – Atlassian account email

JIRA_TOKEN – Jira API token

JIRA_BASE_URL – Base URL (default https://your‑site.atlassian.net)


### **LICENSE**
MIT License – see full text in file.

---

TODO

* Flesh out `jira.upsertIssue` and mapping functions to support parent/child relations and status updates.
* Implement the `diff` command (two‑way reconciliation).
* Add telemetry stub with opt‑in check.
* Publish the first alpha to npm under your scope.

This scaffold compiles, links a runnable CLI, and leaves clear TODOs for domain‑specific logic without locking you into any future integrations.  Feel free to iterate.