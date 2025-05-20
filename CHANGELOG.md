# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - 2025-05-06

### Added
- Added `find-projects.js` script to discover projects with bpstatus.json files
- Added `check-gitignore.js` script to verify .gitignore compliance in projects
- Added npm script `find-projects` to run the discovery script
- Added npm script `check-gitignore` to run the gitignore compliance check
- Added dotenv dependency for environment variable management
- Added PROJECTS_FOLDERS environment variable to configure directories to search
- Added comprehensive documentation in README.md
- Created memory bank documentation for project knowledge retention

### Changed
- Refactored common functionality into shared methods in common.js
- Added formatDate() utility function for consistent date formatting
- Added updateBpStatus() function to centralize bpstatus.json updates
- Added copyFile() function for consistent file copying operations
- Updated check-gitignore.js, check-scripts.js, and check-memory-bank.js to use common functions
- Modified updateBpStatus() to use the version from package.json instead of hardcoded value
