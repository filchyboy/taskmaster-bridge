import { JiraClient } from './jiraClient.js';
import { readTaskmasterFile, writeTaskmasterFile, TaskmasterTask } from './taskmaster.js';
import { BridgeConfig } from '../config/defaultConfig.js';

/** Export Taskmaster JSON to Jira */
export async function exportToJira(file: string, cfg: BridgeConfig) {
  const data = readTaskmasterFile(file);
  const jira = new JiraClient(cfg.jira);

  for (const task of data.tasks) {
    await jira.upsertIssue(mapTaskmasterToJira(task, cfg));
  }
  console.log('✅ Export complete');
}

/** Import Jira issues into Taskmaster JSON */
export async function importFromJira(out: string, cfg: BridgeConfig) {
  const jira = new JiraClient(cfg.jira);
  const total = await jira.countIssues(cfg.projectKey);
  const tasks: TaskmasterTask[] = [];
  let fetched = 0;

  while (fetched < total) {
    const issues = await jira.fetchIssues(cfg.projectKey, fetched, cfg.batchSize);
    tasks.push(...issues.map((i: any) => mapJiraToTaskmaster(i)));
    fetched += issues.length;
  }

  writeTaskmasterFile(out, { tasks });
  console.log(`💾 Wrote ${tasks.length} tasks to ${out}`);
}

/** Diff: not yet implemented */
export async function diffProjects(cfg: BridgeConfig) {
  console.log('🛈 diff not implemented yet');
}

// ──────────────────────────── mapping helpers ─────────────────────────────
export function mapTaskmasterToJira(task: TaskmasterTask, cfg: BridgeConfig) {
  return {
    fields: {
      project: { key: cfg.projectKey },
      summary: task.title,
      description: task.description ?? '',
      issuetype: { name: 'Story' },
      labels: [`taskmaster-${task.id}`]
    }
  };
}

export function mapJiraToTaskmaster(issue: any): TaskmasterTask {
  return {
    id: parseInt(issue.key.replace(/^[^0-9]+/, ''), 10),
    title: issue.fields.summary,
    description: issue.fields.description,
    status: issue.fields.status.name.toLowerCase().includes('done') ? 'done' : 'pending'
  };
}
