#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common');

// Load environment variables and get projects folders
const projectsFolders = common.loadEnvironmentVariables();

// Parse the comma-separated list of folders
const foldersToSearch = common.parseFoldersToSearch(projectsFolders);

/**
 * Removes specific release scripts from package.json based on project type
 * @param {string} projectPath - The path to the project
 * @param {string} projectType - The project type: "app", "package", or "standalone"
 * @returns {Object} Object containing information about the update
 */
function cleanReleaseScripts(projectPath, projectType) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    let scriptsRemoved = [];
    let packageJsonUpdated = false;

    try {
        // Check if package.json exists
        if (!fs.existsSync(packageJsonPath)) {
            console.log(`No package.json found in ${path.basename(projectPath)}`);
            return {
                scriptsRemoved,
                packageJsonUpdated
            };
        }

        // Read the project's package.json
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);

        // Check if scripts object exists
        if (!packageJson.scripts) {
            console.log(`No scripts found in ${path.basename(projectPath)}/package.json`);
            return {
                scriptsRemoved,
                packageJsonUpdated
            };
        }

        // Remove scripts based on project type
        if (projectType === 'package') {
            // For package type, remove bp:main:sandbox
            if (packageJson.scripts['bp:main:sandbox']) {
                delete packageJson.scripts['bp:main:sandbox'];
                scriptsRemoved.push('bp:main:sandbox');
                packageJsonUpdated = true;
            }
        } else if (projectType === 'app') {
            // For app type, remove bp:main:package
            if (packageJson.scripts['bp:main:package']) {
                delete packageJson.scripts['bp:main:package'];
                scriptsRemoved.push('bp:main:package');
                packageJsonUpdated = true;
            }
        } else if (projectType === 'standalone') {
            // For standalone or reference type, remove both bp:main:sandbox and bp:main:package
            if (packageJson.scripts['bp:main:sandbox']) {
                delete packageJson.scripts['bp:main:sandbox'];
                scriptsRemoved.push('bp:main:sandbox');
                packageJsonUpdated = true;
            }
            if (packageJson.scripts['bp:main:package']) {
                delete packageJson.scripts['bp:main:package'];
                scriptsRemoved.push('bp:main:package');
                packageJsonUpdated = true;
            }
        }

        // Write updated package.json if changes were made
        if (packageJsonUpdated) {
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log(`Updated package.json for ${path.basename(projectPath)}, removed scripts: ${scriptsRemoved.join(', ')}`);
        } else {
            console.log(`No scripts needed to be removed from ${path.basename(projectPath)}/package.json`);
        }

        return {
            scriptsRemoved,
            packageJsonUpdated
        };
    } catch (error) {
        console.error(`Error updating package.json for ${projectPath}: ${error.message}`);
        return {
            scriptsRemoved,
            packageJsonUpdated: false
        };
    }
}

// Find all projects with bpstatus.json
const allProjects = common.findAllProjects(foldersToSearch);

// Clean release scripts for each project
const results = [];
for (const project of allProjects) {
    // Read project type from bpstatus.json
    const bpStatus = common.readBpStatus(project.bpStatusPath);
    const projectType = bpStatus.type || 'standalone'; // Default to standalone if type is not set

    // Check if this script is excluded by the exclude rules
    const scriptName = path.basename(__filename, '.js');
    const isExcluded = common.isScriptExcluded(bpStatus, scriptName);

    let scriptsRemoved = [];
    let packageJsonUpdated = false;

    if (isExcluded) {
        console.log(`${project.projectName}: Script ${scriptName} is excluded by bpstatus.json exclude rules, skipping...`);
    } else {
        // Clean release scripts based on project type
        const cleanResult = cleanReleaseScripts(project.projectPath, projectType);
        scriptsRemoved = cleanResult.scriptsRemoved;
        packageJsonUpdated = cleanResult.packageJsonUpdated;
    }

    // Only update bpstatus.json if the script is not excluded
    if (!isExcluded) {
        common.updateBpStatus(project.bpStatusPath, 'clean-release-scripts');
    }

    results.push({
        ...project,
        projectType,
        isExcluded,
        scriptsRemoved,
        packageJsonUpdated
    });

    console.log(`${project.projectName}: project type = ${projectType}, excluded = ${isExcluded ? 'true' : 'false'}, scripts removed = ${scriptsRemoved.length > 0 ? scriptsRemoved.join(', ') : 'None'}, package.json updated = ${packageJsonUpdated ? 'true' : 'false'}`);
}

// Generate markdown report
let markdown = common.generateMarkdownHeader('Release Scripts Cleanup Status');
markdown += common.generateMarkdownTableHeader(['Project Name', 'Project Path', 'Project Type', 'Excluded', 'Scripts Removed', 'package.json Updated']);

for (const result of results) {
    markdown += `| ${result.projectName} | ${result.projectPath} | ${result.projectType} | ${result.isExcluded ? '✅' : '❌'} | ${result.scriptsRemoved.length > 0 ? result.scriptsRemoved.join(', ') : 'None'} | ${result.packageJsonUpdated ? '✅' : '❌'} |\n`;
}

// Add summary
const summaryData = {
    'Total projects found': results.length,
    'Projects excluded by rules': results.filter(r => r.isExcluded).length,
    'App projects': results.filter(r => r.projectType === 'app').length,
    'Package projects': results.filter(r => r.projectType === 'package').length,
    'Standalone projects': results.filter(r => r.projectType === 'standalone').length,
    'Projects with scripts removed': results.filter(r => r.scriptsRemoved.length > 0).length,
    'Total scripts removed': results.reduce((sum, r) => sum + r.scriptsRemoved.length, 0)
};
markdown += common.generateMarkdownSummary(summaryData);

// Write to STATUS_RELEASE_SCRIPTS.gitignored.md
const outputPath = path.resolve(__dirname, '../STATUS_RELEASE_SCRIPTS.gitignored.md');
common.writeMarkdownReport(outputPath, markdown);

console.log(`Cleaned release scripts for ${results.length} projects`);
