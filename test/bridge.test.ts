import { describe, it, expect } from 'vitest';
import { mapJiraToTaskmaster, mapTaskmasterToJira } from '../src/bridge.js';
import { TaskmasterTask } from '../src/taskmaster.js';

describe('mapping', () => {
  it('converts Jira issue to Taskmaster task', () => {
    const issue = {
      key: 'COL-123',
      fields: {
        summary: 'Example',
        description: 'Example description',
        status: { name: 'Done' }
      }
    };
    const task = mapJiraToTaskmaster(issue);
    expect(task.id).toBe(123);
    expect(task.title).toBe('Example');
    expect(task.status).toBe('done');
  });

  it('converts Taskmaster task to Jira issue', () => {
    const task: TaskmasterTask = {
      id: 456,
      title: 'Implement feature X',
      description: 'This is a detailed description of feature X',
      status: 'pending'
    };

    // Using legacy config format for the test
    const config = {
      projectKey: 'PROJ',
      jira: {
        baseUrl: 'https://example.atlassian.net',
        email: 'test@example.com',
        token: 'dummy-token'
      },
      batchSize: 50
    };

    const jiraIssue = mapTaskmasterToJira(task, config);

    expect(jiraIssue.fields.project.key).toBe('PROJ');
    expect(jiraIssue.fields.summary).toBe('Implement feature X');

    // Check that description is in Atlassian Document Format
    expect(jiraIssue.fields.description).not.toBeNull();
    if (jiraIssue.fields.description) {
      expect(jiraIssue.fields.description).toHaveProperty('type', 'doc');
      expect(jiraIssue.fields.description).toHaveProperty('version', 1);
      expect(jiraIssue.fields.description.content[0].content[0].text).toBe('This is a detailed description of feature X');
    }

    expect(jiraIssue.fields.issuetype.name).toBe('Story');
    expect(jiraIssue.fields.labels).toContain('taskmaster-456');
  });
});
