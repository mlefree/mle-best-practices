#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common');

// Load environment variables and get projects folders
const projectsFolders = common.loadEnvironmentVariables();

// Parse the comma-separated list of folders
const foldersToSearch = common.parseFoldersToSearch(projectsFolders);

// Find all projects with bpstatus.json
const allProjects = common.findAllProjects(foldersToSearch);

// Update bpstatus.json for each project
for (const project of allProjects) {
  // Check if this script is excluded by the exclude rules
  const scriptName = path.basename(__filename, '.js');
  const bpStatus = common.readBpStatus(project.bpStatusPath);
  const isExcluded = common.isScriptExcluded(bpStatus, scriptName);

  // Only update bpstatus.json if the script is not excluded
  if (!isExcluded) {
    common.updateBpStatus(project.bpStatusPath, 'find-projects');
  } else {
    console.log(`${project.projectName}: Script ${scriptName} is excluded by bpstatus.json exclude rules, skipping...`);
  }
}

// Generate markdown report
let markdown = common.generateMarkdownHeader('Projects with Best Practices Status');
markdown += common.generateMarkdownTableHeader(['Project Name', 'Project Path']);

for (const project of allProjects) {
  markdown += `| ${project.projectName} | ${project.projectPath} |\n`;
}

// Add summary
const summaryData = {
  'Total projects found': allProjects.length
};
markdown += common.generateMarkdownSummary(summaryData);

// Write to STATUS_PROJECTS.gitignored.md
const outputPath = path.resolve(__dirname, '../STATUS_PROJECTS.gitignored.md');
common.writeMarkdownReport(outputPath, markdown);

console.log(`Found ${allProjects.length} projects with bpstatus.json`);
