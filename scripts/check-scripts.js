#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common');

// Get the script name
const scriptName = path.basename(__filename, '.js');

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

        // Check if any bp:* scripts need to be updated
        let scriptsChanged = false;

        // Check if any existing bp:* scripts are different from the ones we want to add
        Object.keys(packageJson.scripts).forEach(key => {
            if (key.startsWith('bp:')) {
                if (bpScripts[key] !== packageJson.scripts[key]) {
                    delete packageJson.scripts[key];
                    scriptsChanged = true;
                    packageJsonUpdated = true;
                    console.log(`Removed old ${key} script from ${path.basename(projectPath)}/package.json`);
                }
            }
        });

        // Add any missing bp:** scripts
        for (const [key, value] of Object.entries(bpScripts)) {
            if (!packageJson.scripts[key] || packageJson.scripts[key] !== value) {
                packageJson.scripts[key] = value;
                scriptsAdded++;
                scriptsChanged = true;
                packageJsonUpdated = true;
                console.log(`Added ${key} script to ${path.basename(projectPath)}/package.json`);
            }
        }

        // If no scripts were changed, log it
        if (!scriptsChanged) {
            console.log(`No changes needed for bp:* scripts in ${path.basename(projectPath)}/package.json`);
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
            // Reordering scripts doesn't count as a change that requires bpstatus.json update
        }

        // Reorder package.json sections to ensure correct order: 1) scripts, 2) dependencies, 3) devDependencies
        // but don't count this as a change that requires bpstatus.json update
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

        // packageJsonUpdated is already set based on actual changes

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

/**
 * Removes specific release scripts from package.json based on project type
 * @param {string} projectPath - The path to the project
 * @param {string} projectType - The project type: "app", "package", or "standalone"
 * @returns {Object} Object containing information about the update
 */
function cleanReleaseScripts(projectPath, projectType) {
    let scriptsRemoved = [];
    let packageJsonUpdated = false;

    // Read the project's package.json
    const packageJson = common.readPackageJson(projectPath);
    if (!packageJson) {
        return {
            scriptsRemoved,
            packageJsonUpdated
        };
    }

    // Check if scripts object exists
    if (!packageJson.scripts) {
        console.log(`No scripts found in ${path.basename(projectPath)}/package.json`);
        return {
            scriptsRemoved,
            packageJsonUpdated
        };
    }

    // Check if project has any package.*.json files
    const hasPackageVariants = fs.readdirSync(projectPath)
        .some(file => file.match(/^package\.[^.]+\.json$/));

    // If no package.*.json files found, remove bp:use-*-deps scripts
    if (!hasPackageVariants) {
        Object.keys(packageJson.scripts).forEach(scriptName => {
            if (scriptName.match(/^bp:use-.*-deps$/)) {
                delete packageJson.scripts[scriptName];
                scriptsRemoved.push(scriptName);
                packageJsonUpdated = true;
            }
        });
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
        common.writePackageJson(projectPath, packageJson);
        console.log(`Updated package.json for ${path.basename(projectPath)}, removed scripts: ${scriptsRemoved.join(', ')}`);
    } else {
        console.log(`No scripts needed to be removed from ${path.basename(projectPath)}/package.json`);
    }

    return {
        scriptsRemoved,
        packageJsonUpdated
    };
}

// Define the processor function
function processProject(project, bpStatus) {
    // Copy BP script files
    const copyResult = copyBpScripts(project.projectPath);
    const scriptsUpdated = copyResult.scriptsUpdated;
    const scriptsCopied = copyResult.scriptsCopied;

    // Update package.json with bp:** scripts
    const updateResult = updatePackageJsonScripts(project.projectPath);
    const scriptsAdded = updateResult.scriptsAdded;

    // Clean useless scripts based on project type
    const projectType = bpStatus.type || 'standalone';
    const cleanResult = cleanReleaseScripts(project.projectPath, projectType);
    const scriptsRemoved = cleanResult.scriptsRemoved;

    let finalPackageJsonUpdated = scriptsAdded - scriptsRemoved;

    return {
        scriptsUpdated,
        scriptsCopied,
        packageJsonUpdated: finalPackageJsonUpdated,
        scriptsAdded,
        scriptsRemoved
    };
}

// Define the row generator function
function generateRow(result) {
    return `| ${result.projectName} | ${result.projectPath} | ${result.isExcluded ? '✅' : '❌'} | ${result.scriptsUpdated ? '✅' : '❌'} | ${result.scriptsCopied} | ${result.packageJsonUpdated ? '✅' : '❌'} | ${result.scriptsAdded} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Define the summary generator function
function generateSummary(results) {
    return {
        'Total projects found': results.length,
        'Projects excluded by rules': results.filter(r => r.isExcluded).length,
        'Projects with script files updated': results.filter(r => r.scriptsUpdated).length,
        'Total script files copied': results.reduce((sum, r) => sum + r.scriptsCopied, 0),
        'Projects with package.json updated': results.filter(r => r.packageJsonUpdated).length,
        'Total BP scripts added to package.json': results.reduce((sum, r) => sum + r.scriptsAdded, 0),
        'Total BP scripts removed from package.json': results.reduce((sum, r) => sum + (r.scriptsRemoved ? r.scriptsRemoved.length : 0), 0),
        'Projects with bpstatus.json updated': results.filter(r => r.bpStatusUpdated).length
    };
}

// Process all projects
common.processProjects(
    scriptName,
    processProject,
    'Projects Scripts Status',
    ['Project Name', 'Project Path', 'Excluded', 'Script Files Updated', 'Script Files Copied', 'Package.json Updated', 'BP Scripts Added', 'bpstatus.json Updated'],
    generateRow,
    generateSummary,
    path.resolve(__dirname, '../STATUS_SCRIPTS.gitignored.md')
);
