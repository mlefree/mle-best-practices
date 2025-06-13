#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common.cjs');

// Get the script name
const scriptName = path.basename(__filename, '.cjs');

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

// Function to copy memory-bank-rules.md to a project's .memory-bank folder
function copyMemoryBankRules(projectPath) {
    const projectMemoryBankDir = path.join(projectPath, '.memory-bank');
    return common.copyFile(memoryBankRulesPath, projectMemoryBankDir, 'memory-bank-rules.md');
}

// Define the processor function
function processProject(project, bpStatus) {
    const rulesUpdated = copyMemoryBankRules(project.projectPath);
    const memoryBankEnabled = bpStatus.status && !!bpStatus.status['.memory-bank'];

    return {
        memoryBankEnabled,
        rulesUpdated,
    };
}

// Define the row generator function
function generateRow(result) {
    return `| ${result.projectName} | ${result.projectPath} | ${result.memoryBankEnabled ? '✅' : '❌'} | ${result.isExcluded ? '✅' : '❌'} | ${result.rulesUpdated ? '✅' : '❌'} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Define the summary generator function
function generateSummary(results) {
    return {
        'Total projects found': results.length,
        'Projects with memory-bank enabled': results.filter((r) => r.memoryBankEnabled).length,
        'Projects with rules updated': results.filter((r) => r.rulesUpdated).length,
        'Projects with bpstatus.json updated': results.filter((r) => r.bpStatusUpdated).length,
    };
}

// Process all projects
common.processProjects(
    scriptName,
    processProject,
    'Projects Memory Bank Status',
    [
        'Project Name',
        'Project Path',
        'Memory Bank Enabled',
        'Excluded',
        'Rules Updated',
        'bpstatus.json Updated',
    ],
    generateRow,
    generateSummary,
    path.resolve(__dirname, '../STATUS_MEMORY_BANK.gitignored.md'),
    true // Skip generating the report
);
