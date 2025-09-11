/**
 * /orch tasks Command Implementation (T109-T115)
 * TDD GREEN PHASE: Minimal implementation to pass tests
 */

const { ValidationError, WorkflowError } = require('../core/error-handler');
const { TemplateEngine } = require('../core/template-engine');

/**
 * T109: Main tasksCommand function implementation
 */
async function tasksCommand(phase, stateManager, options = {}) {
  try {
    // Validate inputs
    validateTasksInputs(phase, options);

    // T110: Check prerequisite - approved plan
    const prerequisiteCheck = await checkTasksPrerequisites(phase, stateManager);
    
    if (!prerequisiteCheck.planApproved) {
      return {
        success: false,
        phase,
        error: 'plan must be approved before starting task breakdown',
        prerequisiteCheck
      };
    }

    const tasksData = options.tasksData;
    if (!tasksData) {
      return {
        success: false,
        phase,
        error: 'tasks data is required'
      };
    }

    // T111: Task validation
    const taskValidation = options.validateTasks ? 
      validateTasks(tasksData) : null;

    // T112: Task dependency analysis
    const dependencyAnalysis = options.analyzeDependencies ?
      analyzeTaskDependencies(tasksData) : null;

    // T113: Priority management
    const priorityManagement = options.managePriorities ?
      managePriorities(tasksData) : null;

    // T114: Timeline estimation
    const timelineEstimation = options.estimateTimeline ?
      estimateTimeline(tasksData) : null;

    // T115: Task quality validation
    const qualityValidation = options.validateQuality ?
      validateTaskQuality(tasksData) : null;

    // Get phase title from state for proper document generation
    const currentState = await stateManager.load(phase);
    const tasksDataWithTitle = {
      ...tasksData,
      phaseTitle: currentState.phaseTitle || tasksData.phaseTitle
    };

    // Generate tasks document
    const generationResult = await generateTasksDocument(
      phase,
      tasksDataWithTitle,
      options.templateEngine || new TemplateEngine(),
      { taskValidation, dependencyAnalysis, priorityManagement, timelineEstimation }
    );

    // Update state
    await updateTasksState(phase, stateManager, {
      currentStep: 'tasks',
      nextAction: 'await_tasks_approval',
      tasksGenerated: true,
      'iterations.tasks': 1
    });

    return {
      success: true,
      phase,
      prerequisiteCheck,
      generatedDocument: generationResult.content,
      documentPath: `${phase}/tasks.md`,
      basedOnPlan: true,
      taskValidation,
      dependencyAnalysis,
      priorityManagement,
      timelineEstimation,
      qualityValidation
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
 * T110: Check tasks prerequisites
 */
async function checkTasksPrerequisites(phase, stateManager) {
  try {
    const state = await stateManager.load(phase);
    
    const planApproved = !!(
      state.approvals && 
      state.approvals.plan && 
      state.approvals.plan.approved_by
    );

    return {
      planApproved,
      completedSteps: state.completedSteps || [],
      currentStep: state.currentStep
    };
  } catch (error) {
    return {
      planApproved: false,
      error: 'Could not load phase state'
    };
  }
}

/**
 * T111: Validate tasks
 */
function validateTasks(tasksData) {
  const coreTasks = Array.isArray(tasksData.coreTasks) 
    ? tasksData.coreTasks 
    : [];
  
  let validTasks = 0;
  const invalidTasks = [];

  // Validate each task structure
  coreTasks.forEach((task, index) => {
    const requiredFields = ['id', 'title', 'description'];
    const missingFields = requiredFields.filter(field => !task[field]);
    
    if (missingFields.length === 0) {
      validTasks++;
    } else {
      invalidTasks.push({ index, missingFields });
    }
  });

  // Validate dependencies exist
  const taskIds = coreTasks.map(task => task.id);
  const dependencyValidation = validateTaskDependencies(coreTasks, taskIds);

  return {
    totalTasks: coreTasks.length,
    validTasks,
    invalidTasks,
    dependencyValidation
  };
}

/**
 * T112: Analyze task dependencies
 */
function analyzeTaskDependencies(tasksData) {
  const coreTasks = Array.isArray(tasksData.coreTasks) 
    ? tasksData.coreTasks 
    : [];

  let totalDependencies = 0;
  const dependencyMap = {};
  const parallelTasks = [];

  // Build dependency map
  coreTasks.forEach(task => {
    const dependencies = Array.isArray(task.dependencies) ? task.dependencies : [];
    dependencyMap[task.id] = dependencies;
    totalDependencies += dependencies.length;

    // Tasks with no dependencies can run in parallel
    if (dependencies.length === 0) {
      parallelTasks.push(task.id);
    }
  });

  // Find critical path (simplified)
  const criticalPath = findCriticalPath(dependencyMap, coreTasks);

  return {
    totalDependencies,
    dependencyMap,
    criticalPath,
    parallelTasks
  };
}

/**
 * T113: Manage priorities
 */
function managePriorities(tasksData) {
  const coreTasks = Array.isArray(tasksData.coreTasks) 
    ? tasksData.coreTasks 
    : [];

  const priorityCount = {
    high: 0,
    medium: 0,
    low: 0
  };

  const priorityMatrix = {
    high: [],
    medium: [],
    low: []
  };

  coreTasks.forEach(task => {
    const priority = task.priority || 'medium';
    if (priorityCount.hasOwnProperty(priority)) {
      priorityCount[priority]++;
      priorityMatrix[priority].push(task.id);
    } else {
      priorityCount.medium++;
      priorityMatrix.medium.push(task.id);
    }
  });

  return {
    highPriority: priorityCount.high,
    mediumPriority: priorityCount.medium,
    lowPriority: priorityCount.low,
    priorityMatrix
  };
}

/**
 * T114: Estimate timeline
 */
function estimateTimeline(tasksData) {
  const coreTasks = Array.isArray(tasksData.coreTasks) 
    ? tasksData.coreTasks 
    : [];

  const totalHours = coreTasks.reduce((sum, task) => {
    return sum + (task.estimatedHours || 0);
  }, 0);

  // Calculate working days based on resource allocation
  const resourceAllocation = tasksData.resourceAllocation || {};
  const developers = resourceAllocation.developers || 1;
  const hoursPerDay = resourceAllocation.hoursPerDay || 8;

  const totalDays = Math.ceil(totalHours / (developers * hoursPerDay));

  // Critical path duration (simplified - longest chain of dependent tasks)
  const criticalPathDuration = calculateCriticalPathDuration(coreTasks);

  return {
    totalHours,
    totalDays,
    criticalPathDuration,
    resourceUtilization: {
      developers,
      hoursPerDay,
      totalCapacity: developers * hoursPerDay * totalDays
    }
  };
}

/**
 * T115: Validate task quality
 */
function validateTaskQuality(tasksData) {
  const requiredElements = [
    'coreTasks'
  ];

  const requiredTaskFields = [
    'id', 'title', 'description'
  ];

  const missingElements = requiredElements.filter(element => {
    return !tasksData[element] || 
           (Array.isArray(tasksData[element]) && tasksData[element].length === 0);
  });

  // Check task field completeness
  const coreTasks = Array.isArray(tasksData.coreTasks) ? tasksData.coreTasks : [];
  const missingFields = [];
  
  coreTasks.forEach((task, index) => {
    requiredTaskFields.forEach(field => {
      if (!task[field]) {
        missingFields.push(`Task ${index + 1}: missing ${field}`);
      }
    });
  });

  const completeness = Math.round(((requiredElements.length - missingElements.length) / requiredElements.length) * 100);
  
  // Factor in task field completeness
  const totalRequiredFields = coreTasks.length * requiredTaskFields.length;
  const taskFieldCompleteness = totalRequiredFields > 0 
    ? Math.round(((totalRequiredFields - missingFields.length) / totalRequiredFields) * 100)
    : 0;
  
  const overallCompleteness = coreTasks.length > 0 ? taskFieldCompleteness : completeness;

  return {
    completeness: overallCompleteness,
    missingElements,
    missingFields: missingFields.map(field => field.split(': missing ')[1]).filter((v, i, a) => a.indexOf(v) === i),
    passed: overallCompleteness >= 70,
    recommendations: [...missingElements, ...missingFields].length > 0 ? 
      ['Add missing elements and fields for complete task breakdown'] : 
      ['Task quality is adequate']
  };
}

/**
 * Generate tasks document
 */
async function generateTasksDocument(phase, tasksData, templateEngine, extras = {}) {
  try {
    const template = await templateEngine.loadTemplate('tasks-template');
    
    // Build comprehensive tasks content
    let coreTasks = buildCoreTasks(tasksData, extras.taskValidation);
    let taskDependencies = buildTaskDependencies(tasksData, extras.dependencyAnalysis);
    let estimatedTimeline = buildEstimatedTimeline(tasksData, extras.timelineEstimation);
    
    // Add priority breakdown if available
    if (extras.priorityManagement) {
      coreTasks += '\n\n### Priority Breakdown\n';
      coreTasks += `- High Priority: ${extras.priorityManagement.highPriority} tasks\n`;
      coreTasks += `- Medium Priority: ${extras.priorityManagement.mediumPriority} tasks\n`;
      coreTasks += `- Low Priority: ${extras.priorityManagement.lowPriority} tasks\n`;
    }
    
    // Get phase title from state manager if available
    let phaseTitle = tasksData.phaseTitle || extractPhaseTitle(phase);
    
    const templateData = {
      phase,
      phaseTitle: phaseTitle,
      phaseType: 'Task Breakdown Phase',
      timestamp: new Date().toISOString(),
      methodologyReference: '/dev/QUALIA-NSS-METHOD-DIAGRAMS.md',
      ...tasksData,
      ...extras,
      // Override with enhanced content last to prevent being overwritten
      coreTasks: coreTasks || 'Tasks to be defined',
      taskDependencies: taskDependencies || 'Dependencies to be analyzed',
      estimatedTimeline: estimatedTimeline || 'Timeline to be estimated'
    };

    const content = templateEngine.renderTemplate(template, templateData);

    return {
      content,
      templateData,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Failed to generate tasks document: ${error.message}`);
  }
}

/**
 * Update tasks state
 */
async function updateTasksState(phase, stateManager, stateUpdates) {
  try {
    const currentState = await stateManager.load(phase);
    
    // Handle nested property updates
    const updatedState = { ...currentState };
    Object.keys(stateUpdates).forEach(key => {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (!updatedState[parent]) updatedState[parent] = {};
        updatedState[parent][child] = stateUpdates[key];
      } else {
        updatedState[key] = stateUpdates[key];
      }
    });

    updatedState.metadata.lastModified = new Date().toISOString();
    
    await stateManager.save(phase, updatedState);
  } catch (error) {
    throw new Error(`Failed to update tasks state: ${error.message}`);
  }
}

/**
 * Helper functions
 */
function validateTasksInputs(phase, options) {
  const phasePattern = /^st\d{2}-[\w-]+$/;
  if (!phasePattern.test(phase)) {
    throw new ValidationError(`Invalid phase format: ${phase}`);
  }
}

function extractPhaseTitle(phase) {
  return phase.replace(/^st\d{2}-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function validateTaskDependencies(coreTasks, taskIds) {
  const invalidDependencies = [];
  let valid = true;

  coreTasks.forEach(task => {
    const dependencies = Array.isArray(task.dependencies) ? task.dependencies : [];
    dependencies.forEach(dep => {
      if (!taskIds.includes(dep)) {
        invalidDependencies.push({ taskId: task.id, invalidDep: dep });
        valid = false;
      }
    });
  });

  return { valid, invalidDependencies };
}

function findCriticalPath(dependencyMap, coreTasks) {
  // Simplified critical path: find the longest chain
  const visited = new Set();
  let longestPath = [];

  function dfs(taskId, currentPath) {
    if (visited.has(taskId)) return currentPath;
    
    visited.add(taskId);
    const dependencies = dependencyMap[taskId] || [];
    
    if (dependencies.length === 0) {
      return [...currentPath, taskId];
    }
    
    let maxPath = currentPath;
    dependencies.forEach(dep => {
      const path = dfs(dep, [...currentPath, taskId]);
      if (path.length > maxPath.length) {
        maxPath = path;
      }
    });
    
    return maxPath;
  }

  Object.keys(dependencyMap).forEach(taskId => {
    const path = dfs(taskId, []);
    if (path.length > longestPath.length) {
      longestPath = path;
    }
  });

  return longestPath;
}

function calculateCriticalPathDuration(coreTasks) {
  // Simplified: sum of estimated hours for all tasks (assumes sequential)
  return coreTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
}

function buildCoreTasks(tasksData, taskValidation) {
  const coreTasks = Array.isArray(tasksData.coreTasks) ? tasksData.coreTasks : [];
  
  if (coreTasks.length === 0) {
    return 'Tasks to be defined';
  }

  return coreTasks.map(task => {
    let taskStr = `**${task.id}: ${task.title}**\n`;
    taskStr += `${task.description}\n`;
    
    if (task.priority) {
      taskStr += `- Priority: ${task.priority}\n`;
    }
    
    if (task.estimatedHours) {
      taskStr += `- Estimated Hours: ${task.estimatedHours}\n`;
    }
    
    if (task.dependencies && task.dependencies.length > 0) {
      taskStr += `- Dependencies: ${task.dependencies.join(', ')}\n`;
    }
    
    return taskStr;
  }).join('\n');
}

function buildTaskDependencies(tasksData, dependencyAnalysis) {
  if (!dependencyAnalysis || !dependencyAnalysis.dependencyMap) {
    return 'Dependencies to be analyzed';
  }

  let deps = '### Dependency Analysis\n';
  deps += `- Total Dependencies: ${dependencyAnalysis.totalDependencies}\n`;
  deps += `- Parallel Tasks: ${dependencyAnalysis.parallelTasks.join(', ') || 'None'}\n`;
  
  if (dependencyAnalysis.criticalPath && dependencyAnalysis.criticalPath.length > 0) {
    deps += `- Critical Path: ${dependencyAnalysis.criticalPath.join(' → ')}\n`;
  }

  return deps;
}

function buildEstimatedTimeline(tasksData, timelineEstimation) {
  if (!timelineEstimation) {
    return 'Timeline to be estimated';
  }

  let timeline = '### Timeline Estimation\n';
  timeline += `- Total Hours: ${timelineEstimation.totalHours}\n`;
  timeline += `- Total Days: ${timelineEstimation.totalDays}\n`;
  timeline += `- Critical Path Duration: ${timelineEstimation.criticalPathDuration} hours\n`;
  
  if (timelineEstimation.resourceUtilization) {
    timeline += `\n### Resource Utilization\n`;
    timeline += `- Developers: ${timelineEstimation.resourceUtilization.developers}\n`;
    timeline += `- Hours per Day: ${timelineEstimation.resourceUtilization.hoursPerDay}\n`;
  }

  return timeline;
}

module.exports = {
  tasksCommand,
  checkTasksPrerequisites,
  validateTasks,
  analyzeTaskDependencies,
  managePriorities,
  estimateTimeline,
  validateTaskQuality,
  generateTasksDocument
};

console.log('🟢 TDD GREEN PHASE: /orch tasks command implemented with minimal functionality');