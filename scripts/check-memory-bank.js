#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common');

// Load environment variables and get projects folders
const projectsFolders = common.loadEnvironmentVariables();

// Get the source memory-bank-rules.md file
const memoryBankRulesPath = path.resolve(__dirname, '../.memory-bank/memory-bank-rules.md');

// Check if the memory-bank-rules.md file exists
if (!fs.existsSync(memoryBankRulesPath)) {
    console.error('Error: memory-bank-rules.md file not found at', memoryBankRulesPath);
    process.exit(1);
}

// Read the memory-bank-rules.md file
let memoryBankRulesContent;
try {
    memoryBankRulesContent = fs.readFileSync(memoryBankRulesPath, 'utf8');
    console.log('Successfully loaded memory-bank-rules.md');
} catch (error) {
    console.error(`Error reading memory-bank-rules.md: ${error.message}`);
    process.exit(1);
}

// Parse the comma-separated list of folders
const foldersToSearch = common.parseFoldersToSearch(projectsFolders);

// Function to update a project's bpstatus.json file is now in common.js

// Function to copy memory-bank-rules.md to a project's .memory-bank folder
function copyMemoryBankRules(projectPath) {
    const projectMemoryBankDir = path.join(projectPath, '.memory-bank');
    return common.copyFile(memoryBankRulesPath, projectMemoryBankDir, 'memory-bank-rules.md');
}

// Find all projects with bpstatus.json
const allProjects = common.findAllProjects(foldersToSearch);

// Check memory-bank for each project
const results = [];
for (const project of allProjects) {
    // Check if project has .memory-bank in bpstatus.json status
    const bpStatus = common.readBpStatus(project.bpStatusPath);

    // Check if this script is excluded by the exclude rules
    const scriptName = path.basename(__filename, '.js');
    const isExcluded = common.isScriptExcluded(bpStatus, scriptName);

    let rulesUpdated = false;
    let bpStatusUpdated = false;

    if (isExcluded) {
        console.log(`${project.projectName}: Script ${scriptName} is excluded by bpstatus.json exclude rules, skipping...`);
    } else {
        rulesUpdated = copyMemoryBankRules(project.projectPath);
    }

    // Only update bpstatus.json if the script is not excluded
    if (!isExcluded) {
        bpStatusUpdated = common.updateBpStatus(project.bpStatusPath, 'check-memory-bank');
    }

    results.push({
        ...project,
        memoryBankEnabled: bpStatus.status && !!bpStatus.status['.memory-bank'],
        isExcluded,
        rulesUpdated,
        bpStatusUpdated
    });

    console.log(`${project.projectName}: memory-bank enabled = ${bpStatus.status && !!bpStatus.status['.memory-bank'] ? 'true' : 'false'}, excluded = ${isExcluded ? 'true' : 'false'}, updated = ${rulesUpdated ? 'true' : 'false'}, bpstatus updated = ${bpStatusUpdated ? 'true' : 'false'}`);
}

// Generate markdown report
let markdown = common.generateMarkdownHeader('Projects Memory Bank Status');
markdown += common.generateMarkdownTableHeader(['Project Name', 'Project Path', 'Memory Bank Enabled', 'Excluded', 'Rules Updated', 'bpstatus.json Updated']);

for (const result of results) {
    markdown += `| ${result.projectName} | ${result.projectPath} | ${result.memoryBankEnabled ? '✅' : '❌'} | ${result.isExcluded ? '✅' : '❌'} | ${result.rulesUpdated ? '✅' : '❌'} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Add summary
const summaryData = {
    'Total projects found': results.length,
    'Projects with memory-bank enabled': results.filter(r => r.memoryBankEnabled).length,
    'Projects with rules updated': results.filter(r => r.rulesUpdated).length,
    'Projects with bpstatus.json updated': results.filter(r => r.bpStatusUpdated).length
};
markdown += common.generateMarkdownSummary(summaryData);

// Write to STATUS_MEMORY_BANK.gitignored.md
const outputPath = path.resolve(__dirname, '../STATUS_MEMORY_BANK.gitignored.md');
common.writeMarkdownReport(outputPath, markdown);

console.log(`Checked memory-bank for ${results.length} projects`);
