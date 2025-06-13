#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const common = require('./common.cjs');

// Get the script name
const scriptName = path.basename(__filename, '.cjs');

/**
 * Determines the project type based on git branches
 * @param {string} projectPath - The path to the project
 * @returns {string} The project type: "app", "package", or "standalone"
 */
function determineProjectType(projectPath) {
    try {
        // Check if the directory is a git repository
        const isGitRepo = fs.existsSync(path.join(projectPath, '.git'));
        if (!isGitRepo) {
            console.log(
                `${path.basename(projectPath)} is not a git repository, defaulting to "standalone"`
            );
            return 'standalone';
        }

        // Get all branches
        const gitCommand = 'git branch -a';
        const branches = execSync(gitCommand, {cwd: projectPath, encoding: 'utf8'})
            .split('\n')
            .map((branch) => branch.trim().replace(/^\*\s+/, '')) // Remove the asterisk from current branch
            .filter((branch) => branch); // Remove empty lines

        // Check for sandbox branch (indicates app)
        const hasSandboxBranch = branches.some(
            (branch) =>
                branch === 'sandbox' ||
                branch === 'remotes/origin/sandbox' ||
                branch.endsWith('/sandbox')
        );

        if (hasSandboxBranch) {
            return 'app';
        }

        // Check for package branch (indicates package)
        const hasPackageBranch = branches.some(
            (branch) =>
                branch === 'package' ||
                branch === 'remotes/origin/package' ||
                branch.endsWith('/package')
        );

        if (hasPackageBranch) {
            return 'package';
        }

        // Default to standalone
        return 'standalone';
    } catch (error) {
        console.error(`Error determining project type for ${projectPath}: ${error.message}`);
        return 'standalone'; // Default to standalone in case of error
    }
}

/**
 * Updates a project's bpstatus.json file with the project type
 * @param {string} bpStatusPath - The path to the bpstatus.json file
 * @param {string} projectType - The project type: "app", "package", or "standalone"
 * @returns {boolean} True if the update was successful, false otherwise
 */
function updateBpStatusWithType(bpStatusPath, projectType) {
    try {
        // Read existing bpstatus.json
        const bpStatus = common.readBpStatus(bpStatusPath);

        // Check if the type has changed
        if (bpStatus.type === projectType) {
            console.log(`Project type unchanged (${projectType}), skipping bpstatus.json update`);
            return false;
        }

        // Add or update the type field
        bpStatus.type = projectType;

        // Write the updated bpstatus.json
        fs.writeFileSync(bpStatusPath, JSON.stringify(bpStatus, null, 2));
        console.log(`Updated bpstatus.json at ${bpStatusPath} with type ${projectType}`);

        return true;
    } catch (error) {
        console.error(`Error updating bpstatus.json at ${bpStatusPath}: ${error.message}`);
        return false;
    }
}

// Define the processor function
function processProject(project, bpStatus) {
    // Determine project type
    const projectType = determineProjectType(project.projectPath);

    // Update bpstatus.json with project type
    const typeUpdated = updateBpStatusWithType(project.bpStatusPath, projectType);

    return {
        projectType,
        typeUpdated,
    };
}

// Define the row generator function
function generateRow(result) {
    return `| ${result.projectName} | ${result.projectPath} | ${result.projectType} | ${result.isExcluded ? '✅' : '❌'} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Define the summary generator function
function generateSummary(results) {
    return {
        'Total projects found': results.length,
        'Projects excluded by rules': results.filter((r) => r.isExcluded).length,
        'App projects': results.filter((r) => r.projectType === 'app').length,
        'Package projects': results.filter((r) => r.projectType === 'package').length,
        'Standalone projects': results.filter((r) => r.projectType === 'standalone').length,
        'Projects with bpstatus.json updated': results.filter((r) => r.bpStatusUpdated).length,
    };
}

// Process all projects
common.processProjects(
    scriptName,
    processProject,
    'Projects Type Status',
    ['Project Name', 'Project Path', 'Project Type', 'Excluded', 'bpstatus.json Updated'],
    generateRow,
    generateSummary,
    path.resolve(__dirname, '../STATUS_PROJECT_TYPES.gitignored.md'),
    true // Skip generating the report
);
