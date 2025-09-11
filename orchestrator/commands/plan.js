/**
 * /orch plan Command Implementation (T095-T101)
 * TDD GREEN PHASE: Minimal implementation to pass tests
 */

const { ValidationError, WorkflowError } = require('../core/error-handler');
const { TemplateEngine } = require('../core/template-engine');

/**
 * T095: Main planCommand function implementation
 */
async function planCommand(phase, stateManager, options = {}) {
  try {
    // Validate inputs
    validatePlanInputs(phase, options);

    // T096: Check prerequisite - approved research
    const prerequisiteCheck = await checkPlanPrerequisites(phase, stateManager);
    
    if (!prerequisiteCheck.researchApproved) {
      return {
        success: false,
        phase,
        error: 'research must be approved before starting planning',
        prerequisiteCheck
      };
    }

    const planData = options.planData;
    if (!planData) {
      return {
        success: false,
        phase,
        error: 'plan data is required'
      };
    }

    // T097: Architecture validation
    const architectureValidation = options.validateArchitecture ? 
      validateArchitecture(planData) : null;

    // T098: File structure planning
    const fileStructurePlan = options.includeFileStructure ? 
      processFileStructure(planData) : null;

    // T099: Dependency analysis
    const dependencyAnalysis = options.analyzeDependencies ?
      analyzeDependencies(planData) : null;

    // T100: Implementation phases
    const implementationPhases = options.includePhases ?
      processImplementationPhases(planData) : null;

    // T101: Planning quality validation
    const qualityValidation = options.validateQuality ?
      validatePlanQuality(planData) : null;

    // Get phase title from state for proper document generation
    const currentState = await stateManager.load(phase);
    const planDataWithTitle = {
      ...planData,
      phaseTitle: currentState.phaseTitle || planData.phaseTitle
    };

    // Generate plan document
    const generationResult = await generatePlanDocument(
      phase,
      planDataWithTitle,
      options.templateEngine || new TemplateEngine(),
      { architectureValidation, fileStructurePlan, dependencyAnalysis, implementationPhases }
    );

    // Update state
    await updatePlanState(phase, stateManager, {
      currentStep: 'plan',
      nextAction: 'await_plan_approval',
      planGenerated: true,
      'iterations.plan': 1
    });

    return {
      success: true,
      phase,
      prerequisiteCheck,
      generatedDocument: generationResult.content,
      documentPath: `${phase}/plan.md`,
      basedOnResearch: true,
      architectureValidation,
      fileStructurePlan,
      dependencyAnalysis,
      implementationPhases,
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
 * T096: Check plan prerequisites
 */
async function checkPlanPrerequisites(phase, stateManager) {
  try {
    const state = await stateManager.load(phase);
    
    const researchApproved = !!(
      state.approvals && 
      state.approvals.research && 
      state.approvals.research.approved_by
    );

    return {
      researchApproved,
      completedSteps: state.completedSteps || [],
      currentStep: state.currentStep
    };
  } catch (error) {
    return {
      researchApproved: false,
      error: 'Could not load phase state'
    };
  }
}

/**
 * T097: Validate architecture
 */
function validateArchitecture(planData) {
  const coreComponents = Array.isArray(planData.coreComponents) 
    ? planData.coreComponents 
    : [];
  
  const integrationPoints = Array.isArray(planData.integrationPoints)
    ? planData.integrationPoints
    : [];

  // Validate components structure
  const componentsValid = coreComponents.every(comp => 
    comp.name && comp.purpose && Array.isArray(comp.dependencies)
  );

  // Validate integration points
  const integrationValid = integrationPoints.every(point => 
    point.from && point.to && point.type
  );

  // Create basic dependency graph
  const dependencyGraph = {};
  coreComponents.forEach(comp => {
    dependencyGraph[comp.name] = comp.dependencies || [];
  });

  return {
    componentsValid,
    integrationValid,
    dependencyGraph,
    totalComponents: coreComponents.length,
    totalIntegrations: integrationPoints.length
  };
}

/**
 * T098: Process file structure
 */
function processFileStructure(planData) {
  const fileStructure = planData.fileStructure || {};
  const directories = Array.isArray(fileStructure.directories) 
    ? fileStructure.directories 
    : [];
  const files = Array.isArray(fileStructure.files) 
    ? fileStructure.files 
    : [];

  // Validate structure
  const structureValid = directories.every(dir => dir.path && dir.purpose) &&
                        files.every(file => file.path && file.purpose);

  return {
    totalDirectories: directories.length,
    totalFiles: files.length,
    structureValid,
    directories,
    files
  };
}

/**
 * T099: Analyze dependencies
 */
function analyzeDependencies(planData) {
  const externalDeps = Array.isArray(planData.externalDependencies) 
    ? planData.externalDependencies 
    : [];
  const internalDeps = Array.isArray(planData.internalDependencies)
    ? planData.internalDependencies
    : [];

  // Check for circular dependencies in internal deps
  const circularDependencies = findCircularDependencies(internalDeps);

  // Risk assessment
  const riskAssessment = {
    externalRisks: externalDeps.filter(dep => dep.version === 'native').length,
    internalComplexity: internalDeps.length,
    circularDependencyRisk: circularDependencies.length > 0 ? 'high' : 'low'
  };

  return {
    externalCount: externalDeps.length,
    internalCount: internalDeps.length,
    circularDependencies,
    riskAssessment,
    externalDependencies: externalDeps,
    internalDependencies: internalDeps
  };
}

/**
 * T100: Process implementation phases
 */
function processImplementationPhases(planData) {
  const phases = Array.isArray(planData.implementationPhases) 
    ? planData.implementationPhases 
    : [];

  // Calculate total duration (simplified)
  const totalDuration = phases.reduce((total, phase) => {
    const duration = phase.estimatedDuration || '0 weeks';
    const weeks = parseInt(duration.match(/\d+/)?.[0] || '0');
    return total + weeks;
  }, 0);

  // Identify critical path (phases with dependencies)
  const criticalPath = phases.filter(phase => 
    phase.dependencies && phase.dependencies.length > 0
  ).map(phase => phase.phase);

  return {
    totalPhases: phases.length,
    totalDuration: `${totalDuration} weeks`,
    criticalPath,
    phases
  };
}

/**
 * T101: Validate plan quality
 */
function validatePlanQuality(planData) {
  const requiredElements = [
    'architectureOverview',
    'coreComponents', 
    'fileStructure',
    'implementationPhases'
  ];

  const missingElements = requiredElements.filter(element => {
    return !planData[element] || 
           (typeof planData[element] === 'string' && planData[element].trim().length === 0);
  });

  const completeness = Math.round(((requiredElements.length - missingElements.length) / requiredElements.length) * 100);

  return {
    completeness,
    missingElements,
    passed: completeness >= 75,
    recommendations: missingElements.length > 0 ? 
      [`Add missing elements: ${missingElements.join(', ')}`] : 
      ['Plan quality is adequate']
  };
}

/**
 * Generate plan document
 */
async function generatePlanDocument(phase, planData, templateEngine, extras = {}) {
  try {
    const template = await templateEngine.loadTemplate('plan-template');
    
    // Build comprehensive plan content
    let architectureOverview = buildArchitectureOverview(planData, extras.architectureValidation);
    let coreComponents = buildCoreComponents(planData, extras.architectureValidation);
    let fileStructure = buildFileStructure(planData, extras.fileStructurePlan);
    
    // Add dependency analysis to architecture overview
    if (extras.dependencyAnalysis && extras.dependencyAnalysis.externalDependencies) {
      architectureOverview += '\n\n### External Dependencies\n';
      extras.dependencyAnalysis.externalDependencies.forEach(dep => {
        architectureOverview += `- **${dep.name}** (${dep.version}): ${dep.purpose}\n`;
      });
    }
    
    // Add implementation phases if available
    if (extras.implementationPhases && extras.implementationPhases.phases) {
      architectureOverview += '\n\n### Implementation Approach\n';
      extras.implementationPhases.phases.forEach(phase => {
        architectureOverview += `\n**${phase.phase}:** ${phase.description}\n`;
        if (phase.deliverables) {
          architectureOverview += `- Deliverables: ${phase.deliverables.join(', ')}\n`;
        }
        if (phase.estimatedDuration) {
          architectureOverview += `- Duration: ${phase.estimatedDuration}\n`;
        }
      });
    }
    
    // Get phase title from state manager if available
    let phaseTitle = planData.phaseTitle || extractPhaseTitle(phase);
    
    const templateData = {
      phase,
      phaseTitle: phaseTitle,
      phaseType: 'Implementation Planning Phase',
      timestamp: new Date().toISOString(),
      methodologyReference: '/dev/QUALIA-NSS-METHOD-DIAGRAMS.md',
      ...planData,
      ...extras,
      // Override with enhanced content last to prevent being overwritten
      architectureOverview: architectureOverview || 'Architecture to be defined',
      coreComponents: coreComponents || 'Components to be defined',
      fileStructure: fileStructure || 'File structure to be defined'
    };

    const content = templateEngine.renderTemplate(template, templateData);

    return {
      content,
      templateData,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Failed to generate plan document: ${error.message}`);
  }
}

/**
 * Update plan state
 */
async function updatePlanState(phase, stateManager, stateUpdates) {
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
    throw new Error(`Failed to update plan state: ${error.message}`);
  }
}

/**
 * Helper functions
 */
function validatePlanInputs(phase, options) {
  const phasePattern = /^st\d{2}-[\w-]+$/;
  if (!phasePattern.test(phase)) {
    throw new ValidationError(`Invalid phase format: ${phase}`);
  }
}

function extractPhaseTitle(phase) {
  return phase.replace(/^st\d{2}-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function findCircularDependencies(internalDeps) {
  // Simplified circular dependency detection
  const visited = new Set();
  const recursionStack = new Set();
  const circular = [];

  function hasCycle(node) {
    if (recursionStack.has(node)) {
      circular.push(node);
      return true;
    }
    if (visited.has(node)) return false;

    visited.add(node);
    recursionStack.add(node);

    const deps = internalDeps.filter(dep => dep.from === node);
    for (const dep of deps) {
      if (hasCycle(dep.to)) return true;
    }

    recursionStack.delete(node);
    return false;
  }

  const nodes = [...new Set(internalDeps.flatMap(dep => [dep.from, dep.to]))];
  nodes.forEach(node => {
    if (!visited.has(node)) {
      hasCycle(node);
    }
  });

  return circular;
}

function buildArchitectureOverview(planData, architectureValidation) {
  let overview = planData.architectureOverview || '';
  
  if (architectureValidation) {
    overview += '\n\n### Architecture Analysis\n';
    overview += `- Components: ${architectureValidation.totalComponents} validated\n`;
    overview += `- Integration Points: ${architectureValidation.totalIntegrations}\n`;
    overview += `- Architecture Validation: ${architectureValidation.componentsValid ? 'Passed' : 'Failed'}\n`;
  }
  
  return overview;
}

function buildCoreComponents(planData, architectureValidation) {
  if (Array.isArray(planData.coreComponents)) {
    return planData.coreComponents.map(comp => {
      if (typeof comp === 'object') {
        let compStr = `**${comp.name}:** ${comp.purpose}`;
        if (comp.dependencies && comp.dependencies.length > 0) {
          compStr += `\n- Dependencies: ${comp.dependencies.join(', ')}`;
        }
        return compStr;
      }
      return `- ${comp}`;
    }).join('\n\n');
  }
  return typeof planData.coreComponents === 'string' ? planData.coreComponents : 'Components to be defined';
}

function buildFileStructure(planData, fileStructurePlan) {
  if (fileStructurePlan && fileStructurePlan.directories) {
    let structure = '### Directory Structure\n';
    fileStructurePlan.directories.forEach(dir => {
      structure += `- **${dir.path}:** ${dir.purpose}\n`;
    });
    
    if (fileStructurePlan.files && fileStructurePlan.files.length > 0) {
      structure += '\n### Key Files\n';
      fileStructurePlan.files.forEach(file => {
        structure += `- **${file.path}:** ${file.purpose}\n`;
      });
    }
    
    return structure;
  }
  return typeof planData.fileStructure === 'string' ? planData.fileStructure : 'File structure to be defined';
}

module.exports = {
  planCommand,
  checkPlanPrerequisites,
  validateArchitecture,
  processFileStructure,
  analyzeDependencies,
  processImplementationPhases,
  validatePlanQuality,
  generatePlanDocument
};

console.log('🟢 TDD GREEN PHASE: /orch plan command implemented with minimal functionality');