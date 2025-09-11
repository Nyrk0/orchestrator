# Orchestrator - Agent Context

## Project Overview
A specification-driven development orchestrator Claude subagent for project development, designed to manage and automate development workflows through orch as invoqued agent in Claude Code CLI

Documentation is stored in the `docs` directory, must me consulted in research to understand how to use subagents and create custom slash commands for orchestrator.
[sub-agents](dev/st00-orchestrator/docs/sub-agents.md)
[slash-commands](dev/st00-orchestrator/docs/slash-commands.md)
[hooks](dev/st00-orchestrator/docs/hooks.md)

## Core Architecture
Actually wrong implementation of core architecture with all main commands as .js. Many or all of them should be scripts allowed to be executed by the orch subagent. So, main components needs to be audited and updated to be scripts for subagent execution.
### Main Components
- **Orchestrator** (`core/orchestrator.js`): Central controller managing the workflow and command execution
- **State Manager** (`core/state-manager.js`): Handles persistence and retrieval of orchestrator state
- **Template Engine** (`core/template-engine.js`): Manages templates for various outputs
- **Error Handler** (`core/error-handler.js`): Centralized error handling and reporting
- **Command Router** (`core/command-router.js`): Routes commands to appropriate handlers

### Key Commands
commands to be created as scripts for execution by the orch subagent, when added after subagent invocation:
- `orch`: Invokes orch subagent
- `spec`: Handle specification-related operations
- `research`: Manage research tasks and documentation
- `plan`: Create and manage development plans
- `tasks`: Handle task management
- `approve`: Process approval workflows
- `status`: Check system status
examples:
- /orch spec <phase> : orch subagent uses spec command to generate specification for the given phase
- /orch research <phase> : orch subagent uses research command to generate research for the given phase
- /orch plan <phase> : orch subagent uses plan command to generate plan for the given phase
- /orch tasks <phase> : orch subagent uses tasks command to generate tasks for the given phase
- /orch approve <phase> : orch subagent uses approve command to approve the given phase
- /orch status <phase> : orch subagent uses status command to check the status of the given phase
**Only if orch subagent can not be invoqued by /orch command**, then main agent must pass the command to orch subagent as a string to be executed by the orch subagent: "Use orch to spec wowowo new project"
**ALL prompts containing "use orch" and a command** MUST be passed to orch subagent as a string to be executed by the orch subagent: "Use orch to spec wowowo new project"**

## Development Workflow
1. **Specification Phase**: Define requirements and specifications
2. **Research Phase**: Conduct necessary research
3. **Planning Phase**: Create development plans
4. **Task Execution**: Implement planned tasks

## Technical Stack
Must be updated to use scripts instead of .js files
- **Runtime**: Node.js
- **Testing**: Jest
- **Dependencies**:
  - `ajv`: For JSON schema validation
  - `ajv-formats`: Additional validation formats for AJV

## Project Structure
Must be updated for subagent execution and keep isolation between orch subagent and the project structure
```
orchestrator/
├── commands/         # Command implementations
├── core/            # Core functionality
├── orchestrator-states/ # State storage
├── schemas/         # JSON schemas
├── scripts/         # Utility scripts
├── templates/       # Template files
└── tests/           # Test files
```

## Development Practices
- Test-driven development (TDD) focused
- Comprehensive test coverage (80%+ required)
- Clear separation of concerns
- Modular architecture

## Important Notes
- The system follows a phase-based workflow (e.g., st01, st02, etc.)
- State is persisted between command invocations
- Commands are designed to be idempotent when possible
- Error handling is centralized for consistent behavior

## Common Workflows

### Starting a New Phase
1. Create specification with `spec` command
2. Conduct research using `research` command
3. Generate plan with `plan` command
4. Execute tasks using `tasks` command

### Checking Status
```bash
node cli.js status
```

### Running Tests
```bash
npm test           # Run all tests
npm run test:watch # Run in watch mode
npm run test:coverage # Generate coverage report
```

## Environment Variables
Configuration is managed through environment variables (see `.env.example` for reference)
