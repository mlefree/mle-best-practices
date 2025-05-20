# MLE Best Practices Technical Context

## Technologies Used
- **Node.js**: Runtime environment for executing JavaScript code
- **JavaScript**: Primary programming language
- **dotenv**: Library for loading environment variables from .env files
- **npm**: Package manager and script runner
- **Markdown**: Format for documentation and reports

## Development Setup
### Prerequisites
- Node.js (version 22.x or higher)
- npm (comes with Node.js)

### Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Copy `.env.example` to `.env` and configure the environment variables
4. Run `npm run find-projects` to test the setup

### Directory Structure
```
mle-best-practices/
├── .memory-bank/       # AI memory bank files
├── scripts/            # JavaScript scripts
│   ├── find-projects.js        # Script to find projects with bpstatus.json
│   ├── check-gitignore.js      # Script to check .gitignore compliance
│   ├── check-scripts.js        # Script to check scripts compliance
│   ├── check-memory-bank.js    # Script to check memory bank compliance
│   ├── squash-commits.js       # Utility for git operations
│   ├── switch-dependencies.js  # Script to switch between local and remote dependencies
│   └── update-changelog-date.js # Script to update changelog dates
├── .env.example        # Template for environment configuration
├── .env                # Actual environment configuration (gitignored)
├── .gitignore          # Git ignore file
├── CHANGELOG.md        # Project changelog
├── LICENSE             # Project license
├── STATUS_PROJECTS.gitignored.md # Generated report of projects (gitignored)
├── STATUS_GITIGNORE.gitignored.md # Generated report of .gitignore compliance (gitignored)
├── STATUS_SCRIPTS.gitignored.md # Generated report of scripts compliance (gitignored)
├── STATUS_MEMORY_BANK.gitignored.md # Generated report of memory bank compliance (gitignored)
├── README.md           # Project documentation
├── bpstatus.json       # Best practices status file for this project
├── package.json        # npm package configuration
└── package.mlefree.json # Custom package configuration for mlefree
```

## Technical Constraints
1. **Cross-Platform Compatibility**: Must work on Windows, macOS, and Linux
2. **Node.js Version**: Requires Node.js version 22.x or higher
3. **File System Access**: Requires read access to directories specified in PROJECTS_FOLDERS
4. **Environment Variables**: Relies on properly configured environment variables

## Dependencies
### Runtime Dependencies
- **dotenv**: ^16.3.1 - For loading environment variables from .env files

### Development Dependencies
- None currently specified

### Optional Tools
- **Git**: For version control and release management
- **Text Editor/IDE**: For code editing (VS Code recommended)
