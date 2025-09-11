/**
 * Command Router - T022 Implementation
 * TDD GREEN PHASE: Hierarchical validation and cascade updates
 */

const { globalErrorHandler, WorkflowError, ValidationError, HierarchicalViolationError } = require('./error-handler');
const { globalTaskManager } = require('./task-number-manager');

class CommandRouter {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.validActions = ['spec', 'research', 'plan', 'prd', 'tasks', 'status', 'audit', 'handoff', 'board'];
    this.workflowOrder = ['spec', 'research', 'plan', 'prd', 'tasks'];
  }

  async handleOrchCommand(action, phase, options = {}) {
    try {
      // T022-1: Validate inputs and hierarchical precedence
      this.validateCommand(action, phase);
      await this.validateHierarchicalPrecedence(action, phase, options.changes);
      
      // T022-2: Load phase state
      const state = await this.stateManager.load(phase);
      
      // T022-3: Check workflow permissions
      const workflowValid = await this.validateWorkflowTransition(state, action);
      if (!workflowValid && action !== 'status') {
        throw new WorkflowError(
          `Cannot execute ${action} - workflow requirements not met`,
          state.currentStep,
          this.getRequiredSteps(action)
        );
      }
      
      // T022-4: Execute command with hierarchical validation
      const result = await this.executeCommand(action, phase, state, options);
      
      // T022-5: Cascade-update downstream documents if needed
      if (result.requiresCascade) {
        const cascadeResult = await this.coordinateCascadeUpdates(action, phase, result.changes);
        result.cascadeUpdates = cascadeResult;
      }
      
      // T022-6: Code audit with backup if tasks.md affected
      if (result.affectsTasks) {
        const auditResult = await this.triggerCodeAudit(action, phase, result.changes);
        result.codeAudit = auditResult;
      }
      
      // T022-7: Update state
      if (result.newState) {
        await this.stateManager.save(phase, result.newState);
      }
      
      // T022-8: Return result
      return {
        success: true,
        action,
        phase,
        timestamp: new Date().toISOString(),
        ...result
      };
      
    } catch (error) {
      return this.handleCommandError(error, action, phase);
    }
  }

  validateCommand(action, phase) {
    // Validate action
    if (!this.validActions.includes(action)) {
      throw new ValidationError(`Invalid command action: ${action}`, 'action', action);
    }
    
    // Validate phase format
    if (!phase || !phase.match(/^st\d{2}-[a-z0-9-]+$/)) {
      throw new ValidationError(`Invalid phase format: ${phase}`, 'phase', phase);
    }
  }

  async validateHierarchicalPrecedence(action, phase, changes) {
    if (!changes || !this.workflowOrder.includes(action)) {
      return true; // No changes or not a workflow action
    }

    // Use state manager's hierarchical validation
    const result = await this.stateManager.validateHierarchicalPrecedence(action, phase, changes);
    
    if (!result.allowed) {
      throw new HierarchicalViolationError(
        `Hierarchical precedence violation for ${action} on ${phase}`,
        `${phase}-${action}.md`,
        result.conflicts
      );
    }
    
    return true;
  }

  async validateWorkflowTransition(state, action) {
    if (!this.workflowOrder.includes(action)) {
      return true; // Non-workflow commands are always valid
    }

    const currentIndex = this.workflowOrder.indexOf(state.currentStep);
    const targetIndex = this.workflowOrder.indexOf(action);

    // Can't skip steps (except going backwards for iteration)
    if (targetIndex > currentIndex + 1) {
      return false;
    }

    // Check required approvals
    const requiredSteps = this.workflowOrder.slice(0, targetIndex);
    for (const step of requiredSteps) {
      if (!state.approvals[step]) {
        return false;
      }
    }

    return true;
  }

  getRequiredSteps(action) {
    const targetIndex = this.workflowOrder.indexOf(action);
    if (targetIndex === -1) return [];
    
    return this.workflowOrder.slice(0, targetIndex);
  }

  async executeCommand(action, phase, state, options) {
    const result = {
      requiresCascade: false,
      affectsTasks: false,
      changes: {},
      newState: null
    };

    switch (action) {
      case 'status':
        result.statusInfo = await this.executeStatusCommand(phase, state);
        break;
        
      case 'spec':
        result.document = await this.executeSpecCommand(phase, state, options);
        result.requiresCascade = true;
        result.newState = { ...state, currentStep: 'spec' };
        break;
        
      case 'research':
        result.document = await this.executeResearchCommand(phase, state, options);
        result.requiresCascade = true;
        result.newState = { ...state, currentStep: 'research' };
        break;
        
      case 'plan':
        result.document = await this.executePlanCommand(phase, state, options);
        result.requiresCascade = true;
        result.newState = { ...state, currentStep: 'plan' };
        break;
        
      case 'tasks':
        result.document = await this.executeTasksCommand(phase, state, options);
        result.affectsTasks = true;
        result.taskNumbers = this.generateTaskNumbers(options);
        result.newState = { ...state, currentStep: 'tasks' };
        break;
        
      default:
        throw new ValidationError(`Command not implemented: ${action}`);
    }

    return result;
  }

  async executeStatusCommand(phase, state) {
    return {
      phase,
      currentStep: state.currentStep,
      completedSteps: state.completedSteps,
      nextAction: state.nextAction,
      approvals: state.approvals,
      blockers: state.blockers,
      progress: this.calculateProgress(state)
    };
  }

  async executeSpecCommand(phase, state, options) {
    // Placeholder - will be implemented in T024
    return `Specification document for ${phase} (generated by T024)`;
  }

  async executeResearchCommand(phase, state, options) {
    // Placeholder - will be implemented in Phase 3
    return `Research document for ${phase} (to be implemented)`;
  }

  async executePlanCommand(phase, state, options) {
    // Placeholder - will be implemented in Phase 3
    return `Plan document for ${phase} (to be implemented)`;
  }

  async executeTasksCommand(phase, state, options) {
    // Placeholder - will be implemented in Phase 3
    return `Tasks document for ${phase} (to be implemented)`;
  }

  generateTaskNumbers(options) {
    if (!options.generateTaskNumbers) return [];
    
    const count = options.taskCount || 5;
    const taskRange = globalTaskManager.generateTaskRange(count, options.phase);
    
    return taskRange.map(task => task.taskNumber);
  }

  calculateProgress(state) {
    const totalSteps = this.workflowOrder.length;
    const completedSteps = state.completedSteps.length;
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: Math.round((completedSteps / totalSteps) * 100),
      currentPhase: state.currentStep || 'not_started'
    };
  }

  async coordinateCascadeUpdates(action, phase, changes) {
    const result = await this.stateManager.cascadeUpdateDownstream(action, phase, changes);
    
    return {
      requiresCascade: true,
      updatedDocuments: result.updatedDocuments,
      cascadeTimestamp: new Date().toISOString()
    };
  }

  async triggerCodeAudit(action, phase, changes) {
    const result = await this.stateManager.auditCodeWithBackup(changes);
    
    return {
      auditTriggered: true,
      backupCreated: result.backupCreated,
      auditResults: result.auditResults,
      auditTimestamp: new Date().toISOString()
    };
  }

  handleCommandError(error, action, phase) {
    const errorInfo = globalErrorHandler.handleError(error, { action, phase });
    
    return {
      success: false,
      action,
      phase,
      error: error.message,
      userMessage: errorInfo.userMessage,
      recovery: errorInfo.recovery,
      errorId: errorInfo.errorId,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  CommandRouter
};

console.log('🟢 TDD GREEN PHASE: CommandRouter (T022) implemented with hierarchical validation');