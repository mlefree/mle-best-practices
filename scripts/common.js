#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Formats the current date as YYYY-MM-DD HH:MM
 * @returns {string} The formatted date
 */
function formatDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Updates a project's bpstatus.json file with a new version and date for the specified status field
 * @param {string} bpStatusPath - The path to the bpstatus.json file
 * @param {string} statusField - The status field to update (e.g., '.gitignore', 'scripts', '.memory-bank')
 * @returns {boolean} True if the update was successful, false otherwise
 */
function updateBpStatus(bpStatusPath, statusField) {
    try {
        // Read existing bpstatus.json
        const bpStatus = readBpStatus(bpStatusPath);

        // Read package.json to get the current version
        const packageJsonPath = path.resolve(__dirname, '../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const currentVersion = packageJson.version;

        // Update version to the current package.json version
        bpStatus.version = currentVersion;

        // Update status field date to current system date
        if (!bpStatus.status) {
            bpStatus.status = {};
        }

        // Format date as YYYY-MM-DD HH:MM
        const formattedDate = formatDate();

        bpStatus.status[statusField] = formattedDate;

        // Write the updated bpstatus.json
        fs.writeFileSync(bpStatusPath, JSON.stringify(bpStatus, null, 2));
        console.log(`Updated bpstatus.json at ${bpStatusPath} with version ${currentVersion} and ${statusField} date ${formattedDate}`);

        return true;
    } catch (error) {
        console.error(`Error updating bpstatus.json at ${bpStatusPath}: ${error.message}`);
        return false;
    }
}

/**
 * Copies a file from source to destination, creating the destination directory if it doesn't exist
 * @param {string} sourcePath - The path to the source file
 * @param {string} destDir - The destination directory
 * @param {string} destFileName - The name of the destination file
 * @returns {boolean} True if the file was copied, false otherwise
 */
function copyFile(sourcePath, destDir, destFileName) {
    try {
        // Create destination directory if it doesn't exist
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, {recursive: true});
            console.log(`Created directory ${destDir}`);
        }

        // Destination path for the file
        const destPath = path.join(destDir, destFileName);

        // Read the source file
        const sourceContent = fs.readFileSync(sourcePath, 'utf8');

        // Check if the file exists and if it's different
        let needsUpdate = true;
        if (fs.existsSync(destPath)) {
            const destContent = fs.readFileSync(destPath, 'utf8');
            if (sourceContent === destContent) {
                needsUpdate = false;
            }
        }

        // Copy the file if it doesn't exist or is different
        if (needsUpdate) {
            fs.writeFileSync(destPath, sourceContent);
            console.log(`Copied ${destFileName} to ${destDir}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`Error copying file ${sourcePath} to ${destDir}/${destFileName}: ${error.message}`);
        return false;
    }
}

/**
 * Loads environment variables from .env file
 * @returns {string|null} The PROJECTS_FOLDERS environment variable or null if not defined
 */
function loadEnvironmentVariables() {
    // Load environment variables from .env file
    dotenv.config({path: path.resolve(__dirname, '../.env')});

    // Get the PROJECTS_FOLDERS from environment variables
    const projectsFolders = process.env.PROJECTS_FOLDERS;

    if (!projectsFolders) {
        console.error('Error: PROJECTS_FOLDERS environment variable is not defined in .env file');
        console.log('Please add PROJECTS_FOLDERS to your .env file with comma-separated paths to search');
        console.log('Example: PROJECTS_FOLDERS=/path/to/projects1,/path/to/projects2');
        process.exit(1);
    }

    return projectsFolders;
}

/**
 * Parses the comma-separated list of folders
 * @param {string} projectsFolders - The comma-separated list of folders
 * @returns {string[]} An array of folder paths
 */
function parseFoldersToSearch(projectsFolders) {
    return projectsFolders.split(',').map(folder => folder.trim());
}

/**
 * Recursively finds all bpstatus.json files in a directory
 * @param {string} directory - The directory to search in
 * @returns {Array<Object>} An array of objects with projectPath, projectName, and bpStatusPath
 */
function findBpStatusFiles(directory) {
    let results = [];

    try {
        const items = fs.readdirSync(directory);

        for (const item of items) {
            const itemPath = path.join(directory, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // Skip node_modules and hidden directories
                if (item === 'node_modules' || item.startsWith('.')) {
                    continue;
                }

                // Check if this directory contains bpstatus.json
                const bpStatusPath = path.join(itemPath, 'bpstatus.json');
                if (fs.existsSync(bpStatusPath)) {
                    results.push({
                        projectPath: itemPath,
                        projectName: path.basename(itemPath),
                        bpStatusPath: bpStatusPath
                    });
                }

                // Recursively search subdirectories
                results = results.concat(findBpStatusFiles(itemPath));
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${directory}: ${error.message}`);
    }

    return results;
}

/**
 * Reads a project's bpstatus.json file
 * @param {string} bpStatusPath - The path to the bpstatus.json file
 * @returns {Object} The parsed bpstatus.json content or an empty object if an error occurs
 */
function readBpStatus(bpStatusPath) {
    try {
        if (fs.existsSync(bpStatusPath)) {
            const bpStatusContent = fs.readFileSync(bpStatusPath, 'utf8');
            try {
                const bpStatus = JSON.parse(bpStatusContent);
                return bpStatus;
            } catch (parseError) {
                console.error(`Error parsing bpstatus.json at ${bpStatusPath}: ${parseError.message}`);
                return {};
            }
        }
        return {};
    } catch (error) {
        console.error(`Error reading bpstatus.json at ${bpStatusPath}: ${error.message}`);
        return {};
    }
}

/**
 * Finds all projects with bpstatus.json in the specified folders
 * @param {string[]} foldersToSearch - An array of folder paths to search in
 * @returns {Array<Object>} An array of project objects
 */
function findAllProjects(foldersToSearch) {
    let allProjects = [];
    for (const folder of foldersToSearch) {
        if (fs.existsSync(folder)) {
            console.log(`Searching in ${folder}...`);
            const projects = findBpStatusFiles(folder);
            allProjects = allProjects.concat(projects);
        } else {
            console.warn(`Warning: Directory ${folder} does not exist`);
        }
    }

    // Sort projects by name
    allProjects.sort((a, b) => a.projectName.localeCompare(b.projectName));

    return allProjects;
}

/**
 * Generates a markdown report header
 * @param {string} title - The title of the report
 * @returns {string} The markdown header
 */
function generateMarkdownHeader(title) {
    let markdown = `# ${title}\n\n`;
    markdown += 'This file is automatically generated. Do not edit manually.\n\n';
    return markdown;
}

/**
 * Generates a markdown table header
 * @param {string[]} columns - The column names
 * @returns {string} The markdown table header
 */
function generateMarkdownTableHeader(columns) {
    let header = '|';
    let separator = '|';

    for (const column of columns) {
        header += ` ${column} |`;
        separator += '-------------|';
    }

    return header + '\n' + separator + '\n';
}

/**
 * Writes a markdown report to a file
 * @param {string} outputPath - The path to write the file to
 * @param {string} markdown - The markdown content
 */
function writeMarkdownReport(outputPath, markdown) {
    fs.writeFileSync(outputPath, markdown);
    console.log(`Results saved to ${outputPath}`);
}

/**
 * Generates a summary section for the markdown report
 * @param {Object} summaryData - An object containing summary data
 * @returns {string} The markdown summary section
 */
function generateMarkdownSummary(summaryData) {
    let summary = `\n## Summary\n\n`;

    for (const [key, value] of Object.entries(summaryData)) {
        summary += `${key}: ${value}\n`;
    }

    summary += `Last updated: ${new Date().toISOString()}\n`;

    return summary;
}

/**
 * Checks if a script is excluded based on the exclude rules in bpstatus.json
 * @param {Object} bpStatus - The parsed bpstatus.json content
 * @param {string} scriptName - The name of the script (without path or extension)
 * @returns {boolean} True if the script is excluded, false otherwise
 */
function isScriptExcluded(bpStatus, scriptName) {
    // If exclude array doesn't exist or is empty, script is not excluded
    if (!bpStatus.exclude || !Array.isArray(bpStatus.exclude) || bpStatus.exclude.length === 0) {
        return false;
    }

    // Check if any exclude rule matches the script name
    return bpStatus.exclude.some(rule => {
        // If rule is a direct match to the script name
        if (rule === scriptName) {
            return true;
        }

        // If rule ends with * (wildcard), check if script name starts with the rule without *
        if (rule.endsWith('*')) {
            const prefix = rule.slice(0, -1); // Remove the * from the end
            return scriptName.startsWith(prefix);
        }

        // If rule starts with * (wildcard), check if script name ends with the rule without *
        if (rule.startsWith('*')) {
            const suffix = rule.slice(1); // Remove the * from the beginning
            return scriptName.endsWith(suffix);
        }

        return false;
    });
}

/**
 * Reads and parses a project's package.json file
 * @param {string} projectPath - The path to the project
 * @returns {Object|null} The parsed package.json content or null if an error occurs
 */
function readPackageJson(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
        // Check if package.json exists
        if (!fs.existsSync(packageJsonPath)) {
            console.log(`No package.json found in ${path.basename(projectPath)}`);
            return null;
        }

        // Read and parse package.json
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        return JSON.parse(packageJsonContent);
    } catch (error) {
        console.error(`Error reading package.json for ${projectPath}: ${error.message}`);
        return null;
    }
}

/**
 * Writes a package.json object to a file
 * @param {string} projectPath - The path to the project
 * @param {Object} packageJson - The package.json object to write
 * @returns {boolean} True if the write was successful, false otherwise
 */
function writePackageJson(projectPath, packageJson) {
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing package.json for ${projectPath}: ${error.message}`);
        return false;
    }
}

/**
 * Processes all projects with a given processor function and generates a markdown report
 * @param {string} scriptName - The name of the script (without path or extension)
 * @param {Function} processorFn - The function to process each project
 * @param {string} reportTitle - The title for the markdown report
 * @param {string[]} tableColumns - The column names for the markdown table
 * @param {Function} rowGeneratorFn - The function to generate a table row for each result
 * @param {Function} summaryGeneratorFn - The function to generate summary data
 * @param {string} outputPath - The path to write the markdown report to
 */
function processProjects(scriptName, processorFn, reportTitle, tableColumns, rowGeneratorFn, summaryGeneratorFn, outputPath) {
    // Load environment variables and get projects folders
    const projectsFolders = loadEnvironmentVariables();

    // Parse the comma-separated list of folders
    const foldersToSearch = parseFoldersToSearch(projectsFolders);

    // Find all projects with bpstatus.json
    const allProjects = findAllProjects(foldersToSearch);

    // Process each project
    const results = [];
    for (const project of allProjects) {
        // Read bpStatus
        const bpStatus = readBpStatus(project.bpStatusPath);

        // Check if this script is excluded by the exclude rules
        const isExcluded = isScriptExcluded(bpStatus, scriptName);

        let result = {
            ...project,
            isExcluded
        };

        if (isExcluded) {
            console.log(`${project.projectName}: Script ${scriptName} is excluded by bpstatus.json exclude rules, skipping...`);
        } else {
            // Process the project
            const processorResult = processorFn(project, bpStatus);
            result = {
                ...result,
                ...processorResult
            };

            // Check if any changes were made by the processor function
            const changesWereMade = Object.keys(processorResult).some(key =>
                key.endsWith('Updated') && processorResult[key] === true
            );

            // Update bpstatus.json only if changes were made
            if (changesWereMade) {
                result.bpStatusUpdated = updateBpStatus(project.bpStatusPath, scriptName);
            } else {
                console.log(`${project.projectName}: No changes made, skipping bpstatus.json update`);
                result.bpStatusUpdated = false;
            }
        }

        results.push(result);
    }

    // Sort results by project type: "reference" first, then "app", "package", and others
    results.sort((a, b) => {
        // Define the order of project types
        const typeOrder = {
            'reference': 1,
            'app': 2,
            'package': 3
        };

        // Get the order value for each project type, defaulting to 4 for any other type
        const orderA = typeOrder[a.projectType] || 4;
        const orderB = typeOrder[b.projectType] || 4;

        // Sort by project type order first
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // If project types are the same, sort by project name
        return a.projectName.localeCompare(b.projectName);
    });

    // Generate markdown report
    let markdown = generateMarkdownHeader(reportTitle);
    markdown += generateMarkdownTableHeader(tableColumns);

    // Add rows for each result
    for (const result of results) {
        markdown += rowGeneratorFn(result);
    }

    // Add summary
    const summaryData = summaryGeneratorFn(results);
    markdown += generateMarkdownSummary(summaryData);

    // Write markdown report to file
    writeMarkdownReport(outputPath, markdown);

    console.log(`Processed ${results.length} projects with ${scriptName}`);

    return results;
}

module.exports = {
    loadEnvironmentVariables,
    parseFoldersToSearch,
    findBpStatusFiles,
    readBpStatus,
    findAllProjects,
    generateMarkdownHeader,
    generateMarkdownTableHeader,
    writeMarkdownReport,
    generateMarkdownSummary,
    formatDate,
    updateBpStatus,
    copyFile,
    isScriptExcluded,
    readPackageJson,
    writePackageJson,
    processProjects
};
