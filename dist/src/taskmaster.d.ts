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
    parentTaskId?: number;
}
export interface TaskmasterFile {
    tasks: TaskmasterTask[];
}
export declare function readTaskmasterFile(path: string): TaskmasterFile;
export declare function writeTaskmasterFile(path: string, data: TaskmasterFile): void;
