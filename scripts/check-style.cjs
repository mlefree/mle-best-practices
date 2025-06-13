#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const common = require('./common.cjs');
const https = require('https');

// Get the script name
const scriptName = path.basename(__filename, '.cjs');

// Get the source files paths
const sourceDir = path.resolve(__dirname, '..');
const prettierrcPath = path.join(sourceDir, '.prettierrc');
const eslintConfigPath = path.join(sourceDir, 'eslint.config.js');

// Check if source files exist
if (!fs.existsSync(prettierrcPath)) {
    console.error(`Error: Source .prettierrc file not found at ${prettierrcPath}`);
    process.exit(1);
}

if (!fs.existsSync(eslintConfigPath)) {
    console.error(`Error: Source eslint.config.js file not found at ${eslintConfigPath}`);
    process.exit(1);
}

console.log(`Found source files to copy:`);
console.log(`- .prettierrc: ${prettierrcPath}`);
console.log(`- eslint.config.js: ${eslintConfigPath}`);

// List of required devDependencies for ESLint and Prettier
const requiredDevDependencies = [
    'eslint',
    'eslint-config-prettier',
    'eslint-plugin-import',
    'eslint-plugin-prettier',
    'prettier',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser'
];

// Function to get the latest version of a package from npm registry
function getLatestPackageVersion(packageName) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'registry.npmjs.org',
            path: `/${packageName}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const packageInfo = JSON.parse(data);
                    const latestVersion = packageInfo['dist-tags'].latest;
                    resolve(latestVersion);
                } catch (error) {
                    console.error(`Error parsing response for ${packageName}: ${error.message}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Error fetching latest version for ${packageName}: ${error.message}`);
            resolve(null);
        });

        req.end();
    });
}

// Function to check and update devDependencies in package.json
async function checkAndUpdateDevDependencies(projectPath) {
    let depsUpdated = false;
    let depsAdded = 0;

    try {
        // Read package.json
        const packageJson = common.readPackageJson(projectPath);
        if (!packageJson) {
            return {
                depsUpdated: false,
                depsAdded: 0
            };
        }

        // Ensure devDependencies object exists
        if (!packageJson.devDependencies) {
            packageJson.devDependencies = {};
        }

        // Check each required dependency
        for (const dep of requiredDevDependencies) {
            if (!packageJson.devDependencies[dep]) {
                // Get the latest version
                const latestVersion = await getLatestPackageVersion(dep);
                if (latestVersion) {
                    packageJson.devDependencies[dep] = `^${latestVersion}`;
                    depsAdded++;
                    depsUpdated = true;
                    console.log(`Added ${dep}@^${latestVersion} to ${path.basename(projectPath)}/package.json`);
                }
            }
        }

        // Write updated package.json if changes were made
        if (depsUpdated) {
            common.writePackageJson(projectPath, packageJson);
            console.log(`Updated package.json for ${path.basename(projectPath)} with ${depsAdded} dependencies`);
        }

        return {
            depsUpdated,
            depsAdded
        };
    } catch (error) {
        console.error(`Error updating devDependencies for ${projectPath}: ${error.message}`);
        return {
            depsUpdated: false,
            depsAdded: 0
        };
    }
}

// Function to copy style files to a project
function copyStyleFiles(projectPath) {
    let filesUpdated = false;
    let filesCopied = 0;

    try {
        // Copy .prettierrc
        const prettierrcUpdated = common.copyFile(prettierrcPath, projectPath, '.prettierrc');
        if (prettierrcUpdated) {
            filesCopied++;
            filesUpdated = true;
            console.log(`Copied .prettierrc to ${path.basename(projectPath)}`);
        }

        // Copy eslint.config.js
        const eslintConfigUpdated = common.copyFile(eslintConfigPath, projectPath, 'eslint.config.js');
        if (eslintConfigUpdated) {
            filesCopied++;
            filesUpdated = true;
            console.log(`Copied eslint.config.js to ${path.basename(projectPath)}`);
        }

        return {
            filesUpdated,
            filesCopied
        };
    } catch (error) {
        console.error(`Error copying style files for ${projectPath}: ${error.message}`);
        return {
            filesUpdated: false,
            filesCopied: 0
        };
    }
}


// Define the row generator function
function generateRow(result) {
    return `| ${result.projectName} | ${result.projectPath} | ${result.isExcluded ? '✅' : '❌'} | ${result.filesUpdated ? '✅' : '❌'} | ${result.filesCopied} | ${result.depsUpdated ? '✅' : '❌'} | ${result.depsAdded} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Define the summary generator function
function generateSummary(results) {
    return {
        'Total projects found': results.length,
        'Projects excluded by rules': results.filter(r => r.isExcluded).length,
        'Projects with style files updated': results.filter(r => r.filesUpdated).length,
        'Total style files copied': results.reduce((sum, r) => sum + r.filesCopied, 0),
        'Projects with dependencies updated': results.filter(r => r.depsUpdated).length,
        'Total dependencies added': results.reduce((sum, r) => sum + (r.depsAdded || 0), 0),
        'Projects with bpstatus.json updated': results.filter(r => r.bpStatusUpdated).length
    };
}

// Create a wrapper function to handle async operations
async function main() {
    try {
        // Create a synchronous wrapper for the async processProject function
        function processProjectSync(project, bpStatus) {
            // Initialize with default values
            const result = {
                filesUpdated: false,
                filesCopied: 0,
                depsUpdated: false,
                depsAdded: 0
            };

            // Copy style files (this is synchronous)
            const copyResult = copyStyleFiles(project.projectPath);
            result.filesUpdated = copyResult.filesUpdated;
            result.filesCopied = copyResult.filesCopied;

            // For dependencies, we'll just return the initial result
            // and update the dependencies in a separate step
            return result;
        }

        // Process all projects with the synchronous wrapper
        const results = common.processProjects(
            scriptName,
            processProjectSync,
            'Projects Style Files Status',
            ['Project Name', 'Project Path', 'Excluded', 'Style Files Updated', 'Style Files Copied', 'Dependencies Updated', 'Dependencies Added', 'bpstatus.json Updated'],
            generateRow,
            generateSummary,
            path.resolve(__dirname, '../STATUS_STYLE.gitignored.md'),
            true // Skip generating the report
        );

        // Now process dependencies asynchronously
        console.log('Checking and updating dependencies...');
        for (const result of results) {
            if (!result.isExcluded) {
                // Check and update devDependencies
                const depsResult = await checkAndUpdateDevDependencies(result.projectPath);
                result.depsUpdated = depsResult.depsUpdated;
                result.depsAdded = depsResult.depsAdded;

                // Update filesUpdated to include depsUpdated
                result.filesUpdated = result.filesUpdated || result.depsUpdated;

                // Update bpstatus.json if dependencies were updated
                if (result.depsUpdated && !result.bpStatusUpdated) {
                    result.bpStatusUpdated = common.updateBpStatus(result.bpStatusPath, scriptName);
                }
            }
        }

        console.log('All projects processed successfully.');
    } catch (error) {
        console.error(`Error processing projects: ${error.message}`);
        process.exit(1);
    }
}

// Run the main function
main();
