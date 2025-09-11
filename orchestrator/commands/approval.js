/**
 * User Approval Workflow System (T067-T073)
 * TDD GREEN PHASE: Minimal implementation to pass tests
 */

const { ValidationError, WorkflowError } = require('../core/error-handler');

// Simple UUID generator for testing
function generateUUID() {
  return 'approval-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// In-memory approval tracking for testing
const approvalTracking = new Map();

/**
 * T067: Main requestUserApproval function implementation
 */
async function requestUserApproval(type, phase, options = {}) {
  // Validate inputs
  validateApprovalInputs(type, phase, options);

  // Check if required data is present
  if (!options.iteration && options.iteration !== 0) {
    throw new Error('Missing required approval data: iteration is required');
  }

  const approvalId = generateUUID();
  const timestamp = new Date().toISOString();
  const timeoutAt = new Date(Date.now() + (options.timeout || 3600) * 1000).toISOString();

  const approvalRequest = {
    approvalId,
    status: 'pending',
    type,
    phase,
    iteration: options.iteration,
    documentPath: options.documentPath,
    changes: options.changes || [],
    requestedAt: timestamp,
    timeoutAt,
    approvalRequired: true,
    userPrompt: generateUserPrompt(type, phase, options)
  };

  // Store approval request
  approvalTracking.set(approvalId, approvalRequest);

  return approvalRequest;
}

/**
 * T068: Get approval status from state
 */
async function getApprovalStatus(phase, type, stateManager) {
  // Find pending approval for this phase/type
  for (const [approvalId, approval] of approvalTracking.entries()) {
    if (approval.phase === phase && approval.type === type && approval.status === 'pending') {
      return {
        status: 'pending_user_review',
        requestedAt: approval.requestedAt,
        iteration: approval.iteration,
        type: approval.type,
        timeoutAt: approval.timeoutAt,
        approvalId
      };
    }
  }

  return {
    status: 'not_requested',
    type,
    phase
  };
}

/**
 * T069: Create approval iteration
 */
async function createApprovalIteration(phase, type, options = {}) {
  const iterationNumber = options.previousIteration ? options.previousIteration.iterationNumber + 1 : 1;
  
  const iteration = {
    iterationNumber,
    phase,
    type,
    documentContent: options.documentContent,
    changes: options.changes || [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    previousVersions: options.previousIteration ? [options.previousIteration] : []
  };

  // Add changes summary if this is a subsequent iteration
  if (options.previousIteration) {
    iteration.changesSummary = generateChangesSummary(options.changes || []);
  }

  return iteration;
}

/**
 * T070: Process approval response with timestamp recording
 */
async function processApprovalResponse(phase, type, response) {
  const timestamp = new Date().toISOString();
  
  // Handle timeout case
  if (response.timedOut) {
    return {
      status: 'timeout',
      timestamp,
      requiresNewRequest: true,
      originalRequest: response.originalRequest
    };
  }

  // Handle rejection with feedback
  if (!response.approved) {
    return {
      approved: false,
      timestamp,
      approved_by: 'user',
      comments: response.comments,
      feedback: {
        requestedChanges: response.requestedChanges || [],
        comments: response.comments
      },
      requestedChanges: response.requestedChanges || [],
      nextIteration: (response.iteration || 1) + 1,
      status: 'needs_revision',
      iteration: response.iteration
    };
  }

  // Handle approval
  const approvalResponse = {
    approved: true,
    timestamp,
    approved_by: 'user',
    comments: response.comments || '',
    iteration: response.iteration || 1,
    phase,
    type
  };

  return approvalResponse;
}

/**
 * T071: Validate approval workflow
 */
async function validateApprovalWorkflow(phase, type, currentState) {
  const workflowOrder = ['spec', 'research', 'plan', 'tasks'];
  const typeIndex = workflowOrder.indexOf(type);
  
  if (typeIndex === -1) {
    return {
      valid: false,
      canRequestApproval: false,
      error: `Invalid approval type: ${type}`
    };
  }

  const prerequisites = workflowOrder.slice(0, typeIndex);
  const missingPrerequisites = [];

  // Check if all prerequisite steps are approved
  for (const prereq of prerequisites) {
    if (!currentState.approvals[prereq] || !currentState.approvals[prereq].approved_by) {
      missingPrerequisites.push(prereq);
    }
  }

  const valid = missingPrerequisites.length === 0;
  
  return {
    valid,
    canRequestApproval: valid,
    prerequisites,
    missingPrerequisites,
    blockingReason: missingPrerequisites.length > 0 
      ? `${missingPrerequisites.join(', ')} must be approved first`
      : null
  };
}

/**
 * T072: Approval process testing helpers
 */
// This function is mainly tested through the test suite itself
// The implementation supports the full workflow testing

/**
 * T073: Document approval workflow
 */
async function documentApprovalWorkflow() {
  return {
    overview: 'The orchestrator uses a hierarchical approval system that enforces spec → research → plan → tasks workflow order.',
    
    steps: [
      {
        type: 'spec',
        description: 'specification document approval - defines phase objectives and requirements',
        prerequisites: [],
        nextStep: 'research'
      },
      {
        type: 'research', 
        description: 'Research document approval - technical analysis and implementation approaches',
        prerequisites: ['spec'],
        nextStep: 'plan'
      },
      {
        type: 'plan',
        description: 'Implementation plan approval - detailed technical architecture and file structure',
        prerequisites: ['spec', 'research'],
        nextStep: 'tasks'
      },
      {
        type: 'tasks',
        description: 'Task breakdown approval - actionable implementation tasks with dependencies',
        prerequisites: ['spec', 'research', 'plan'],
        nextStep: 'handoff'
      }
    ],
    
    commands: [
      '/orch approve <phase> <type>',
      '/orch approve <phase> <type> --comments "approval comments"',
      '/orch approve <phase> <type> --reject --feedback "requested changes"'
    ],
    
    examples: {
      basicApproval: '/orch approve st06-speakers-spl spec',
      approvalWithComments: '/orch approve st06-speakers-spl spec --comments "Objectives are clear"',
      rejection: '/orch approve st06-speakers-spl spec --reject --feedback "Add more detail to success metrics"'
    },
    
    troubleshooting: {
      'Workflow violation': 'Ensure prerequisite steps are approved first',
      'Missing iteration': 'Specify iteration number for approval tracking',
      'Invalid type': 'Use one of: spec, research, plan, tasks'
    }
  };
}

/**
 * Helper functions
 */

function validateApprovalInputs(type, phase, options) {
  const validTypes = ['spec', 'research', 'plan', 'tasks'];
  
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid approval type: ${type}. Must be one of: ${validTypes.join(', ')}`);
  }

  const phasePattern = /^st\d{2}-[\w-]+$/;
  if (!phasePattern.test(phase)) {
    throw new ValidationError(`Invalid phase format: ${phase}. Expected format: st##-description`);
  }
}

function generateUserPrompt(type, phase, options) {
  const iteration = options.iteration || 1;
  const iterationText = iteration > 1 ? ` (iteration ${iteration})` : '';
  
  return `Please review the ${type} document for ${phase}${iterationText}. ` +
         `${options.changes && options.changes.length > 0 ? 
           `Changes: ${options.changes.join(', ')}. ` : ''}` +
         'Approve or provide feedback for revisions.';
}

function generateChangesSummary(changes) {
  if (changes.length === 0) return 'No changes specified';
  if (changes.length === 1) return changes[0];
  return changes.slice(0, -1).join(', ') + ' and ' + changes[changes.length - 1];
}

// Export all functions
module.exports = {
  requestUserApproval,
  processApprovalResponse,
  getApprovalStatus,
  createApprovalIteration,
  validateApprovalWorkflow,
  documentApprovalWorkflow,
  
  // For testing
  approvalTracking
};

console.log('🟢 TDD GREEN PHASE: User Approval Workflow System implemented with minimal functionality');