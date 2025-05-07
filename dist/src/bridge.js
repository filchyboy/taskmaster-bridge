import { JiraClient } from './jiraClient.js';
import { readTaskmasterFile, writeTaskmasterFile } from './taskmaster.js';
import { getJiraOptions, getProjectKey } from '../config/defaultConfig.js';
/** Export Taskmaster JSON to Jira */
export async function exportToJira(file, cfg) {
    const data = readTaskmasterFile(file);
    // Handle both new and legacy config formats
    const jiraOptions = 'jira' in cfg ? cfg.jira : getJiraOptions(cfg);
    const jira = new JiraClient(jiraOptions);
    // Get project key from either config format
    const projectKey = 'projectKey' in cfg
        ? cfg.projectKey
        : getProjectKey(cfg);
    for (const task of data.tasks) {
        await jira.upsertIssue(mapTaskmasterToJira(task, projectKey));
    }
    console.log('✅ Export complete');
}
/** Import Jira issues into Taskmaster JSON */
export async function importFromJira(out, cfg) {
    // Handle both new and legacy config formats
    const jiraOptions = 'jira' in cfg ? cfg.jira : getJiraOptions(cfg);
    const jira = new JiraClient(jiraOptions);
    // Get project key from either config format
    const projectKey = 'projectKey' in cfg
        ? cfg.projectKey
        : getProjectKey(cfg);
    const total = await jira.countIssues(projectKey);
    const tasks = [];
    let fetched = 0;
    while (fetched < total) {
        const issues = await jira.fetchIssues(projectKey, fetched, cfg.batchSize);
        tasks.push(...issues.map((i) => mapJiraToTaskmaster(i)));
        fetched += issues.length;
    }
    writeTaskmasterFile(out, { tasks });
    console.log(`💾 Wrote ${tasks.length} tasks to ${out}`);
}
/** Diff: not yet implemented */
export async function diffProjects(cfg) {
    console.log('🛈 diff not implemented yet');
}
// ──────────────────────────── mapping helpers ─────────────────────────────
export function mapTaskmasterToJira(task, projectKey) {
    return {
        fields: {
            project: { key: projectKey },
            summary: task.title,
            description: task.description ?? '',
            issuetype: { name: 'Story' },
            labels: [`taskmaster-${task.id}`]
        }
    };
}
export function mapJiraToTaskmaster(issue) {
    return {
        id: parseInt(issue.key.replace(/^[^0-9]+/, ''), 10),
        title: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status.name.toLowerCase().includes('done') ? 'done' : 'pending'
    };
}
