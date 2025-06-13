# MLE Best Practices System Patterns

## System Architecture
The MLE Best Practices system follows a simple, modular architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Configuration  │────▶│  Core Scripts   │────▶│    Reporting    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Configuration**: Environment variables and settings that control the behavior of the system
2. **Core Scripts**: JavaScript modules that implement the core functionality
3. **Reporting**: Output generation in various formats (currently markdown)

## Key Technical Decisions
1. **Node.js Platform**: Using Node.js for cross-platform compatibility and ease of development
2. **Environment-Based Configuration**: Using dotenv for configuration management
3. **File-Based Markers**: Using bpstatus.json files to mark projects that follow best practices
4. **Markdown Reporting**: Using markdown for human-readable reports
5. **NPM Scripts**: Using npm scripts for command execution and automation

## Design Patterns in Use
1. **Command Pattern**: Each script is a standalone command that can be executed independently
2. **Configuration Injection**: Environment variables are used to inject configuration
3. **Recursive Directory Traversal**: Used for finding projects in nested directory structures
4. **Template Generation**: Used for creating standardized reports

## Component Relationships
### find-projects.js
- **Inputs**: 
  - PROJECTS_FOLDERS environment variable (list of directories to search)
- **Process**:
  - Recursively searches directories for bpstatus.json files
  - Collects project information
- **Outputs**:
  - STATUS_PROJECTS.gitignored.md file with a table of projects
  - Console output with summary information

### check-gitignore.js
- **Inputs**: 
  - PROJECTS_FOLDERS environment variable (list of directories to search)
  - This project's .gitignore file as reference
- **Process**:
  - Recursively searches directories for bpstatus.json files
  - Checks if each project's .gitignore contains all lines from the reference
  - Updates projects with .gitignore: true in bpstatus.json
- **Outputs**:
  - STATUS_GITIGNORE.gitignored.md file with compliance report
  - Console output with summary information

### check-scripts.js
- **Inputs**: 
  - PROJECTS_FOLDERS environment variable (list of directories to search)
  - BP scripts from this project's scripts/bp directory
- **Process**:
  - Recursively searches directories for bpstatus.json files
  - Checks if each project has scripts: true in bpstatus.json
  - Copies BP scripts to projects' scripts/bp directories if needed
- **Outputs**:
  - STATUS_SCRIPTS.gitignored.md file with compliance report
  - Console output with summary information

### check-memory-bank.js
- **Inputs**: 
  - PROJECTS_FOLDERS environment variable (list of directories to search)
  - memory-bank-rules.md file from this project's .memory-bank directory
- **Process**:
  - Recursively searches directories for bpstatus.json files
  - Checks if each project has .memory-bank: true in bpstatus.json
  - Copies memory-bank-rules.md to projects' .memory-bank directories if needed
- **Outputs**:
  - STATUS_MEMORY_BANK.gitignored.md file with compliance report
  - Console output with summary information

### Environment Configuration
- **.env.example**: Template for environment configuration
- **.env**: Actual environment configuration (gitignored)
- **Variables**:
  - NODE_ENV: Environment mode (development, production)
  - PROJECTS_FOLDERS: Comma-separated list of directories to search

### Package Scripts
- **find-projects**: Runs the find-projects.js script
- **check-gitignore**: Runs the check-gitignore.js script
- **check-scripts**: Runs the check-scripts.js script
- **check-memory-bank**: Runs the check-memory-bank.js script
- **Other utility scripts**: For development and maintenance tasks
