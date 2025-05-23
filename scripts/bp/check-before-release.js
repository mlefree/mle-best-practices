#!/usr/bin/env node

/**
 * check-before-release.js
 * Script to run build and test commands before release
 *
 * Usage: node check-before-release.js
 *
 * This script runs 'npm run build' and 'npm run test' commands.
 * If both commands succeed, it exits with code 0.
 * If either command fails, it exits with code 1.
 */

const {execSync} = require('child_process');

// Function to execute shell commands and return the output
function execCommand(command) {
    try {
        console.log(`Executing: ${command}`);
        const output = execSync(command, {encoding: 'utf8', stdio: 'inherit'});
        return {success: true, output};
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        return {success: false, error};
    }
}

// Main function
async function checkBeforeRelease() {
    console.log('Running pre-release checks...');

    // Run build command
    console.log('\n=== Running build ===');
    const buildResult = execCommand('npm run build');

    if (!buildResult.success) {
        console.error('Build failed! Aborting pre-release checks.');
        process.exit(1);
    }

    console.log('Build completed successfully.');

    // Run test command
    console.log('\n=== Running tests ===');
    const testResult = execCommand('npm run test');

    if (!testResult.success) {
        console.error('Tests failed! Aborting pre-release checks.');
        process.exit(1);
    }

    console.log('Tests completed successfully.');

    // If we got here, both build and test were successful
    console.log('\n✅ All pre-release checks passed successfully!');
}

// Run the main function
checkBeforeRelease();
