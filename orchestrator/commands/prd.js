/**
 * /orch prd Command Implementation
 * Product Requirements Document generation with semantic analysis
 */

const { ValidationError, WorkflowError } = require('../core/error-handler');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

/**
 * Main prdCommand function implementation
 */
async function prdCommand(phase, stateManager, options = {}) {
  try {
    // Validate prerequisites
    const phaseState = await stateManager.getPhaseState(phase);
    if (!phaseState) {
      return {
        success: false,
        phase,
        error: 'Phase not found. Please run spec command first.',
        validationErrors: ['Phase does not exist']
      };
    }

    // Ensure plan phase is approved before PRD
    if (phaseState.plan !== 'approved') {
      return {
        success: false,
        phase,
        error: 'Plan must be approved before starting PRD',
        validationErrors: ['Plan phase not approved']
      };
    }

    // Read existing specification and plan for semantic analysis
    const phaseDir = `./dev/${phase}`;
    const specContent = await readFileIfExists(path.join(phaseDir, 'spec.md'));
    const planContent = await readFileIfExists(path.join(phaseDir, 'plan.md'));

    // Perform semantic analysis and generate PRD data
    const prdData = options.interactive 
      ? await handleInteractivePRDWorkflow(phase, specContent, planContent, options.inputs || {})
      : await generateAutomaticPRD(phase, specContent, planContent, options.prdData || {});

    // Generate PRD document
    const templateEngine = new TemplateEngine('./templates');
    const prdDocument = await templateEngine.render('prd-template.md', {
      phase_name: prdData.phaseTitle || phase,
      timestamp: new Date().toISOString(),
      phase_status: 'in_progress',
      mvp_goal: prdData.mvpGoal || 'Define MVP goal through semantic analysis',
      key_features: formatKeyFeatures(prdData.keyFeatures || []),
      feature_matrix: formatFeatureMatrix(prdData.features || []),
      user_flow: prdData.userFlow || 'Define core user journey',
      technical_priorities: formatTechnicalPriorities(prdData.technicalPriorities || []),
      success_metrics: formatSuccessMetrics(prdData.successMetrics || []),
      out_of_scope: formatOutOfScope(prdData.outOfScope || []),
      acceptance_criteria: formatAcceptanceCriteria(prdData.acceptanceCriteria || []),
      risk_assessment: formatRiskAssessment(prdData.risks || []),
      estimated_timeline: prdData.estimatedTimeline || 'TBD',
      key_dependencies: formatDependencies(prdData.dependencies || [])
    });

    // Save PRD document
    const prdPath = path.join(phaseDir, 'prd.md');
    await fs.writeFile(prdPath, prdDocument);

    // Update phase state
    await stateManager.updatePhaseState(phase, { prd: 'in_progress' });

    return {
      success: true,
      phase,
      message: 'PRD generated successfully with semantic analysis',
      document: `${phaseDir}/prd.md`,
      data: prdData
    };

  } catch (error) {
    return {
      success: false,
      phase,
      error: error.message,
      validationErrors: [error.message]
    };
  }
}

/**
 * Interactive PRD workflow with intelligent suggestions
 */
async function handleInteractivePRDWorkflow(phase, specContent, planContent, inputs) {
  // Perform semantic analysis on existing documents
  const semanticAnalysis = performSemanticAnalysis(specContent, planContent);
  
  // Interactive workflow would go here in full implementation
  // For now, return structured data based on semantic analysis
  return {
    phaseTitle: inputs.phaseTitle || phase,
    mvpGoal: inputs.mvpGoal || semanticAnalysis.suggestedMVPGoal,
    keyFeatures: inputs.keyFeatures || semanticAnalysis.suggestedFeatures,
    features: semanticAnalysis.featureAnalysis,
    userFlow: inputs.userFlow || semanticAnalysis.suggestedUserFlow,
    technicalPriorities: semanticAnalysis.technicalPriorities,
    successMetrics: inputs.successMetrics || semanticAnalysis.suggestedMetrics,
    outOfScope: inputs.outOfScope || semanticAnalysis.suggestedOutOfScope,
    acceptanceCriteria: semanticAnalysis.acceptanceCriteria,
    risks: semanticAnalysis.riskAssessment,
    estimatedTimeline: inputs.estimatedTimeline || semanticAnalysis.estimatedTimeline,
    dependencies: semanticAnalysis.dependencies
  };
}

/**
 * Automatic PRD generation with semantic analysis
 */
async function generateAutomaticPRD(phase, specContent, planContent, prdData) {
  const semanticAnalysis = performSemanticAnalysis(specContent, planContent);
  
  return {
    phaseTitle: prdData.phaseTitle || phase,
    mvpGoal: prdData.mvpGoal || semanticAnalysis.suggestedMVPGoal,
    keyFeatures: prdData.keyFeatures || semanticAnalysis.suggestedFeatures,
    features: semanticAnalysis.featureAnalysis,
    userFlow: semanticAnalysis.suggestedUserFlow,
    technicalPriorities: semanticAnalysis.technicalPriorities,
    successMetrics: semanticAnalysis.suggestedMetrics,
    outOfScope: semanticAnalysis.suggestedOutOfScope,
    acceptanceCriteria: semanticAnalysis.acceptanceCriteria,
    risks: semanticAnalysis.riskAssessment,
    estimatedTimeline: semanticAnalysis.estimatedTimeline,
    dependencies: semanticAnalysis.dependencies
  };
}

/**
 * Semantic analysis of specification and plan content
 */
function performSemanticAnalysis(specContent, planContent) {
  // Extract key information from documents
  const objectives = extractObjectives(specContent);
  const requirements = extractRequirements(specContent);
  const architecture = extractArchitecture(planContent);
  const components = extractComponents(planContent);

  // Analyze complexity and prioritize features
  const featureAnalysis = analyzeFeatureComplexity(objectives, requirements, components);
  
  // Generate intelligent suggestions based on analysis
  return {
    suggestedMVPGoal: generateMVPGoal(objectives, requirements),
    suggestedFeatures: prioritizeFeatures(featureAnalysis),
    featureAnalysis: featureAnalysis,
    suggestedUserFlow: generateUserFlow(requirements, components),
    technicalPriorities: prioritizeTechnicalComponents(architecture, components),
    suggestedMetrics: generateSuccessMetrics(objectives),
    suggestedOutOfScope: identifyOutOfScope(requirements, featureAnalysis),
    acceptanceCriteria: generateAcceptanceCriteria(requirements),
    riskAssessment: assessRisks(architecture, components),
    estimatedTimeline: estimateTimeline(featureAnalysis),
    dependencies: extractDependencies(planContent)
  };
}

/**
 * Helper functions for semantic analysis
 */
function extractObjectives(content) {
  if (!content) return [];
  
  // Simple extraction - look for objectives, goals, purpose sections
  const objectivePatterns = [
    /objectives?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /goals?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /purpose[:\s]+(.*?)(?=\n\n|\n#|$)/gis
  ];
  
  const objectives = [];
  objectivePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/objectives?[:\s]+/gi, '').trim();
        if (cleaned && cleaned.length > 10) {
          objectives.push(cleaned);
        }
      });
    }
  });
  
  return objectives.length > 0 ? objectives : ['Define core system functionality'];
}

function extractRequirements(content) {
  if (!content) return [];
  
  // Extract requirements, features, functionality
  const requirementPatterns = [
    /requirements?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /features?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /functionality[:\s]+(.*?)(?=\n\n|\n#|$)/gis
  ];
  
  const requirements = [];
  requirementPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/requirements?[:\s]+/gi, '').trim();
        if (cleaned && cleaned.length > 10) {
          requirements.push(cleaned);
        }
      });
    }
  });
  
  return requirements.length > 0 ? requirements : ['Core system requirements'];
}

function extractArchitecture(content) {
  if (!content) return '';
  
  // Extract architecture information
  const archPatterns = [
    /architecture[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /design[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /approach[:\s]+(.*?)(?=\n\n|\n#|$)/gis
  ];
  
  for (const pattern of archPatterns) {
    const match = content.match(pattern);
    if (match && match[0]) {
      return match[0].replace(/architecture[:\s]+/gi, '').trim();
    }
  }
  
  return 'Standard component-based architecture';
}

function extractComponents(content) {
  if (!content) return [];
  
  // Extract components, modules, services
  const componentPatterns = [
    /components?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /modules?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /services?[:\s]+(.*?)(?=\n\n|\n#|$)/gis
  ];
  
  const components = [];
  componentPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/components?[:\s]+/gi, '').trim();
        if (cleaned && cleaned.length > 5) {
          components.push(cleaned);
        }
      });
    }
  });
  
  return components.length > 0 ? components : ['Core components'];
}

function analyzeFeatureComplexity(objectives, requirements, components) {
  // Simple complexity analysis based on content length and keywords
  const features = [...requirements];
  
  return features.map((feature, index) => {
    const complexity = estimateComplexity(feature, components);
    const impact = estimateImpact(feature, objectives);
    
    return {
      name: feature.substring(0, 50) + (feature.length > 50 ? '...' : ''),
      description: feature,
      complexity: complexity,
      impact: impact,
      priority: calculatePriority(impact, complexity)
    };
  });
}

function estimateComplexity(feature, components) {
  const complexityKeywords = ['integration', 'api', 'database', 'authentication', 'security', 'real-time', 'algorithm'];
  const featureLower = feature.toLowerCase();
  
  let complexity = 1; // Low
  
  if (featureLower.length > 100) complexity = 2; // Medium
  if (featureLower.length > 200) complexity = 3; // High
  
  complexityKeywords.forEach(keyword => {
    if (featureLower.includes(keyword)) {
      complexity = Math.min(3, complexity + 1);
    }
  });
  
  const complexityMap = { 1: 'Low', 2: 'Medium', 3: 'High' };
  return complexityMap[complexity];
}

function estimateImpact(feature, objectives) {
  const impactKeywords = ['core', 'essential', 'critical', 'main', 'primary', 'key', 'important'];
  const featureLower = feature.toLowerCase();
  
  let impact = 1; // Low
  
  // Check if feature aligns with objectives
  objectives.forEach(objective => {
    const objLower = objective.toLowerCase();
    const commonWords = featureLower.split(' ').filter(word => objLower.includes(word) && word.length > 3);
    if (commonWords.length > 0) {
      impact = Math.min(3, impact + 1);
    }
  });
  
  impactKeywords.forEach(keyword => {
    if (featureLower.includes(keyword)) {
      impact = Math.min(3, impact + 1);
    }
  });
  
  const impactMap = { 1: 'Low', 2: 'Medium', 3: 'High' };
  return impactMap[impact];
}

function calculatePriority(impact, complexity) {
  const priorityMatrix = {
    'High-Low': 'Critical',
    'High-Medium': 'High', 
    'High-High': 'Medium',
    'Medium-Low': 'High',
    'Medium-Medium': 'Medium',
    'Medium-High': 'Low',
    'Low-Low': 'Medium',
    'Low-Medium': 'Low',
    'Low-High': 'Low'
  };
  
  return priorityMatrix[`${impact}-${complexity}`] || 'Medium';
}

// Formatting helper functions
function formatKeyFeatures(features) {
  if (!features || features.length === 0) {
    return '- Core functionality (to be defined)\n- User interface\n- Basic operations';
  }
  
  return features.map((feature, index) => 
    `- **Feature ${index + 1}:**\n  - **User Story:** As a user, I want to ${feature.toLowerCase()}\n  - **Acceptance Criteria:** Feature is implemented and tested`
  ).join('\n\n');
}

function formatFeatureMatrix(features) {
  if (!features || features.length === 0) {
    return '| Core Feature | High | Medium | Critical |\n| UI Components | Medium | Low | High |';
  }
  
  return features.map(feature => 
    `| ${feature.name} | ${feature.impact} | ${feature.complexity} | ${feature.priority} |`
  ).join('\n');
}

function formatTechnicalPriorities(priorities) {
  if (!priorities || priorities.length === 0) {
    return '1. Core system setup\n2. Data layer implementation\n3. Business logic\n4. User interface\n5. Integration and testing';
  }
  
  return priorities.map((priority, index) => `${index + 1}. ${priority}`).join('\n');
}

function formatSuccessMetrics(metrics) {
  if (!metrics || metrics.length === 0) {
    return '- Feature completeness: 100% of MVP features implemented\n- Quality: All tests pass\n- User experience: Basic functionality works as expected';
  }
  
  return metrics.map(metric => `- ${metric}`).join('\n');
}

function formatOutOfScope(outOfScope) {
  if (!outOfScope || outOfScope.length === 0) {
    return '- Advanced features\n- Performance optimizations\n- Extended integrations\n- Advanced user management';
  }
  
  return outOfScope.map(item => `- ${item}`).join('\n');
}

function formatAcceptanceCriteria(criteria) {
  if (!criteria || criteria.length === 0) {
    return '- All MVP features are implemented\n- Basic functionality works correctly\n- Code is tested and documented\n- System is deployable';
  }
  
  return criteria.map(criterion => `- ${criterion}`).join('\n');
}

function formatRiskAssessment(risks) {
  if (!risks || risks.length === 0) {
    return '- **Technical Risk:** Medium - Standard implementation challenges\n- **Timeline Risk:** Low - Well-defined scope\n- **Integration Risk:** Medium - External dependencies';
  }
  
  return risks.map(risk => `- ${risk}`).join('\n');
}

function formatDependencies(dependencies) {
  if (!dependencies || dependencies.length === 0) {
    return 'Standard development dependencies';
  }
  
  return dependencies.join(', ');
}

// Additional helper functions
function generateMVPGoal(objectives, requirements) {
  if (objectives.length > 0) {
    return `Deliver a functional ${objectives[0].split(' ').slice(0, 8).join(' ')} that provides core value to users.`;
  }
  return 'Deliver a minimum viable product that provides core functionality and user value.';
}

function prioritizeFeatures(featureAnalysis) {
  return featureAnalysis
    .filter(f => f.priority === 'Critical' || f.priority === 'High')
    .slice(0, 5)
    .map(f => f.description);
}

function generateUserFlow(requirements, components) {
  return '1. User accesses the system\n2. Performs core operations\n3. Receives feedback\n4. Achieves primary goal';
}

function prioritizeTechnicalComponents(architecture, components) {
  return [
    'Core system architecture setup',
    'Data layer and storage',
    'Business logic implementation', 
    'User interface development',
    'Integration and testing'
  ];
}

function generateSuccessMetrics(objectives) {
  return [
    'All MVP features implemented and functional',
    'User can complete core workflows',
    'System meets basic performance requirements',
    'Code quality and test coverage standards met'
  ];
}

function identifyOutOfScope(requirements, featureAnalysis) {
  const lowPriorityFeatures = featureAnalysis
    .filter(f => f.priority === 'Low')
    .map(f => f.name);
    
  return [
    ...lowPriorityFeatures,
    'Advanced user management',
    'Performance optimizations',
    'Extended integrations',
    'Advanced reporting features'
  ];
}

function generateAcceptanceCriteria(requirements) {
  return [
    'All defined MVP features are implemented',
    'Core user workflows function correctly',
    'System handles basic error scenarios',
    'Code is properly tested and documented'
  ];
}

function assessRisks(architecture, components) {
  return [
    '**Technical Risk:** Medium - Standard implementation complexity',
    '**Timeline Risk:** Low to Medium - Well-defined MVP scope',
    '**Integration Risk:** Medium - External system dependencies',
    '**User Adoption Risk:** Low - Focused MVP addresses core needs'
  ];
}

function estimateTimeline(featureAnalysis) {
  const totalFeatures = featureAnalysis.length;
  const highComplexity = featureAnalysis.filter(f => f.complexity === 'High').length;
  const mediumComplexity = featureAnalysis.filter(f => f.complexity === 'Medium').length;
  
  const estimatedWeeks = Math.ceil((highComplexity * 2) + (mediumComplexity * 1) + (totalFeatures - highComplexity - mediumComplexity) * 0.5);
  
  return `${estimatedWeeks} weeks (estimated based on feature complexity analysis)`;
}

function extractDependencies(planContent) {
  if (!planContent) return [];
  
  const depPatterns = [
    /dependencies?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /requires?[:\s]+(.*?)(?=\n\n|\n#|$)/gis,
    /depends on[:\s]+(.*?)(?=\n\n|\n#|$)/gis
  ];
  
  const dependencies = [];
  depPatterns.forEach(pattern => {
    const matches = planContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/dependencies?[:\s]+/gi, '').trim();
        if (cleaned && cleaned.length > 5) {
          dependencies.push(cleaned);
        }
      });
    }
  });
  
  return dependencies.length > 0 ? dependencies : [];
}

async function readFileIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

module.exports = {
  prdCommand,
  handleInteractivePRDWorkflow,
  generateAutomaticPRD,
  performSemanticAnalysis
};