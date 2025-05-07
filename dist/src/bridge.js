import fs from 'fs';
import path from 'path';
import { JiraClient } from './jiraClient.js';
import { readTaskmasterFile, writeTaskmasterFile } from './taskmaster.js';
import { getJiraOptions, getProjectKey } from '../config/defaultConfig.js';
/** Export Taskmaster JSON to Jira */
export async function exportToJira(file, cfg, verbose = false) {
    const data = readTaskmasterFile(file);
    // Handle both new and legacy config formats
    const jiraOptions = 'jira' in cfg ? cfg.jira : getJiraOptions(cfg);
    // Add verbose flag to options
    jiraOptions.verbose = verbose;
    const jira = new JiraClient(jiraOptions);
    // Get project key from either config format
    const projectKey = 'projectKey' in cfg
        ? cfg.projectKey
        : getProjectKey(cfg);
    // Count total tasks including subtasks
    let totalTasks = data.tasks.length;
    for (const task of data.tasks) {
        if (task.subtasks && Array.isArray(task.subtasks)) {
            totalTasks += task.subtasks.length;
        }
    }
    if (verbose) {
        console.log(`Exporting ${data.tasks.length} parent tasks and their subtasks to Jira project ${projectKey}...`);
    }
    let created = 0;
    let updated = 0;
    let errors = 0;
    let processedCount = 0;
    // Map to store Jira issue keys by task ID
    const taskToJiraKey = new Map();
    // First, process all parent tasks
    for (let i = 0; i < data.tasks.length; i++) {
        const task = data.tasks[i];
        try {
            // Show progress
            if (!verbose) {
                process.stdout.write(`\rExporting tasks... ${Math.round((processedCount / totalTasks) * 100)}%`);
            }
            else {
                console.log(`[${processedCount + 1}/${totalTasks}] Exporting parent task: ${task.title}`);
            }
            const result = await jira.upsertIssue(mapTaskmasterToJira(task, projectKey));
            processedCount++;
            if (result.created) {
                created++;
                if (verbose)
                    console.log(`  Created issue ${result.key}`);
            }
            else if (result.updated) {
                updated++;
                if (verbose)
                    console.log(`  Updated issue ${result.key}`);
            }
            // Store the Jira key for this task
            taskToJiraKey.set(task.id, result.key);
        }
        catch (error) {
            errors++;
            processedCount++;
            if (verbose) {
                console.error(`  Error exporting task ${task.id}: ${error.message || 'Unknown error'}`);
            }
        }
    }
    // Then, process all subtasks
    for (let i = 0; i < data.tasks.length; i++) {
        const parentTask = data.tasks[i];
        const parentKey = taskToJiraKey.get(parentTask.id);
        // Skip if parent task wasn't created successfully
        if (!parentKey)
            continue;
        // Process subtasks if they exist
        if (parentTask.subtasks && Array.isArray(parentTask.subtasks)) {
            try {
                // Get the subtask type ID
                const subtaskTypeId = await jira.findSubtaskType(projectKey);
                for (let j = 0; j < parentTask.subtasks.length; j++) {
                    const subtask = parentTask.subtasks[j];
                    try {
                        // Show progress
                        if (!verbose) {
                            process.stdout.write(`\rExporting tasks... ${Math.round((processedCount / totalTasks) * 100)}%`);
                        }
                        else {
                            console.log(`[${processedCount + 1}/${totalTasks}] Exporting subtask: ${subtask.title}`);
                        }
                        const result = await jira.upsertIssue(mapSubtaskToJira(subtask, projectKey, parentKey, subtaskTypeId));
                        processedCount++;
                        if (result.created) {
                            created++;
                            if (verbose)
                                console.log(`  Created subtask ${result.key}`);
                        }
                        else if (result.updated) {
                            updated++;
                            if (verbose)
                                console.log(`  Updated subtask ${result.key}`);
                        }
                    }
                    catch (error) {
                        errors++;
                        processedCount++;
                        if (verbose) {
                            console.error(`  Error exporting subtask ${subtask.id}: ${error.message || 'Unknown error'}`);
                        }
                    }
                }
            }
            catch (error) {
                // If we can't get the subtask type, skip all subtasks for this parent
                if (verbose) {
                    console.error(`  Error getting subtask type: ${error.message || 'Unknown error'}`);
                    console.error(`  Skipping all subtasks for parent task ${parentTask.id}`);
                }
                processedCount += parentTask.subtasks.length;
                errors += parentTask.subtasks.length;
            }
        }
    }
    // Clear the progress line
    if (!verbose) {
        process.stdout.write('\r                                                \r');
    }
    console.log(`✅ Export complete: ${created} created, ${updated} updated${errors > 0 ? `, ${errors} errors` : ''}`);
}
/** Import Jira issues into Taskmaster JSON */
export async function importFromJira(out, cfg, verbose = false, options = {}) {
    // Handle both new and legacy config formats
    const jiraOptions = 'jira' in cfg ? cfg.jira : getJiraOptions(cfg);
    // Add verbose flag to options
    jiraOptions.verbose = verbose;
    const jira = new JiraClient(jiraOptions);
    // Get project key from either config format
    const projectKey = 'projectKey' in cfg
        ? cfg.projectKey
        : getProjectKey(cfg);
    // Get total issue count (parent tasks only)
    const parentTotal = await jira.countIssues(projectKey, false);
    if (verbose) {
        console.log(`Found ${parentTotal} parent issues in project ${projectKey}`);
    }
    // Fetch all parent issues
    const parentTasks = [];
    const batchSize = cfg.batchSize || 100;
    let processedCount = 0;
    for (let i = 0; i < parentTotal; i += batchSize) {
        if (!verbose) {
            process.stdout.write(`\rImporting parent tasks... ${Math.round((processedCount / parentTotal) * 100)}%`);
        }
        const issues = await jira.fetchIssues(projectKey, i, batchSize, false);
        for (const issue of issues) {
            parentTasks.push(mapJiraToTaskmaster(issue, false));
            processedCount++;
        }
    }
    if (!verbose) {
        process.stdout.write('\r                                                \r');
    }
    // Now fetch subtasks for each parent task
    if (verbose) {
        console.log('Fetching subtasks...');
    }
    // Create a map of parent task ID to task object for easy lookup
    const taskMap = new Map();
    for (const task of parentTasks) {
        taskMap.set(task.id, task);
    }
    let subtaskCount = 0;
    let processedParents = 0;
    for (const parentTask of parentTasks) {
        if (!verbose) {
            process.stdout.write(`\rImporting subtasks... ${Math.round((processedParents / parentTasks.length) * 100)}%`);
        }
        try {
            // Get the Jira key for this task
            const parentKey = `${projectKey}-${parentTask.id}`;
            const subtaskIssues = await jira.fetchSubtasks(parentKey);
            if (subtaskIssues.length > 0) {
                // Map subtasks to Taskmaster format
                const subtasks = subtaskIssues.map((issue) => mapJiraToTaskmaster(issue, true));
                // Add subtasks to parent task
                parentTask.subtasks = subtasks;
                subtaskCount += subtasks.length;
                if (verbose) {
                    console.log(`Added ${subtasks.length} subtasks to task ${parentTask.id}`);
                }
            }
        }
        catch (error) {
            if (verbose) {
                console.error(`Error fetching subtasks for task ${parentTask.id}: ${error.message || 'Unknown error'}`);
            }
        }
        processedParents++;
    }
    if (!verbose) {
        process.stdout.write('\r                                                \r');
    }
    // Write to file
    writeTaskmasterFile(out, { tasks: parentTasks });
    // Generate report if enabled (default is true)
    const generateReport = options.generateReport !== false;
    if (generateReport) {
        const reportDir = options.reportDir || 'tasks/import_reports';
        const reportPath = generateImportReport(parentTasks, subtaskCount, projectKey, reportDir);
        console.log(`✅ Imported ${parentTasks.length} tasks and ${subtaskCount} subtasks to ${out}`);
        console.log(`📊 Report generated: ${reportPath}`);
    }
    else {
        console.log(`✅ Imported ${parentTasks.length} tasks and ${subtaskCount} subtasks to ${out}`);
    }
}
/**
 * Generate a Markdown report of imported tasks and subtasks
 */
function generateImportReport(tasks, subtaskCount, projectKey, reportDir = 'tasks/import_reports') {
    // Create a timestamp for the filename (YYYYMMDD_HHMMSS format)
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, '').split('.')[0];
    // Format: YYYYMMDD_HHMMSS_Import_Report.md
    const reportFilename = `${dateStr.substring(0, 8)}_${dateStr.substring(8)}_Import_Report.md`;
    // Ensure the report directory exists
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    // Create the full path for the report file
    const reportPath = path.join(reportDir, reportFilename);
    // Start building the report content
    let report = `# Jira Import Report\n\n`;
    report += `**Date:** ${now.toISOString().replace('T', ' ').split('.')[0]}\n\n`;
    report += `**Project:** ${projectKey}\n\n`;
    report += `**Summary:** Imported ${tasks.length} tasks and ${subtaskCount} subtasks\n\n`;
    // Add task table header
    report += `## Tasks\n\n`;
    report += `| Key | Title | Description | Status | Subtasks |\n`;
    report += `| --- | ----- | ----------- | ------ | -------- |\n`;
    // Add each task to the table
    for (const task of tasks) {
        const key = `${projectKey}-${task.id}`;
        const title = task.title;
        const description = task.description ?
            (task.description.length > 50 ? task.description.substring(0, 47) + '...' : task.description) :
            '';
        const status = task.status;
        const subtaskCount = task.subtasks ? task.subtasks.length : 0;
        report += `| ${key} | ${title} | ${description} | ${status} | ${subtaskCount} |\n`;
        // Add subtasks if they exist
        if (task.subtasks && task.subtasks.length > 0) {
            report += `\n### Subtasks for ${key}\n\n`;
            report += `| Key | Title | Description | Status |\n`;
            report += `| --- | ----- | ----------- | ------ |\n`;
            for (const subtask of task.subtasks) {
                const subtaskKey = `${projectKey}-${subtask.id}`;
                const subtaskTitle = subtask.title;
                const subtaskDescription = subtask.description ?
                    (subtask.description.length > 50 ? subtask.description.substring(0, 47) + '...' : subtask.description) :
                    '';
                const subtaskStatus = subtask.status;
                report += `| ${subtaskKey} | ${subtaskTitle} | ${subtaskDescription} | ${subtaskStatus} |\n`;
            }
            report += `\n`;
        }
    }
    // Write the report to a file
    fs.writeFileSync(reportPath, report);
    return reportPath;
}
/** Diff: not yet implemented */
export async function diffProjects(cfg) {
    console.log('🛈 diff not implemented yet');
}
// ──────────────────────────── mapping helpers ─────────────────────────────
/**
 * Convert plain text to Atlassian Document Format
 */
function textToADF(text) {
    if (!text)
        return null;
    return {
        type: 'doc',
        version: 1,
        content: [
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: text
                    }
                ]
            }
        ]
    };
}
/**
 * Map a Taskmaster task to a Jira issue
 */
export function mapTaskmasterToJira(task, projectKey) {
    return {
        fields: {
            project: { key: projectKey },
            summary: task.title,
            description: textToADF(task.description),
            issuetype: { name: 'Story' },
            labels: [`taskmaster-${task.id}`]
        }
    };
}
/**
 * Map a Taskmaster subtask to a Jira subtask
 */
export function mapSubtaskToJira(subtask, projectKey, parentKey, subtaskTypeId) {
    return {
        fields: {
            project: { key: projectKey },
            summary: subtask.title,
            description: textToADF(subtask.description),
            issuetype: { id: subtaskTypeId },
            parent: { key: parentKey },
            labels: [`taskmaster-subtask-${subtask.id}`]
        }
    };
}
/**
 * Extract text from Atlassian Document Format
 */
function extractTextFromADF(adf) {
    if (!adf)
        return null;
    try {
        // If it's already a string, return it
        if (typeof adf === 'string')
            return adf;
        // If it's an ADF document, extract text from it
        if (adf.type === 'doc' && Array.isArray(adf.content)) {
            return adf.content
                .map((block) => {
                if (block.type === 'paragraph' && Array.isArray(block.content)) {
                    return block.content
                        .filter((item) => item.type === 'text')
                        .map((item) => item.text)
                        .join('');
                }
                return '';
            })
                .filter(Boolean)
                .join('\n');
        }
    }
    catch (error) {
        // If there's any error parsing, return null
        return null;
    }
    return null;
}
/**
 * Map a Jira issue to a Taskmaster task
 */
export function mapJiraToTaskmaster(issue, isSubtask = false) {
    // Extract the numeric part of the issue key (e.g., "TEST-123" -> 123)
    const id = parseInt(issue.key.replace(/^[^0-9]+/, ''), 10);
    // Determine status based on Jira status name
    let status = 'pending';
    const jiraStatus = issue.fields.status.name.toLowerCase();
    if (jiraStatus.includes('done') || jiraStatus.includes('complete') || jiraStatus.includes('closed')) {
        status = 'done';
    }
    else if (jiraStatus.includes('defer') || jiraStatus.includes('backlog')) {
        status = 'deferred';
    }
    // Extract description text from ADF
    const description = extractTextFromADF(issue.fields.description);
    // Create the base task
    const task = {
        id,
        title: issue.fields.summary,
        description: description || undefined,
        status
    };
    // Add parent task ID for subtasks
    if (isSubtask && issue.fields.parent) {
        const parentId = parseInt(issue.fields.parent.key.replace(/^[^0-9]+/, ''), 10);
        task.parentTaskId = parentId;
    }
    return task;
}
