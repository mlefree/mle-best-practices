#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common');

// Load environment variables and get projects folders
const projectsFolders = common.loadEnvironmentVariables();

// Read the reference .gitignore file from this project
const referenceGitignorePath = path.resolve(__dirname, '../.gitignore');
let referenceGitignoreLines = [];

try {
    const referenceGitignoreContent = fs.readFileSync(referenceGitignorePath, 'utf8');
    // Split by lines, trim each line, and filter out empty lines
    referenceGitignoreLines = referenceGitignoreContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    console.log(`Loaded reference .gitignore with ${referenceGitignoreLines.length} lines`);
} catch (error) {
    console.error(`Error reading reference .gitignore file: ${error.message}`);
    process.exit(1);
}

// Parse the comma-separated list of folders
const foldersToSearch = common.parseFoldersToSearch(projectsFolders);

// Function to check if a project's .gitignore matches the reference
function checkGitignore(projectPath) {
    const gitignorePath = path.join(projectPath, '.gitignore');

    // If .gitignore doesn't exist, return false
    if (!fs.existsSync(gitignorePath)) {
        return false;
    }

    try {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        // Split by lines, trim each line, and filter out empty lines
        const gitignoreLines = gitignoreContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Check if all reference lines are in the project's .gitignore
        const hasAllLines = referenceGitignoreLines.every(line =>
            gitignoreLines.includes(line)
        );

        return hasAllLines;
    } catch (error) {
        console.error(`Error reading .gitignore for ${projectPath}: ${error.message}`);
        return false;
    }
}

// Function to update a project's bpstatus.json file is now in common.js

// Function to update a project's .gitignore file with reference lines
function updateGitignore(projectPath) {
    const gitignorePath = path.join(projectPath, '.gitignore');
    let gitignoreLines = [];
    let gitignoreUpdated = false;

    try {
        // Read existing .gitignore if it exists
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            gitignoreLines = gitignoreContent.split('\n');
        }

        // Check which reference lines are missing
        const missingLines = [];
        for (const line of referenceGitignoreLines) {
            if (!gitignoreLines.some(existingLine => existingLine.trim() === line)) {
                missingLines.push(line);
            }
        }

        // If there are missing lines, add them to the .gitignore
        if (missingLines.length > 0) {
            // Add a blank line if the file doesn't end with one
            if (gitignoreLines.length > 0 && gitignoreLines[gitignoreLines.length - 1] !== '') {
                gitignoreLines.push('');
            }

            // Add a comment to indicate the added lines
            gitignoreLines.push('# Added by mle-best-practices');

            // Add the missing lines
            for (const line of missingLines) {
                gitignoreLines.push(line);
            }

            // Write the updated .gitignore
            fs.writeFileSync(gitignorePath, gitignoreLines.join('\n'));
            gitignoreUpdated = true;
            console.log(`Updated .gitignore for ${path.basename(projectPath)} with ${missingLines.length} missing lines`);
        } else {
            console.log(`No missing lines in .gitignore for ${path.basename(projectPath)}`);
        }

        return gitignoreUpdated;
    } catch (error) {
        console.error(`Error updating .gitignore for ${projectPath}: ${error.message}`);
        return false;
    }
}

// Find all projects with bpstatus.json
const allProjects = common.findAllProjects(foldersToSearch);

// Check .gitignore for each project and update bpstatus.json
const results = [];
for (const project of allProjects) {
    // Check if project has .gitignore in bpstatus.json status
    const bpStatus = common.readBpStatus(project.bpStatusPath);

    // Check if this script is excluded by the exclude rules
    const scriptName = path.basename(__filename, '.js');
    const isExcluded = common.isScriptExcluded(bpStatus, scriptName);

    let gitignoreStatus = false;
    let gitignoreUpdated = false;
    let bpStatusUpdated = false;

    if (isExcluded) {
        console.log(`${project.projectName}: Script ${scriptName} is excluded by bpstatus.json exclude rules, skipping...`);
    } else {
        gitignoreStatus = checkGitignore(project.projectPath);
        gitignoreUpdated = updateGitignore(project.projectPath);
    }

    // Only update bpstatus.json if the script is not excluded
    if (!isExcluded) {
        bpStatusUpdated = common.updateBpStatus(project.bpStatusPath, 'check-gitignore');
    }

    results.push({
        ...project,
        gitignoreStatus,
        isExcluded,
        gitignoreUpdated,
        bpStatusUpdated
    });

    console.log(`${project.projectName}: .gitignore status = ${gitignoreStatus ? 'true' : 'false'}, excluded = ${isExcluded ? 'true' : 'false'}, updated = ${gitignoreUpdated ? 'true' : 'false'}, bpstatus updated = ${bpStatusUpdated ? 'true' : 'false'}`);
}

// Generate markdown report
let markdown = common.generateMarkdownHeader('Projects .gitignore Status');
markdown += common.generateMarkdownTableHeader(['Project Name', 'Project Path', '.gitignore Status', 'Excluded', '.gitignore Updated', 'bpstatus.json Updated']);

for (const result of results) {
    markdown += `| ${result.projectName} | ${result.projectPath} | ${result.gitignoreStatus ? '✅' : '❌'} | ${result.isExcluded ? '✅' : '❌'} | ${result.gitignoreUpdated ? '✅' : '❌'} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Add summary
const summaryData = {
    'Total projects found': results.length,
    'Projects excluded by rules': results.filter(r => r.isExcluded).length,
    'Projects with matching .gitignore': results.filter(r => r.gitignoreStatus).length,
    'Projects with non-matching .gitignore': results.filter(r => !r.gitignoreStatus && !r.isExcluded).length,
    'Projects with .gitignore updated': results.filter(r => r.gitignoreUpdated).length,
    'Projects with bpstatus.json updated': results.filter(r => r.bpStatusUpdated).length
};
markdown += common.generateMarkdownSummary(summaryData);

// Write to STATUS_GITIGNORE.gitignored.md
const outputPath = path.resolve(__dirname, '../STATUS_GITIGNORE.gitignored.md');
common.writeMarkdownReport(outputPath, markdown);

console.log(`Checked .gitignore for ${results.length} projects`);
