import fs from 'fs';

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
  parentTaskId?: number;  // For subtasks, references the parent task ID
}

export interface TaskmasterFile {
  tasks: TaskmasterTask[];
}

export function readTaskmasterFile(path: string): TaskmasterFile {
  // TODO: read & validate schema
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export function writeTaskmasterFile(path: string, data: TaskmasterFile) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}