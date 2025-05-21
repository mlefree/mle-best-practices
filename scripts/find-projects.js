#!/usr/bin/env node

const path = require('path');
const common = require('./common');

// Get the script name
const scriptName = path.basename(__filename, '.js');

// Define the processor function
function processProject(project, bpStatus) {
  // This is a simple script that just finds projects, no additional processing needed
  return {};
}

// Define the row generator function
function generateRow(result) {
  return `| ${result.projectName} | ${result.projectPath} |\n`;
}

// Define the summary generator function
function generateSummary(results) {
  return {
    'Total projects found': results.length
  };
}

// Process all projects
common.processProjects(
  scriptName,
  processProject,
  'Projects with Best Practices Status',
  ['Project Name', 'Project Path'],
  generateRow,
  generateSummary,
  path.resolve(__dirname, '../STATUS_PROJECTS.gitignored.md')
);
