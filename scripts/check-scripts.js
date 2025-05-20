#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common');

// Load environment variables and get projects folders
const projectsFolders = common.loadEnvironmentVariables();

// Get the source BP scripts directory
const bpScriptsDir = path.resolve(__dirname, 'bp');

// Read the source package.json to get bp:** scripts
const sourcePackageJsonPath = path.resolve(__dirname, '../package.json');
let bpScripts = {};

try {
    const sourcePackageJson = JSON.parse(fs.readFileSync(sourcePackageJsonPath, 'utf8'));

    // Extract all bp:** scripts
    if (sourcePackageJson.scripts) {
        Object.entries(sourcePackageJson.scripts).forEach(([key, value]) => {
            if (key.startsWith('bp:')) {
                bpScripts[key] = value;
            }
        });
    }

    console.log(`Found ${Object.keys(bpScripts).length} bp:** scripts to add to projects`);
} catch (error) {
    console.error(`Error reading source package.json: ${error.message}`);
    process.exit(1);
}

// Get all BP script files
let bpScriptFiles = [];
try {
    bpScriptFiles = fs.readdirSync(bpScriptsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => ({
            name: file,
            path: path.join(bpScriptsDir, file)
        }));

    console.log(`Found ${bpScriptFiles.length} BP script files to copy`);
} catch (error) {
    console.error(`Error reading BP scripts directory: ${error.message}`);
    process.exit(1);
}

// Parse the comma-separated list of folders
const foldersToSearch = common.parseFoldersToSearch(projectsFolders);

// Function to update a project's bpstatus.json file is now in common.js

// Function to update a project's package.json with bp:** scripts
function updatePackageJsonScripts(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    let scriptsAdded = 0;
    let packageJsonUpdated = false;

    try {
        // Check if package.json exists
        if (!fs.existsSync(packageJsonPath)) {
            console.log(`No package.json found in ${path.basename(projectPath)}`);
            return {
                scriptsAdded: 0,
                packageJsonUpdated: false
            };
        }

        // Read the project's package.json
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);

        // Ensure scripts object exists
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }

        // Add all bp:** scripts
        for (const [key, value] of Object.entries(bpScripts)) {
            packageJson.scripts[key] = value;
            scriptsAdded++;
            packageJsonUpdated = true;
            console.log(`Added ${key} script to ${path.basename(projectPath)}/package.json`);
        }

        // Reorder scripts to move bp:* scripts to the top
        if (packageJson.scripts) {
            const bpScriptEntries = [];
            const otherScriptEntries = [];

            // Separate bp:* scripts from other scripts
            Object.entries(packageJson.scripts).forEach(([key, value]) => {
                if (key.startsWith('bp:')) {
                    bpScriptEntries.push([key, value]);
                } else {
                    otherScriptEntries.push([key, value]);
                }
            });

            // Create a new scripts object with bp:* scripts at the top
            const orderedScripts = {};
            bpScriptEntries.forEach(([key, value]) => {
                orderedScripts[key] = value;
            });
            otherScriptEntries.forEach(([key, value]) => {
                orderedScripts[key] = value;
            });

            packageJson.scripts = orderedScripts;
            packageJsonUpdated = true;
        }

        // Reorder package.json sections to ensure correct order: 1) scripts, 2) dependencies, 3) devDependencies
        const newPackageJson = {};

        // Add all properties except scripts, dependencies, and devDependencies
        Object.entries(packageJson).forEach(([key, value]) => {
            if (key !== 'scripts' && key !== 'dependencies' && key !== 'devDependencies') {
                newPackageJson[key] = value;
            }
        });

        // Add scripts first
        if (packageJson.scripts) {
            newPackageJson.scripts = packageJson.scripts;
        }

        // Add dependencies second
        if (packageJson.dependencies) {
            newPackageJson.dependencies = packageJson.dependencies;
        }

        // Add devDependencies third
        if (packageJson.devDependencies) {
            newPackageJson.devDependencies = packageJson.devDependencies;
        }

        // Replace the original packageJson with the reordered one
        Object.keys(packageJson).forEach(key => {
            delete packageJson[key];
        });
        Object.entries(newPackageJson).forEach(([key, value]) => {
            packageJson[key] = value;
        });

        packageJsonUpdated = true;

        // Write updated package.json if changes were made
        if (packageJsonUpdated) {
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log(`Updated package.json for ${path.basename(projectPath)} with ${scriptsAdded} bp:** scripts`);
        }

        return {
            scriptsAdded,
            packageJsonUpdated
        };
    } catch (error) {
        console.error(`Error updating package.json for ${projectPath}: ${error.message}`);
        return {
            scriptsAdded: 0,
            packageJsonUpdated: false
        };
    }
}

// Function to copy BP scripts to a project's scripts folder
function copyBpScripts(projectPath) {
    const projectScriptsDir = path.join(projectPath, 'scripts');
    const projectBpDir = path.join(projectScriptsDir, 'bp');
    let scriptsCopied = 0;
    let scriptsUpdated = false;

    try {
        // Create scripts and scripts/bp directories if they don't exist
        if (!fs.existsSync(projectScriptsDir)) {
            fs.mkdirSync(projectScriptsDir);
            console.log(`Created scripts directory for ${path.basename(projectPath)}`);
        }

        if (!fs.existsSync(projectBpDir)) {
            fs.mkdirSync(projectBpDir);
            console.log(`Created scripts/bp directory for ${path.basename(projectPath)}`);
        }

        // Copy each BP script file using common.copyFile
        for (const scriptFile of bpScriptFiles) {
            const wasUpdated = common.copyFile(scriptFile.path, projectBpDir, scriptFile.name);
            if (wasUpdated) {
                scriptsCopied++;
                scriptsUpdated = true;
            }
        }

        return {
            scriptsCopied,
            scriptsUpdated
        };
    } catch (error) {
        console.error(`Error copying BP scripts for ${projectPath}: ${error.message}`);
        return {
            scriptsCopied: 0,
            scriptsUpdated: false
        };
    }
}

// Find all projects with bpstatus.json
const allProjects = common.findAllProjects(foldersToSearch);

// Check scripts for each project
const results = [];
for (const project of allProjects) {
    // Check if project has scripts in bpstatus.json status
    const bpStatus = common.readBpStatus(project.bpStatusPath);
    let scriptsUpdated = false;
    let scriptsCopied = 0;
    let packageJsonUpdated = false;
    let scriptsAdded = 0;
    let bpStatusUpdated = false;
    let isExcluded = false;

    // Check if this script is excluded by the exclude rules
    const scriptName = path.basename(__filename, '.js');
    isExcluded = common.isScriptExcluded(bpStatus, scriptName);

    if (isExcluded) {
        console.log(`${project.projectName}: Script ${scriptName} is excluded by bpstatus.json exclude rules, skipping...`);
    } else if (bpStatus.status && bpStatus.status['scripts']) {
        console.log(`${project.projectName} has scripts in bpstatus.json status, processing...`);

        // Copy BP script files
        const copyResult = copyBpScripts(project.projectPath);
        scriptsUpdated = copyResult.scriptsUpdated;
        scriptsCopied = copyResult.scriptsCopied;

        // Update package.json with bp:** scripts
        const updateResult = updatePackageJsonScripts(project.projectPath);
        packageJsonUpdated = updateResult.packageJsonUpdated;
        scriptsAdded = updateResult.scriptsAdded;
    }

    // Only update bpstatus.json if the script is not excluded
    if (!isExcluded) {
      bpStatusUpdated = common.updateBpStatus(project.bpStatusPath, 'check-scripts');
    }

    results.push({
        ...project,
        scriptsEnabled: bpStatus.status && !!bpStatus.status['scripts'],
        isExcluded,
        scriptsUpdated,
        scriptsCopied,
        packageJsonUpdated,
        scriptsAdded,
        bpStatusUpdated
    });

    console.log(`${project.projectName}: scripts enabled = ${bpStatus.status && !!bpStatus.status['scripts'] ? 'true' : 'false'}, files updated = ${scriptsUpdated ? 'true' : 'false'}, files copied = ${scriptsCopied}, package.json updated = ${packageJsonUpdated ? 'true' : 'false'}, scripts added = ${scriptsAdded}, bpstatus updated = ${bpStatusUpdated ? 'true' : 'false'}`);
}

// Generate markdown report
let markdown = common.generateMarkdownHeader('Projects Scripts Status');
markdown += common.generateMarkdownTableHeader(['Project Name', 'Project Path', 'Scripts Enabled', 'Excluded', 'Script Files Updated', 'Script Files Copied', 'Package.json Updated', 'BP Scripts Added', 'bpstatus.json Updated']);

for (const result of results) {
    markdown += `| ${result.projectName} | ${result.projectPath} | ${result.scriptsEnabled ? '✅' : '❌'} | ${result.isExcluded ? '✅' : '❌'} | ${result.scriptsUpdated ? '✅' : '❌'} | ${result.scriptsCopied} | ${result.packageJsonUpdated ? '✅' : '❌'} | ${result.scriptsAdded} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Add summary
const summaryData = {
    'Total projects found': results.length,
    'Projects excluded by rules': results.filter(r => r.isExcluded).length,
    'Projects with scripts enabled': results.filter(r => r.scriptsEnabled).length,
    'Projects with script files updated': results.filter(r => r.scriptsUpdated).length,
    'Total script files copied': results.reduce((sum, r) => sum + r.scriptsCopied, 0),
    'Projects with package.json updated': results.filter(r => r.packageJsonUpdated).length,
    'Total BP scripts added to package.json': results.reduce((sum, r) => sum + r.scriptsAdded, 0),
    'Projects with bpstatus.json updated': results.filter(r => r.bpStatusUpdated).length
};
markdown += common.generateMarkdownSummary(summaryData);

// Write to STATUS_SCRIPTS.gitignored.md
const outputPath = path.resolve(__dirname, '../STATUS_SCRIPTS.gitignored.md');
common.writeMarkdownReport(outputPath, markdown);

console.log(`Checked scripts for ${results.length} projects`);
