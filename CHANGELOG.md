# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated memory bank documentation with latest project status
- Updated README.md to reflect the latest version
- Improved project documentation for better clarity

## [0.0.12] - 2023-06-10

### Changed

- Updated dependencies to latest versions
- Fixed minor issues in project discovery
- Enhanced reporting format

## [0.0.11] - 2023-06-07

### Changed

- Updated memory bank documentation with latest project status
- Updated README.md to reflect the latest version
- Improved project documentation for better clarity

## [0.0.10] - 2025-06-07

### Added

- Added squash-commits.cjs script for merging all commits from a branch into one
- Added check-before-release.cjs script to verify project status before release
- Added support for project exclusion rules in bpstatus.json
- Added comprehensive project status reporting in STATUS_ALL.gitignored.md

### Changed

- Improved project type detection logic
- Enhanced release scripts management
- Updated common utility functions for better reusability
- Refined documentation in README.md and memory bank

## [0.0.9] - 2025-05-24

### Added

- Added support for standalone project type
- Added clean-release-scripts.cjs to remove unnecessary scripts based on project type

### Changed

- Improved project discovery mechanism
- Enhanced reporting format in STATUS_ALL.gitignored.md

## [0.0.8] - 2025-05-23

### Added

- Added check-all.cjs script to run all compliance checks and generate a consolidated report
- Added support for project type detection (app, package, standalone)

### Changed

- Improved error handling in all scripts
- Enhanced reporting with more detailed information

## [0.0.7] - 2025-05-23

### Added

- Added check-scripts.cjs to verify and copy best practice scripts to projects
- Added npm script for running all checks in sequence

### Changed

- Refactored common functionality for better code reuse
- Improved project discovery performance

## [0.0.6] - 2025-05-22

### Added

- Added check-memory-bank.cjs to verify memory bank documentation in projects
- Added support for copying memory bank rules to other projects

### Changed

- Enhanced reporting with more detailed status information
- Improved error handling in all scripts

## [0.0.5] - 2025-05-21

### Added

- Added find-projects.cjs script to discover projects with bpstatus.json files
- Added check-gitignore.cjs script to verify .gitignore compliance
- Added support for environment variable configuration via dotenv

### Changed

- Refactored common functionality into shared methods
- Improved reporting format with markdown tables

## [0.0.4] - 2025-05-20

### Changed

- Updated documentation
- Improved script functionality
- Enhanced configuration management

## [0.0.3] - 2025-05-20

### Added

- Added `check-memory-bank.cjs` script to verify memory bank documentation
- Added `check-scripts.cjs` script to verify scripts compliance
- Added `check-project-type.cjs` script to identify project types
- Added `clean-release-scripts.cjs` script to manage release scripts
- Added npm script `check-project-type` to run the project type identification
- Added npm script `all` to run all compliance checks in sequence

## [0.0.2] - 2025-05-06

### Added

- Added `find-projects.cjs` script to discover projects with bpstatus.json files
- Added `check-gitignore.cjs` script to verify .gitignore compliance in projects
- Added npm script `find-projects` to run the discovery script
- Added npm script `check-gitignore` to run the gitignore compliance check
- Added dotenv dependency for environment variable management
- Added PROJECTS_FOLDERS environment variable to configure directories to search
- Added comprehensive documentation in README.md
- Created memory bank documentation for project knowledge retention

### Changed

- Refactored common functionality into shared methods in common.cjs
- Added formatDate() utility function for consistent date formatting
- Added updateBpStatus() function to centralize bpstatus.json updates
- Added copyFile() function for consistent file copying operations
- Updated check-gitignore.cjs, check-scripts.cjs, and check-memory-bank.cjs to use common functions
- Modified updateBpStatus() to use the version from package.json instead of hardcoded value
