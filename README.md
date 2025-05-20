# MLE Best Practices

<div align="center">

![MLE Best Practices Logo](https://img.shields.io/badge/MLE-Best%20Practices-blue?style=for-the-badge)

[![Version](https://img.shields.io/badge/version-0.0.3-blue.svg)](https://github.com/mlefree/mle-best-practices)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.x-brightgreen.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

<p align="center">A toolkit for implementing and maintaining best practices across JavaScript/TypeScript projects.</p>

---

## 🚀 Features

- **Project Discovery**: Automatically find projects with best practices implemented
- **Compliance Checking**: Verify if projects follow established best practices
- **Status Tracking**: Track best practices adoption across multiple projects
- **Reporting**: Generate comprehensive reports on compliance status
- **Project Type Detection**: Automatically classify projects as app, package, or standalone
- **Release Scripts Management**: Clean up unnecessary release scripts based on project type
- **Exclusion Rules**: Selectively apply best practices checks to specific projects

## 📋 Table of Contents

- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Changelog](#-changelog)

## 🔧 Installation

### Prerequisites

- Node.js (version 22.x or higher)
- npm (comes with Node.js)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/mlefree/mle-best-practices.git
cd mle-best-practices
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

4. Configure the `PROJECTS_FOLDERS` environment variable in the `.env` file:

```
PROJECTS_FOLDERS=/path/to/projects1,/path/to/projects2
```

## 🎮 Usage

### Running All Checks

To run all best practices checks:

```bash
npm run all
```

### Viewing Reports

After running the checks, you can view the generated reports in the following files:

- `STATUS_PROJECTS.gitignored.md`: List of all projects with bpstatus.json
- `STATUS_GITIGNORE.gitignored.md`: Report on .gitignore compliance
- `STATUS_MEMORY_BANK.gitignored.md`: Report on memory bank implementation
- `STATUS_SCRIPTS.gitignored.md`: Report on scripts implementation
- `STATUS_PROJECT_TYPES.gitignored.md`: Report on project types
- `STATUS_RELEASE_SCRIPTS.gitignored.md`: Report on release scripts cleanup

## 📚 Documentation

### Memory Bank

This project uses a Memory Bank for comprehensive documentation and context retention. The Memory Bank is located in the
`.memory-bank` directory and contains the following files:

- `memory-bank-rules.md`: Rules to follow and to consider in all contexts
- `projectbrief.md`: Overview of the project, core requirements, and goals
- `productContext.md`: Why the project exists, problems it solves, and how it works
- `systemPatterns.md`: System architecture, key technical decisions, and design patterns
- `techContext.md`: Technologies used, development setup, and technical constraints
- `activeContext.md`: Current work focus, recent changes, and next steps
- `progress.md`: What works, what's left to build, and known issues

### System Architecture

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

## 📁 Project Structure

```
mle-best-practices/
├── .memory-bank/       # AI memory bank files
├── scripts/            # JavaScript scripts
│   ├── find-projects.js        # Script to find projects with bpstatus.json
│   ├── check-gitignore.js      # Script to check .gitignore compliance
│   ├── check-scripts.js        # Script to check scripts compliance
│   ├── check-memory-bank.js    # Script to check memory bank compliance
│   ├── check-project-type.js   # Script to detect project types
│   ├── clean-release-scripts.js # Script to clean release scripts
│   ├── common.js               # Common utility functions
│   └── bp/                     # BP scripts to copy to other projects
├── .env.example        # Template for environment configuration
├── .gitignore          # Git ignore file
├── CHANGELOG.md        # Project changelog
├── LICENSE             # Project license
├── README.md           # Project documentation
├── bpstatus.json       # Best practices status file for this project
└── package.json        # npm package configuration
```

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 📝 Changelog

see the [CHANGELOG](CHANGELOG.md) file for details.


---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/mlefree">@mlefree</a></sub>
</div>
