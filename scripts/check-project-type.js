#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const common = require('./common');

// Load environment variables and get projects folders
const projectsFolders = common.loadEnvironmentVariables();

// Parse the comma-separated list of folders
const foldersToSearch = common.parseFoldersToSearch(projectsFolders);

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
      console.log(`${path.basename(projectPath)} is not a git repository, defaulting to "standalone"`);
      return 'standalone';
    }

    // Get all branches
    const gitCommand = 'git branch -a';
    const branches = execSync(gitCommand, { cwd: projectPath, encoding: 'utf8' })
      .split('\n')
      .map(branch => branch.trim().replace(/^\*\s+/, '')) // Remove the asterisk from current branch
      .filter(branch => branch); // Remove empty lines

    // Check for sandbox branch (indicates app)
    const hasSandboxBranch = branches.some(branch =>
      branch === 'sandbox' ||
      branch === 'remotes/origin/sandbox' ||
      branch.endsWith('/sandbox'));

    if (hasSandboxBranch) {
      return 'app';
    }

    // Check for package branch (indicates package)
    const hasPackageBranch = branches.some(branch =>
      branch === 'package' ||
      branch === 'remotes/origin/package' ||
      branch.endsWith('/package'));

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

// Find all projects with bpstatus.json
const allProjects = common.findAllProjects(foldersToSearch);

// Check project type for each project
const results = [];
for (const project of allProjects) {
  // Read bpstatus.json to check for exclusions
  const bpStatus = common.readBpStatus(project.bpStatusPath);

  // Check if this script is excluded by the exclude rules
  const scriptName = path.basename(__filename, '.js');
  const isExcluded = common.isScriptExcluded(bpStatus, scriptName);

  let projectType = '';
  let bpStatusUpdated = false;

  if (isExcluded) {
    console.log(`${project.projectName}: Script ${scriptName} is excluded by bpstatus.json exclude rules, skipping...`);
    projectType = bpStatus.type || 'unknown';
  } else {
    // Determine project type
    projectType = determineProjectType(project.projectPath);

    // Update bpstatus.json with project type
    bpStatusUpdated = updateBpStatusWithType(project.bpStatusPath, projectType);
  }

  // Only update bpstatus.json if the script is not excluded
  if (!isExcluded) {
    common.updateBpStatus(project.bpStatusPath, 'check-project-type');
  }

  results.push({
    ...project,
    projectType,
    isExcluded,
    bpStatusUpdated
  });

  console.log(`${project.projectName}: project type = ${projectType}, excluded = ${isExcluded ? 'true' : 'false'}, bpstatus updated = ${bpStatusUpdated ? 'true' : 'false'}`);
}

// Generate markdown report
let markdown = common.generateMarkdownHeader('Projects Type Status');
markdown += common.generateMarkdownTableHeader(['Project Name', 'Project Path', 'Project Type', 'Excluded', 'bpstatus.json Updated']);

for (const result of results) {
  markdown += `| ${result.projectName} | ${result.projectPath} | ${result.projectType} | ${result.isExcluded ? '✅' : '❌'} | ${result.bpStatusUpdated ? '✅' : '❌'} |\n`;
}

// Add summary
const summaryData = {
  'Total projects found': results.length,
  'Projects excluded by rules': results.filter(r => r.isExcluded).length,
  'App projects': results.filter(r => r.projectType === 'app').length,
  'Package projects': results.filter(r => r.projectType === 'package').length,
  'Standalone projects': results.filter(r => r.projectType === 'standalone').length,
  'Projects with bpstatus.json updated': results.filter(r => r.bpStatusUpdated).length
};
markdown += common.generateMarkdownSummary(summaryData);

// Write to STATUS_PROJECT_TYPES.gitignored.md
const outputPath = path.resolve(__dirname, '../STATUS_PROJECT_TYPES.gitignored.md');
common.writeMarkdownReport(outputPath, markdown);

console.log(`Checked project types for ${results.length} projects`);
