# Orchestrator - Claude Code Subagent

## Project Overview
A comprehensive specification-driven development orchestrator **orch Claude Code subagent** designed to transform chaotic development into systematic workflows through interactive interviews, intelligent suggestions, and approval-gated phases.

**Status**: ✅ **PRODUCTION READY** - Fully functional and installable via GitHub
**Repository**: https://github.com/Nyrk0/orchestrator

## Core Architecture ✅ SOLVED

**Architecture**: Hybrid approach using Node.js CLI with Bash tool integration
- **Orch Subagent** (`.claude/agents/orch.md`): Enhanced with intelligent suggestions and user feedback styles
- **CLI Tool** (`orchestrator/cli.js`): Functional command-line interface
- **Bash Integration**: Orch subagent executes commands via Bash tool

### Main Components
- **Orchestrator** (`orchestrator/core/orchestrator.js`): Central controller managing workflow
- **State Manager** (`orchestrator/core/state-manager.js`): State persistence and retrieval
- **Template Engine** (`orchestrator/core/template-engine.js`): Template management
- **Command Router** (`orchestrator/core/command-router.js`): Command routing and execution
- **Installation Script** (`install-orchestrator.sh`): Portable installation system

### Orch Subagent Commands
**Execution Pattern**: `cd /path/to/.orchestrator && node cli.js <command> <phase>`

Available commands:
- `/orch spec <phase>` - Interactive specification generation with intelligent suggestions
- `/orch research <phase>` - Research analysis with adaptive depth and source validation
- `/orch plan <phase>` - Implementation planning with architectural design
- `/orch tasks <phase>` - Task breakdown with dependencies and T### numbering
- `/orch approve <phase>` - Approval workflows with state management
- `/orch status <phase>` - Comprehensive phase status and progress tracking

### Enhanced Features
- **Intelligent Suggestions**: Context-aware recommendations during interviews
- **User Feedback Styles**: user-friendly, professional, sudo-style options
- **Approval Gates**: Sequential workflow enforcement (spec → research → plan → tasks)
- **State Persistence**: Maintains workflow state across command invocations

## Installation & Usage

### Quick Install
```bash
# Clone and install in any project
git clone https://github.com/Nyrk0/orchestrator.git
cd orchestrator
./install-orchestrator.sh /path/to/your-project

# Or install in current directory
./install-orchestrator.sh
```

### Usage Methods
1. **Claude Code CLI (Recommended)**: `/orch spec st01-authentication`
2. **Convenience Wrapper**: `./orch spec st01-authentication`
3. **Direct CLI**: `cd .orchestrator && node cli.js spec st01-authentication`

## Development Workflow ✅ IMPLEMENTED

**Four-Phase Sequential Workflow with Approval Gates:**

1. **📋 Specification Phase**: Interactive interviews with intelligent suggestions
2. **🔬 Research Phase**: Technical analysis with validated sources and web research
3. **📐 Planning Phase**: Architectural design and implementation strategies
4. **✅ Tasks Phase**: Executable task breakdown with T### numbering and dependencies

**User Experience Features:**
- **First-run setup**: User selects feedback style (user-friendly/professional/sudo-style)
- **Intelligent suggestions**: Context-aware recommendations during interviews
- **Approval gates**: Explicit user approval required between phases
- **State persistence**: Maintains workflow state across command invocations

## Technical Stack ✅ PRODUCTION READY
- **Runtime**: Node.js (v16+)
- **Integration**: Claude Code CLI subagent system
- **Testing**: Jest with 80%+ coverage requirements
- **Dependencies**: `ajv`, `ajv-formats` for JSON schema validation
- **Installation**: Bash script with npm dependency management

## Project Structure ✅ CLEAN & ORGANIZED
```
target-project/
├── .orchestrator/           # Installed orchestrator tool (hidden)
│   ├── cli.js              # Main CLI interface
│   ├── commands/           # Command implementations
│   ├── core/               # Core functionality  
│   ├── templates/          # Template files
│   └── package.json        # Dependencies
├── .claude/                # Claude Code integration
│   └── agents/
│       └── orch.md         # Enhanced orch subagent
├── dev/                    # Generated phase documentation
│   └── st##-name/         # Phase-specific folders
└── orch                    # Convenience wrapper script
```

## Key Features ✅ COMPLETED

### Enhanced Orch Subagent
- **Intelligent Interview System**: Provides context-aware suggestions during specification gathering
- **User Feedback Styles**: Adapts communication style (user-friendly, professional, sudo-style)
- **Approval Workflow**: Enforces sequential progression with explicit user approval gates
- **State Management**: Persists workflow state and user preferences across sessions
- **Bash Tool Integration**: Direct command execution via Claude Code's Bash tool

### Installation System
- **Portable Installation**: Single script installs orchestrator in any project
- **Clean Integration**: Hidden `.orchestrator` folder keeps project clean
- **Update Capability**: Can replace tool files while preserving user data
- **Cross-platform**: Works on any system with Node.js and Claude Code CLI

### Documentation & User Experience
- **Comprehensive README**: Complete installation, usage, and troubleshooting guide
- **Workflow Diagrams**: Visual ASCII and Mermaid diagrams explaining the methodology
- **Three Usage Methods**: Claude Code CLI, convenience wrapper, and direct CLI access
- **MIT License**: Open source and ready for community use

## Important Notes for Claude Code Usage

### Primary Usage Pattern
```bash
# Always prefer Claude Code CLI orch subagent
/orch spec st01-authentication
/orch research st01-authentication  
/orch plan st01-authentication
/orch tasks st01-authentication
```

### Phase Management
- **Phase naming**: Use `st##-descriptive-name` format (e.g., `st01-foundation`)
- **Sequential workflow**: Must complete spec → research → plan → tasks in order
- **Approval gates**: Explicit user approval required between each phase
- **State persistence**: All workflow state maintained automatically

### Integration with Development
After task approval, hand off to Claude Code for implementation:
```
The tasks are approved. Please implement:
- T001: Setup authentication middleware
- T002: Implement JWT token generation  
- T003: Create user validation service

Refer to complete specification at dev/st01-authentication/
```

## Status: Production Ready 🚀

Orchestrator is **fully functional and ready for use**. The system successfully transforms chaotic development into systematic, specification-driven workflows through intelligent interviews, contextual suggestions, and approval-gated progression.
