export interface TaskmasterTask {
    id: number;
    title: string;
    description?: string;
    status: 'pending' | 'done' | 'deferred';
    dependencies?: number[];
    priority?: 'high' | 'medium' | 'low';
    details?: string;
    testStrategy?: string;
    subtasks?: TaskmasterTask[];
  }
  
  export interface TaskmasterFile {
    tasks: TaskmasterTask[];
  }
  
  export function readTaskmasterFile(path: string): TaskmasterFile {
    // TODO: read & validate schema
    return JSON.parse(require('fs').readFileSync(path, 'utf8'));
  }
  
  export function writeTaskmasterFile(path: string, data: TaskmasterFile) {
    require('fs').writeFileSync(path, JSON.stringify(data, null, 2));
  }