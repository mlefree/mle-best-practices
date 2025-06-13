#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common.cjs');

// Get the script name
const scriptName = path.basename(__filename, '.cjs');

// Define the processor function
function processProject(project, bpStatus) {
    // Get project type from bpstatus.json
    const projectType = bpStatus.type || 'unknown';

    // Get package version from package.json
    const packageJson = common.readPackageJson(project.projectPath);
    const packageVersion = packageJson ? packageJson.version || 'unknown' : 'unknown';

    // Get status updates from bpstatus.json
    const statusUpdates = bpStatus.status || {};

    return {
        projectType,
        packageVersion,
        statusUpdates,
    };
}

// Define the row generator function
function generateRow(result) {
    // Get status for each check script
    const findProjects = result.statusUpdates['find-projects'] || '';
    const checkGitignore = result.statusUpdates['check-gitignore'] || '';
    const checkMemoryBank = result.statusUpdates['check-memory-bank'] || '';
    const checkScripts = result.statusUpdates['check-scripts'] || '';

    return `| ${result.projectName} | ${result.packageVersion} | ${result.projectType} | ${result.projectPath} | ${findProjects} | ${checkGitignore} | ${checkMemoryBank} | ${checkScripts} |\n`;
}

// Define the summary generator function
function generateSummary(results) {
    // Count projects by type
    const appProjects = results.filter((r) => r.projectType === 'app').length;
    const packageProjects = results.filter((r) => r.projectType === 'package').length;
    const standaloneProjects = results.filter((r) => r.projectType === 'standalone').length;
    const unknownProjects = results.filter((r) => r.projectType === 'unknown').length;

    // Count projects with updates
    const projectsWithUpdates = results.filter(
        (r) => r.statusUpdates && Object.keys(r.statusUpdates).length > 0
    ).length;

    // Count total updates
    let totalUpdates = 0;
    results.forEach((r) => {
        if (r.statusUpdates) {
            totalUpdates += Object.keys(r.statusUpdates).length;
        }
    });

    return {
        'Total projects found': results.length,
        'App projects': appProjects,
        'Package projects': packageProjects,
        'Standalone projects': standaloneProjects,
        'Unknown type projects': unknownProjects,
        'Projects with status updates': projectsWithUpdates,
        'Total status updates': totalUpdates,
    };
}

// Process all projects
common.processProjects(
    scriptName,
    processProject,
    'All Projects Status Summary',
    [
        'Project Name',
        'Package Version',
        'Project Type',
        'Project Path',
        'find-projects',
        'check-gitignore',
        'check-memory-bank',
        'check-scripts',
    ],
    generateRow,
    generateSummary,
    path.resolve(__dirname, '../STATUS_ALL.gitignored.md')
);
