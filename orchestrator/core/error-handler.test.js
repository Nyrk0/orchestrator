/**
 * Error Handling Framework TDD Test Suite (T029-T035)
 * RED PHASE: Tests written first for comprehensive error handling
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { 
  globalErrorHandler, 
  WorkflowError, 
  ValidationError, 
  HierarchicalViolationError,
  StateError,
  TemplateError,
  createErrorResponse,
  formatUserFriendlyMessage
} = require('./error-handler');

describe('Error Handling Framework - TDD Red Phase (T029-T035)', () => {
  
  // RED: T029 - This should fail - WorkflowError doesn't exist yet
  test('T029: should create WorkflowError for workflow violations', () => {
    const error = new WorkflowError(
      'Cannot execute research without approved specification',
      'research',
      ['spec-approval']
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('WorkflowError');
    expect(error.message).toContain('Cannot execute research');
    expect(error.currentStep).toBe('research');
    expect(error.requiredSteps).toContain('spec-approval');
    expect(error.code).toBe('WORKFLOW_VIOLATION');
  });

  // RED: T030 - This should fail - StateError doesn't exist yet
  test('T030: should create StateError for state management issues', () => {
    const error = new StateError(
      'Phase state file corrupted',
      'st06-speakers-spl',
      { corruption: 'invalid JSON', lastValidBackup: 'backup-001' }
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('StateError');
    expect(error.phase).toBe('st06-speakers-spl');
    expect(error.stateInfo.corruption).toBe('invalid JSON');
    expect(error.code).toBe('STATE_ERROR');
  });

  // RED: T031 - This should fail - ValidationError doesn't exist yet
  test('T031: should create ValidationError for input validation', () => {
    const error = new ValidationError(
      'Invalid phase format',
      'st99-invalid-name',
      {
        expected: 'st##-description',
        actual: 'st99-invalid-name',
        violations: ['Invalid phase number', 'Name too long']
      }
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.input).toBe('st99-invalid-name');
    expect(error.validationInfo.violations).toHaveLength(2);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  // RED: T031 - This should fail - HierarchicalViolationError doesn't exist yet
  test('T031: should create HierarchicalViolationError for document precedence violations', () => {
    const error = new HierarchicalViolationError(
      'Cannot modify tasks without approved plan',
      'tasks',
      'plan',
      {
        precedentDocument: 'plan.md',
        precedentStatus: 'draft',
        requiredStatus: 'approved'
      }
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('HierarchicalViolationError');
    expect(error.targetDocument).toBe('tasks');
    expect(error.precedentDocument).toBe('plan');
    expect(error.violationInfo.requiredStatus).toBe('approved');
    expect(error.code).toBe('HIERARCHICAL_VIOLATION');
  });

  // RED: T032 - This should fail - error recovery doesn't exist yet
  test('T032: should implement error recovery strategies', async () => {
    const stateError = new StateError('Corrupted state', 'st06-test', { 
      lastValidBackup: 'backup-001' 
    });
    
    const recoveryResult = await globalErrorHandler.attemptRecovery(stateError);
    
    expect(recoveryResult.success).toBe(true);
    expect(recoveryResult.strategy).toBe('state_restoration');
    expect(recoveryResult.backupUsed).toBe('backup-001');
  });

  // RED: T033 - This should fail - user-friendly messaging doesn't exist yet
  test('T033: should create user-friendly error messages', () => {
    const workflowError = new WorkflowError(
      'Technical workflow violation message',
      'research',
      ['spec-approval']
    );
    
    const userMessage = formatUserFriendlyMessage(workflowError);
    
    expect(userMessage).toContain('Please complete the specification phase first');
    expect(userMessage).toContain('Use `/orch spec st06-speakers-spl` to create');
    expect(userMessage).not.toContain('Technical workflow violation');
  });

  // RED: T034 - This should fail - error logging doesn't exist yet
  test('T034: should log errors with debugging information', () => {
    const mockLogger = { error: jest.fn(), debug: jest.fn() };
    globalErrorHandler.setLogger(mockLogger);
    
    const error = new ValidationError('Test validation error', 'invalid-input');
    globalErrorHandler.logError(error, { userId: 'test-user', action: 'spec-creation' });
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'ValidationError',
        message: 'Test validation error',
        context: expect.objectContaining({ userId: 'test-user' })
      })
    );
  });

  // RED: T035 - This should fail - comprehensive error scenarios don't exist yet
  test('T035: should handle complex error scenarios', async () => {
    // Cascading error scenario
    const cascadingErrors = [
      new StateError('Primary state corruption', 'st06-test'),
      new ValidationError('Backup validation failed', 'backup-data'),
      new WorkflowError('Recovery workflow blocked', 'recovery', ['admin-approval'])
    ];
    
    const chainedResult = await globalErrorHandler.handleErrorChain(cascadingErrors);
    
    expect(chainedResult.primaryError).toBe(cascadingErrors[0]);
    expect(chainedResult.recoveryAttempts).toHaveLength(3);
    expect(chainedResult.finalStrategy).toBe('manual_intervention');
    expect(chainedResult.userGuidance).toContain('Please contact support');
  });

  // Additional RED tests for edge cases
  test('should handle unknown error types gracefully', () => {
    const unknownError = new Error('Unknown error type');
    
    const response = createErrorResponse(unknownError);
    
    expect(response.success).toBe(false);
    expect(response.errorType).toBe('UnknownError');
    expect(response.userMessage).toContain('An unexpected error occurred');
    expect(response.supportInfo).toBeDefined();
  });

  test('should validate error recovery prerequisites', () => {
    const error = new StateError('Test state error', 'st06-test');
    
    const canRecover = globalErrorHandler.canAttemptRecovery(error);
    
    expect(typeof canRecover).toBe('boolean');
  });

  test('should format error context for debugging', () => {
    const error = new HierarchicalViolationError(
      'Hierarchy violation',
      'tasks',
      'plan',
      { precedentStatus: 'draft' }
    );
    
    const debugInfo = globalErrorHandler.formatDebugInfo(error);
    
    expect(debugInfo).toHaveProperty('errorChain');
    expect(debugInfo).toHaveProperty('systemState');
    expect(debugInfo).toHaveProperty('recoveryOptions');
  });

  test('should handle concurrent error scenarios', async () => {
    const errors = [
      new StateError('Concurrent state error 1', 'st06-test'),
      new StateError('Concurrent state error 2', 'st07-test')
    ];
    
    const results = await Promise.allSettled(
      errors.map(error => globalErrorHandler.handleError(error))
    );
    
    expect(results).toHaveLength(2);
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
      expect(result.value.success).toBeDefined();
    });
  });

  test('should provide error prevention guidance', () => {
    const error = new WorkflowError('Workflow error', 'research', ['spec-approval']);
    
    const prevention = globalErrorHandler.getPreventionGuidance(error);
    
    expect(prevention).toHaveProperty('recommendations');
    expect(prevention).toHaveProperty('checklistItems');
    expect(prevention.recommendations).toContain('Always complete preceding phases');
  });
});

// TDD Validation: All these tests should FAIL initially (RED phase)
console.log('🔴 TDD RED PHASE: All error handling tests should fail - not implemented yet');