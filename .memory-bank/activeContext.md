# MLE Best Practices Active Context

## Current Work Focus
The current focus is on implementing and improving the project discovery and best practices compliance functionality. This includes:
1. Creating scripts to find projects with bpstatus.json files
2. Checking projects for compliance with best practices (like .gitignore standards)
3. Updating projects' bpstatus.json files with compliance information
4. Generating reports on discovered projects and their compliance status
5. Updating documentation to reflect the new functionality

## Recent Changes
1. Updated project version to 0.0.10:
   - Updated version in package.json
   - Updated version in bpstatus.json
   - Updated version badge in README.md
   - Updated version in progress.md
   - Updated CHANGELOG.md with all version entries (0.0.5 through 0.0.10)
   - Added squash-commits.js script for merging all commits from a branch into one
   - Added check-before-release.js script to verify project status before release
   - Added support for project exclusion rules in bpstatus.json
   - Added comprehensive project status reporting in STATUS_ALL.gitignored.md
   - Improved project type detection logic
   - Enhanced release scripts management
   - Updated common utility functions for better reusability
   - Refined documentation in README.md and memory bank

2. Created a new script `find-projects.js` that:
   - Reads project directories from the PROJECTS_FOLDERS environment variable
   - Recursively searches for projects with bpstatus.json files
   - Generates a markdown table with the results
   - Saves the output to STATUS_PROJECTS.gitignored.md

2. Created a new script `check-gitignore.js` that:
   - Loads this project's .gitignore file as the reference
   - Finds projects with bpstatus.json files (reusing logic from find-projects.js)
   - Checks if each project's .gitignore contains all lines from the reference
   - Updates each project's bpstatus.json with .gitignore status (true/false)
   - Generates a markdown report with the results
   - Saves the output to STATUS_GITIGNORE.gitignored.md

3. Created a new script `check-scripts.js` that:
   - Loads BP scripts from this project's scripts/bp directory
   - Finds projects with bpstatus.json files (reusing logic from find-projects.js)
   - Checks if each project has scripts: true in bpstatus.json
   - Copies BP scripts to the project's scripts/bp directory if needed
   - Generates a markdown report with the results
   - Saves the output to STATUS_SCRIPTS.gitignored.md

4. Created a new script `check-memory-bank.js` that:
   - Loads the memory-bank-rules.md file from this project's .memory-bank directory
   - Finds projects with bpstatus.json files (reusing logic from find-projects.js)
   - Checks if each project has .memory-bank: true in bpstatus.json
   - Copies memory-bank-rules.md to the project's .memory-bank directory if needed
   - Generates a markdown report with the results
   - Saves the output to STATUS_MEMORY_BANK.gitignored.md

5. Updated package.json to:
   - Add the dotenv dependency
   - Add npm scripts for running the tools:
     - `find-projects` to run the project discovery script
     - `check-gitignore` to run the gitignore compliance script
     - `check-scripts` to run the scripts compliance script
     - `check-memory-bank` to run the memory bank compliance script

6. Updated environment configuration:
   - Added PROJECTS_FOLDERS variable to .env.example
   - Added PROJECTS_FOLDERS variable to .env

7. Made the scripts executable:
   - find-projects.js
   - check-gitignore.js
   - check-scripts.js
   - check-memory-bank.js

8. Updated README.md with information about all scripts and their functionality

9. Created memory bank documentation to improve project knowledge retention

10. Modified all scripts to respect exclusion rules:
    - Updated find-projects.js, check-gitignore.js, check-scripts.js, check-memory-bank.js, check-project-type.js, and clean-release-scripts.js
    - Added logic to check if a script is excluded by the rules in bpstatus.json
    - Ensured that excluded scripts don't update the bpstatus.json file
    - This prevents excluded scripts from changing the status timestamps in bpstatus.json

## Next Steps
1. Implement additional best practice checks:
   - Check for proper package.json structure
   - Check for presence of essential files (README.md, LICENSE, etc.)
   - Check for proper testing setup
   - Check for proper CI/CD configuration
2. Create a unified dashboard for viewing all best practices compliance across projects
3. Enhance reporting with more detailed information and statistics
4. Add functionality to automatically fix non-compliant aspects where possible
5. Create visualization tools for best practices adoption
6. Implement a scheduling system for regular compliance checks

## Active Decisions and Considerations
1. **File Format**: Using markdown for reports for maximum compatibility and readability
2. **Configuration Approach**: Using environment variables for configuration to follow the 12-factor app methodology
3. **Project Identification**: Using bpstatus.json as a marker file to identify projects following best practices
4. **Directory Structure**: Supporting recursive search to accommodate various project organization patterns
5. **Performance Considerations**: Skipping node_modules and hidden directories to improve search performance
