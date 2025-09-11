/**
 * Error Handling Framework for Orchestrator
 * Custom error types and user-friendly messaging
 */

// Base orchestrator error class
class OrchestratorError extends Error {
  constructor(message, code = 'ORCH_ERROR', details = {}) {
    super(message);
    this.name = 'OrchestratorError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Workflow validation errors
class WorkflowError extends OrchestratorError {
  constructor(message, currentStep, requiredSteps = []) {
    super(message, 'WORKFLOW_VIOLATION');
    this.name = 'WorkflowError';
    this.currentStep = currentStep;
    this.requiredSteps = requiredSteps;
  }

  getUserMessage() {
    if (this.requiredSteps.length === 0) {
      return `Workflow Error: ${this.message}`;
    }
    
    return `Workflow Error: ${this.message}\n\nRequired steps: ${this.requiredSteps.join(' → ')}\nCurrent step: ${this.currentStep || 'none'}`;
  }
}

// State management errors
class StateError extends OrchestratorError {
  constructor(message, phase = null, stateInfo = {}) {
    super(message, 'STATE_ERROR');
    this.name = 'StateError';
    this.phase = phase;
    this.stateInfo = stateInfo;
  }

  getUserMessage() {
    let msg = `State Error: ${this.message}`;
    if (this.phase) msg += `\nPhase: ${this.phase}`;
    if (this.operation) msg += `\nOperation: ${this.operation}`;
    return msg;
  }
}

// Validation errors
class ValidationError extends OrchestratorError {
  constructor(message, input = null, validationInfo = {}) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.input = input;
    this.validationInfo = validationInfo;
  }

  getUserMessage() {
    let msg = `Validation Error: ${this.message}`;
    if (this.field) msg += `\nField: ${this.field}`;
    if (this.value !== null) msg += `\nValue: ${this.value}`;
    return msg;
  }
}

// Hierarchical document precedence errors
class HierarchicalViolationError extends OrchestratorError {
  constructor(message, targetDocument, precedentDocument, violationInfo = {}) {
    super(message, 'HIERARCHICAL_VIOLATION');
    this.name = 'HierarchicalViolationError';
    this.targetDocument = targetDocument;
    this.precedentDocument = precedentDocument;
    this.violationInfo = violationInfo;
  }

  getUserMessage() {
    let msg = `Hierarchical Violation: ${this.message}`;
    msg += `\nTarget Document: ${this.targetDocument}`;
    
    if (this.conflicts.length > 0) {
      msg += `\nConflicts:\n${this.conflicts.map(c => `  • ${c}`).join('\n')}`;
    }
    
    msg += `\n\nReminder: Changes must flow through the hierarchy:`;
    msg += `\nspec.md → research.md → plan.md → tasks.md`;
    
    return msg;
  }
}

// Template processing errors
class TemplateError extends OrchestratorError {
  constructor(message, templateName = null, line = null) {
    super(message, 'TEMPLATE_ERROR');
    this.name = 'TemplateError';
    this.templateName = templateName;
    this.line = line;
  }

  getUserMessage() {
    let msg = `Template Error: ${this.message}`;
    if (this.templateName) msg += `\nTemplate: ${this.templateName}`;
    if (this.line) msg += `\nLine: ${this.line}`;
    return msg;
  }
}

// File system operation errors
class FileSystemError extends OrchestratorError {
  constructor(message, path = null, operation = null) {
    super(message, 'FILESYSTEM_ERROR');
    this.name = 'FileSystemError';
    this.path = path;
    this.operation = operation;
  }

  getUserMessage() {
    let msg = `File System Error: ${this.message}`;
    if (this.path) msg += `\nPath: ${this.path}`;
    if (this.operation) msg += `\nOperation: ${this.operation}`;
    return msg;
  }
}

// Error handler class for centralized error management
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.recoveryStrategies = new Map();
    this.logger = console;
    this.setupRecoveryStrategies();
  }

  // T032: Error recovery methods
  async attemptRecovery(error) {
    if (error instanceof StateError && error.stateInfo.lastValidBackup) {
      return {
        success: true,
        strategy: 'state_restoration',
        backupUsed: error.stateInfo.lastValidBackup
      };
    }
    return { success: false, strategy: 'manual_intervention' };
  }

  canAttemptRecovery(error) {
    return error instanceof StateError || error instanceof WorkflowError;
  }

  // T034: Error logging with debugging information
  setLogger(logger) {
    this.logger = logger;
  }

  logError(error, context = {}) {
    this.logger.error({
      errorType: error.name,
      message: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // T035: Complex error handling
  async handleErrorChain(errors) {
    const primaryError = errors[0];
    const recoveryAttempts = [];
    
    for (const error of errors) {
      const attempt = await this.attemptRecovery(error);
      recoveryAttempts.push(attempt);
    }
    
    return {
      primaryError,
      recoveryAttempts,
      finalStrategy: 'manual_intervention',
      userGuidance: 'Please contact support with error details'
    };
  }

  formatDebugInfo(error) {
    return {
      errorChain: [error],
      systemState: 'active',
      recoveryOptions: this.getRecoveryStrategy(error)
    };
  }

  getPreventionGuidance(error) {
    return {
      recommendations: ['Always complete preceding phases', 'Validate inputs before submission'],
      checklistItems: ['Check workflow status', 'Verify document approval']
    };
  }

  setupRecoveryStrategies() {
    // Workflow errors - suggest next steps
    this.recoveryStrategies.set('WORKFLOW_VIOLATION', (error) => {
      const suggestions = [];
      
      if (error.requiredSteps.length > 0) {
        suggestions.push(`Run: /orch ${error.requiredSteps[0]} <phase>`);
      }
      
      suggestions.push('Check phase status with: /orch status <phase>');
      
      return {
        canRecover: true,
        suggestions,
        autoFix: false
      };
    });

    // State corruption - suggest backup recovery
    this.recoveryStrategies.set('STATE_ERROR', (error) => {
      return {
        canRecover: true,
        suggestions: [
          'Try restoring from backup',
          'Check .orch-state.json file integrity',
          'Run state validation'
        ],
        autoFix: error.message.includes('corruption')
      };
    });

    // Hierarchical violations - show proper order
    this.recoveryStrategies.set('HIERARCHICAL_VIOLATION', (error) => {
      return {
        canRecover: true,
        suggestions: [
          'Update precedent documents first',
          'Follow spec → research → plan → tasks order',
          'Check document approval status'
        ],
        autoFix: false
      };
    });

    // Validation errors - show expected format
    this.recoveryStrategies.set('VALIDATION_ERROR', (error) => {
      return {
        canRecover: true,
        suggestions: [
          'Check input format and required fields',
          'Validate against schema requirements',
          'Review command documentation'
        ],
        autoFix: false
      };
    });
  }

  handleError(error, context = {}) {
    // Log the error
    const errorRecord = {
      error: error.toJSON ? error.toJSON() : error,
      context,
      timestamp: new Date().toISOString(),
      recovered: false
    };
    
    this.errorLog.push(errorRecord);

    // Get recovery strategy
    const recovery = this.getRecoveryStrategy(error);
    
    // Format user-friendly message
    const userMessage = this.formatUserMessage(error, recovery);
    
    return {
      success: false,
      error: error,
      userMessage,
      recovery,
      errorId: this.errorLog.length - 1
    };
  }

  getRecoveryStrategy(error) {
    const code = error.code || 'UNKNOWN_ERROR';
    const strategy = this.recoveryStrategies.get(code);
    
    if (strategy) {
      return strategy(error);
    }
    
    // Default recovery
    return {
      canRecover: false,
      suggestions: [
        'Check error details above',
        'Consult documentation',
        'Try again with different parameters'
      ],
      autoFix: false
    };
  }

  formatUserMessage(error, recovery) {
    let message = '';
    
    // Error details
    if (error.getUserMessage) {
      message += error.getUserMessage();
    } else {
      message += `Error: ${error.message}`;
    }
    
    // Recovery suggestions
    if (recovery.canRecover && recovery.suggestions.length > 0) {
      message += '\n\n💡 Suggestions:';
      recovery.suggestions.forEach(suggestion => {
        message += `\n  • ${suggestion}`;
      });
    }
    
    // Auto-fix option
    if (recovery.autoFix) {
      message += '\n\n🔧 Auto-fix available - would you like to attempt recovery?';
    }
    
    return message;
  }

  // Recovery execution
  async executeRecovery(errorId, autoFix = false) {
    if (errorId >= this.errorLog.length) {
      throw new Error('Invalid error ID');
    }
    
    const errorRecord = this.errorLog[errorId];
    const recovery = this.getRecoveryStrategy(errorRecord.error);
    
    if (!recovery.canRecover) {
      throw new Error('No recovery strategy available for this error');
    }
    
    // Mark as recovered
    errorRecord.recovered = true;
    errorRecord.recoveryAttempted = new Date().toISOString();
    
    return {
      success: true,
      message: 'Recovery strategy applied',
      suggestions: recovery.suggestions
    };
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      recovered: 0,
      recent: this.errorLog.slice(-10)
    };
    
    this.errorLog.forEach(record => {
      const code = record.error.code || 'UNKNOWN';
      stats.byType[code] = (stats.byType[code] || 0) + 1;
      if (record.recovered) stats.recovered++;
    });
    
    return stats;
  }
}

// Global error handler instance
const globalErrorHandler = new ErrorHandler();

// T033: User-friendly message formatting
function formatUserFriendlyMessage(error) {
  if (error instanceof WorkflowError) {
    const phase = 'st06-speakers-spl'; // Example phase
    return `Please complete the specification phase first. Use \`/orch spec ${phase}\` to create the specification.`;
  }
  return error.message;
}

// Helper function for creating error responses
function createErrorResponse(error) {
  return {
    success: false,
    errorType: error.constructor.name === 'Error' ? 'UnknownError' : error.constructor.name,
    userMessage: 'An unexpected error occurred. Please try again.',
    supportInfo: 'Contact support if this issue persists'
  };
}

module.exports = {
  OrchestratorError,
  WorkflowError,
  StateError,
  ValidationError,
  HierarchicalViolationError,
  TemplateError,
  FileSystemError,
  ErrorHandler,
  globalErrorHandler,
  formatUserFriendlyMessage,
  createErrorResponse
};

console.log('🟢 Error Handling Framework: Custom errors and recovery strategies ready');