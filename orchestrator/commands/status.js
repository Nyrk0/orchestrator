/**
 * /orch status Command Implementation (T060-T066)
 * TDD GREEN PHASE: Minimal implementation to pass tests
 */

const { ValidationError } = require('../core/error-handler');

/**
 * T060: Main statusCommand function implementation
 */
async function statusCommand(phase, stateManager, options = {}) {
  try {
    // Validate phase format
    validatePhaseFormat(phase);

    // Load phase state
    const state = await loadPhaseState(phase, stateManager);
    
    if (!state) {
      return {
        success: false,
        phase,
        error: `Phase not found: ${phase}`
      };
    }

    // T061: Create phase progress visualization
    const progressVisualization = createProgressVisualization(state);

    // T062: Implement workflow position reporting
    const workflowPosition = calculateWorkflowPosition(state);

    // T063: Add approval status tracking
    const approvalStatus = generateApprovalStatus(state);

    // T064: Create next action recommendations
    const nextActions = generateNextActions(state);

    // T065: Add status formatting and display
    const formattedDisplay = options.format === 'detailed' 
      ? formatDetailedStatus(state, workflowPosition, approvalStatus, nextActions)
      : null;

    const compactStatus = options.format === 'compact'
      ? formatCompactStatus(state, workflowPosition)
      : null;

    // T066: Additional features
    const timeline = options.includeTimeline 
      ? generateTimeline(state)
      : null;

    return {
      success: true,
      phase: state.phase,
      phaseTitle: state.phaseTitle,
      progressVisualization,
      workflowPosition,
      approvalStatus,
      nextActions,
      formattedDisplay,
      compactStatus,
      timeline,
      state: state // For debugging
    };

  } catch (error) {
    return {
      success: false,
      phase,
      error: error.message
    };
  }
}

/**
 * Load phase state with error handling
 */
async function loadPhaseState(phase, stateManager) {
  try {
    const state = await stateManager.load(phase);
    return state;
  } catch (error) {
    // Return null for non-existent phases
    return null;
  }
}

/**
 * T061: Create phase progress visualization
 */
function createProgressVisualization(state) {
  const steps = ['spec', 'research', 'plan', 'tasks'];
  const visualization = [];

  steps.forEach(step => {
    let icon;
    if (state.completedSteps.includes(step)) {
      icon = '✅';
    } else if (state.currentStep === step) {
      icon = '⏳';
    } else {
      icon = '⏸️';
    }
    visualization.push(`${step} ${icon}`);
  });

  return visualization.join(' → ');
}

/**
 * T062: Implement workflow position reporting
 */
function calculateWorkflowPosition(state) {
  const allSteps = ['spec', 'research', 'plan', 'tasks'];
  const completedCount = state.completedSteps.length;
  const totalSteps = allSteps.length;
  
  const remainingSteps = allSteps.filter(step => 
    !state.completedSteps.includes(step) && step !== state.currentStep
  );

  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    remainingSteps,
    progressPercentage: Math.round((completedCount / totalSteps) * 100)
  };
}

/**
 * T063: Generate approval status tracking
 */
function generateApprovalStatus(state) {
  const approvalStatus = {};

  ['spec', 'research', 'plan', 'tasks'].forEach(step => {
    if (state.approvals[step]) {
      approvalStatus[step] = {
        approved: true,
        timestamp: state.approvals[step].timestamp,
        iteration: state.approvals[step].iteration,
        approved_by: state.approvals[step].approved_by,
        comments: state.approvals[step].comments
      };
    } else {
      approvalStatus[step] = {
        approved: false,
        status: state.currentStep === step ? 'pending_approval' : 'not_started'
      };
    }
  });

  return approvalStatus;
}

/**
 * T064: Generate next action recommendations
 */
function generateNextActions(state) {
  const blockers = state.blockers || [];
  const commands = [];

  // Determine primary action
  let primaryAction;
  
  if (blockers.length > 0) {
    const depBlocker = blockers.find(b => b.type === 'dependency_missing');
    if (depBlocker) {
      primaryAction = depBlocker.description.includes('st') 
        ? `Resolve dependency: ${depBlocker.description.match(/st\d{2}-[\w-]+/)?.[0] || 'dependency'}`
        : depBlocker.description;
      
      const depMatch = depBlocker.description.match(/(st\d{2}-[\w-]+)/);
      if (depMatch) {
        commands.push(`/orch status ${depMatch[1]}`);
      }
    } else {
      primaryAction = `Resolve blocker: ${blockers[0].description}`;
    }
  } else {
    switch (state.nextAction) {
      case 'start_specification':
        primaryAction = 'Start specification creation';
        commands.push(`/orch spec ${state.phase}`);
        break;
      case 'await_spec_approval':
        primaryAction = 'Approve specification';
        break;
      case 'start_research':
        primaryAction = 'Start research phase';
        commands.push(`/orch research ${state.phase}`);
        break;
      case 'await_research_approval':
        primaryAction = 'Approve research document';
        break;
      case 'start_plan':
        primaryAction = 'Start implementation planning';
        commands.push(`/orch plan ${state.phase}`);
        break;
      case 'await_plan_approval':
        primaryAction = 'Approve implementation plan';
        break;
      case 'start_tasks':
        primaryAction = 'Start task breakdown';
        commands.push(`/orch tasks ${state.phase}`);
        break;
      case 'await_tasks_approval':
        primaryAction = 'Approve task breakdown';
        break;
      default:
        primaryAction = 'Continue workflow';
    }
  }

  return {
    primary: primaryAction,
    commands,
    blockers
  };
}

/**
 * T065: Format detailed status display
 */
function formatDetailedStatus(state, workflowPosition, approvalStatus, nextActions) {
  const lines = [];
  
  // Format: st06-test → ST06: Test Phase Analysis
  const formattedPhase = state.phase.replace('st', 'ST').replace('-', ': ').toUpperCase();
  lines.push(`# ${formattedPhase}: ${state.phaseTitle}`);
  lines.push('');
  lines.push(`**Current Step**: ${state.currentStep || 'not started'}`);
  lines.push(`**Progress**: ${workflowPosition.progressPercentage}% (${state.completedSteps.length}/4 steps completed)`);
  lines.push(`**Next Action**: ${state.nextAction}`);
  lines.push('');
  lines.push('## Workflow Status');
  
  ['spec', 'research', 'plan', 'tasks'].forEach(step => {
    const approval = approvalStatus[step];
    const status = approval.approved 
      ? `✅ Approved (iteration ${approval.iteration})`
      : approval.status === 'pending_approval' 
        ? '⏳ Pending approval'
        : '⏸️ Not started';
    lines.push(`- **${step}**: ${status}`);
  });

  if (nextActions.commands.length > 0) {
    lines.push('');
    lines.push('## Suggested Commands');
    nextActions.commands.forEach(cmd => lines.push(`- ${cmd}`));
  }

  return lines.join('\n');
}

/**
 * Format compact status display
 */
function formatCompactStatus(state, workflowPosition) {
  return `${state.phase} | ${state.currentStep || 'none'} | ${workflowPosition.progressPercentage}%`;
}

/**
 * Generate timeline information
 */
function generateTimeline(state) {
  const now = new Date();
  const lastModified = new Date(state.metadata.lastModified);
  const diffMs = now - lastModified;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let lastActivity;
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      lastActivity = 'just now';
    } else {
      lastActivity = 'today';
    }
  } else if (diffDays === 1) {
    lastActivity = '1 day ago';
  } else {
    lastActivity = `${diffDays} days ago`;
  }

  return {
    lastActivity,
    created: state.metadata.created,
    lastModified: state.metadata.lastModified
  };
}

/**
 * Validate phase format
 */
function validatePhaseFormat(phase) {
  const phasePattern = /^st\d{2}-[\w-]+$/;
  if (!phasePattern.test(phase)) {
    throw new ValidationError(`Invalid phase format: ${phase}. Expected format: st##-description`);
  }
}

module.exports = {
  statusCommand,
  createProgressVisualization,
  calculateWorkflowPosition,
  generateApprovalStatus,
  generateNextActions,
  formatDetailedStatus,
  formatCompactStatus,
  generateTimeline
};

console.log('🟢 TDD GREEN PHASE: /orch status command implemented with minimal functionality');