import axios, { AxiosInstance } from 'axios';

export interface JiraClientOptions {
  baseUrl: string;
  email: string;
  token: string;
  concurrency?: number;
  verbose?: boolean;
}

export class JiraClient {
  private api: AxiosInstance;
  private subtaskType: string | null = null;

  constructor(private opts: JiraClientOptions) {
    this.api = axios.create({
      baseURL: `${opts.baseUrl}/rest/api/3`,
      auth: { username: opts.email, password: opts.token },
      headers: { Accept: 'application/json' }
    });
  }

  /**
   * Get available issue types for a project
   */
  async getIssueTypes(projectKey: string): Promise<any[]> {
    try {
      const res = await this.api.get(`/project/${projectKey}`);
      return res.data.issueTypes || [];
    } catch (error: any) {
      if (this.opts.verbose) {
        console.error('Error getting issue types:', error.response?.data || error.message);
      }
      return [];
    }
  }

  /**
   * Find the subtask issue type for a project
   */
  async findSubtaskType(projectKey: string): Promise<string> {
    if (this.subtaskType) {
      return this.subtaskType;
    }

    const issueTypes = await this.getIssueTypes(projectKey);

    // Find a subtask type
    const subtaskType = issueTypes.find(type => type.subtask);

    if (subtaskType) {
      this.subtaskType = subtaskType.id;
      if (this.opts.verbose) {
        console.log(`Found subtask type: ${subtaskType.name} (${subtaskType.id})`);
      }
      return subtaskType.id;
    }

    // Fallback to looking for a type with "sub" in the name
    const subNameType = issueTypes.find(type =>
      type.name.toLowerCase().includes('sub') ||
      type.name.toLowerCase().includes('child')
    );

    if (subNameType) {
      this.subtaskType = subNameType.id;
      if (this.opts.verbose) {
        console.log(`Found subtask type by name: ${subNameType.name} (${subNameType.id})`);
      }
      return subNameType.id;
    }

    // Last resort, just use the first type
    if (issueTypes.length > 0) {
      this.subtaskType = issueTypes[0].id;
      if (this.opts.verbose) {
        console.log(`No subtask type found, using: ${issueTypes[0].name} (${issueTypes[0].id})`);
      }
      return issueTypes[0].id;
    }

    throw new Error('No issue types found for project');
  }

  /** Get the total number of issues in the project */
  async countIssues(projectKey: string, includeSubtasks: boolean = false): Promise<number> {
    const jql = includeSubtasks
      ? `project = ${projectKey}`
      : `project = ${projectKey} AND issuetype NOT IN subTaskIssueTypes()`;

    const res = await this.api.post('/search', {
      jql,
      maxResults: 0
    });
    return res.data.total;
  }

  /** Fetch a single page of issues. */
  async fetchIssues(projectKey: string, startAt = 0, maxResults = 100, includeSubtasks: boolean = false) {
    const jql = includeSubtasks
      ? `project = ${projectKey} ORDER BY key ASC`
      : `project = ${projectKey} AND issuetype NOT IN subTaskIssueTypes() ORDER BY key ASC`;

    const res = await this.api.post('/search', {
      jql,
      fields: ['summary', 'description', 'labels', 'parent', 'issuetype', 'status'],
      startAt,
      maxResults
    });
    return res.data.issues;
  }

  /** Fetch all subtasks for a parent issue */
  async fetchSubtasks(parentKey: string) {
    const res = await this.api.post('/search', {
      jql: `parent = ${parentKey} ORDER BY key ASC`,
      fields: ['summary', 'description', 'labels', 'parent', 'issuetype', 'status']
    });
    return res.data.issues;
  }

  /** Create or update an issue. */
  async upsertIssue(issue: Record<string, any>) {
    try {
      // Check if the issue has a label that matches taskmaster-{id}
      const labels = issue.fields?.labels as string[] || [];
      const taskmasterLabel = labels.find(label => label.startsWith('taskmaster-'));

      if (taskmasterLabel) {
        // Try to find an existing issue with this label
        const searchRes = await this.api.post('/search', {
          jql: `labels = "${taskmasterLabel}" AND project = "${issue.fields?.project?.key}"`,
          maxResults: 1
        });

        if (searchRes.data.issues && searchRes.data.issues.length > 0) {
          // Issue exists, update it
          const existingIssue = searchRes.data.issues[0];
          await this.api.put(`/issue/${existingIssue.key}`, {
            fields: issue.fields
          });
          return { updated: true, key: existingIssue.key };
        }
      }

      // Create a new issue
      const createRes = await this.api.post('/issue', issue);
      return { created: true, key: createRes.data.key };
    } catch (error: any) {
      if (this.opts.verbose) {
        console.error('Error upserting issue:', error.response?.data || error.message);
      }
      throw error;
    }
  }
}