/**
 * /orch plan Command TDD Test Suite (T095-T101)
 * RED PHASE: Tests written first for implementation planning
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { planCommand } = require('./plan');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('/orch plan Command - TDD Red Phase (T095-T101)', () => {
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-plan');
    testTemplateDir = path.join(__dirname, '../test-templates-plan');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create plan template
    await fs.writeFile(
      path.join(testTemplateDir, 'plan-template.md'),
      '# {{phase}}: {{phaseTitle}} - Implementation Plan\\n\\n## Architecture\\n{{architectureOverview}}\\n\\n## Components\\n{{coreComponents}}\\n\\n## Files\\n{{fileStructure}}'
    );
    
    stateManager = new OrchStateManager(testStateDir);
    templateEngine = new TemplateEngine(testTemplateDir);

    // Setup prerequisite approved research
    await stateManager.save('st06-plan-test', {
      phase: 'st06-plan-test',
      phaseTitle: 'Plan Test Phase',
      currentStep: 'plan',
      completedSteps: ['spec', 'research'],
      approvals: {
        spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 1, approved_by: 'user' },
        research: { timestamp: '2025-09-10T11:00:00Z', iteration: 1, approved_by: 'user' },
        plan: null,
        tasks: null
      },
      iterations: { spec: 1, research: 1, plan: 0, tasks: 0 },
      blockers: [],
      nextAction: 'start_plan',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T11:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });
  });

  afterEach(async () => {
    await fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(testTemplateDir, { recursive: true, force: true }).catch(() => {});
  });

  // RED: T095 - This should fail - planCommand doesn't exist yet
  test('T095: should implement planCommand function', async () => {
    expect(planCommand).toBeDefined();
    expect(typeof planCommand).toBe('function');
  });

  // RED: T096 - This should fail - plan workflow doesn't exist yet
  test('T096: should create implementation plan based on approved research', async () => {
    const result = await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData: {
        architectureOverview: 'Modular component-based architecture',
        coreComponents: 'Audio processing modules, UI components, Data managers',
        fileStructure: 'src/modules/, src/components/, src/utils/'
      }
    });

    expect(result.success).toBe(true);
    expect(result.prerequisiteCheck).toBeDefined();
    expect(result.prerequisiteCheck.researchApproved).toBe(true);
    expect(result.generatedDocument).toContain('Plan Test Phase - Implementation Plan');
    expect(result.basedOnResearch).toBe(true);
  });

  // RED: T097 - This should fail - architecture validation doesn't exist yet
  test('T097: should implement architecture validation', async () => {
    const planData = {
      architectureOverview: 'Component-based modular system with clear separation of concerns',
      coreComponents: [
        { name: 'AudioProcessor', purpose: 'Handle audio analysis', dependencies: ['WebAudioAPI'] },
        { name: 'UIController', purpose: 'Manage user interface', dependencies: ['AudioProcessor'] }
      ],
      integrationPoints: [
        { from: 'UIController', to: 'AudioProcessor', type: 'event-driven' }
      ]
    };

    const result = await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData,
      validateArchitecture: true
    });

    expect(result.architectureValidation).toBeDefined();
    expect(result.architectureValidation.componentsValid).toBe(true);
    expect(result.architectureValidation.integrationValid).toBe(true);
    expect(result.architectureValidation.dependencyGraph).toBeDefined();
    expect(result.generatedDocument).toContain('AudioProcessor');
  });

  // RED: T098 - This should fail - file structure planning doesn't exist yet
  test('T098: should add file structure planning', async () => {
    const planData = {
      architectureOverview: 'Audio analysis toolkit with modular components',
      fileStructure: {
        directories: [
          { path: 'src/audio/', purpose: 'Audio processing modules' },
          { path: 'src/ui/', purpose: 'User interface components' },
          { path: 'src/utils/', purpose: 'Utility functions' }
        ],
        files: [
          { path: 'src/audio/processor.js', purpose: 'Main audio processing engine' },
          { path: 'src/ui/controls.js', purpose: 'Audio control interface' }
        ]
      }
    };

    const result = await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData,
      includeFileStructure: true
    });

    expect(result.fileStructurePlan).toBeDefined();
    expect(result.fileStructurePlan.totalDirectories).toBe(3);
    expect(result.fileStructurePlan.totalFiles).toBe(2);
    expect(result.fileStructurePlan.structureValid).toBe(true);
    expect(result.generatedDocument).toContain('src/audio/processor.js');
  });

  // RED: T099 - This should fail - dependency analysis doesn't exist yet
  test('T099: should implement dependency analysis', async () => {
    const planData = {
      architectureOverview: 'Web audio processing system',
      externalDependencies: [
        { name: 'Web Audio API', version: 'native', purpose: 'Audio processing' },
        { name: 'WebGL', version: 'native', purpose: 'Visualization' }
      ],
      internalDependencies: [
        { from: 'UIController', to: 'AudioProcessor', type: 'direct' },
        { from: 'Visualizer', to: 'AudioProcessor', type: 'observer' }
      ]
    };

    const result = await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData,
      analyzeDependencies: true
    });

    expect(result.dependencyAnalysis).toBeDefined();
    expect(result.dependencyAnalysis.externalCount).toBe(2);
    expect(result.dependencyAnalysis.internalCount).toBe(2);
    expect(result.dependencyAnalysis.circularDependencies).toEqual([]);
    expect(result.dependencyAnalysis.riskAssessment).toBeDefined();
    expect(result.generatedDocument).toContain('Web Audio API');
  });

  // RED: T100 - This should fail - implementation phases don't exist yet
  test('T100: should add implementation phases', async () => {
    const planData = {
      architectureOverview: 'Progressive implementation approach',
      implementationPhases: [
        { 
          phase: 'Phase 1', 
          description: 'Core audio processing foundation',
          deliverables: ['AudioProcessor', 'Basic controls'],
          estimatedDuration: '2 weeks',
          dependencies: []
        },
        { 
          phase: 'Phase 2', 
          description: 'User interface development',
          deliverables: ['UI components', 'Event handling'],
          estimatedDuration: '1 week',
          dependencies: ['Phase 1']
        }
      ]
    };

    const result = await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData,
      includePhases: true
    });

    expect(result.implementationPhases).toBeDefined();
    expect(result.implementationPhases.totalPhases).toBe(2);
    expect(result.implementationPhases.totalDuration).toContain('3 weeks');
    expect(result.implementationPhases.criticalPath).toBeDefined();
    expect(result.generatedDocument).toContain('Phase 1');
    expect(result.generatedDocument).toContain('AudioProcessor');
  });

  // RED: T101 - This should fail - planning quality validation doesn't exist yet
  test('T101: should add planning quality validation', async () => {
    const incompletePlanData = {
      architectureOverview: 'Basic system overview'
      // Missing required planning elements
    };

    const result = await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData: incompletePlanData,
      validateQuality: true
    });

    expect(result.qualityValidation).toBeDefined();
    expect(result.qualityValidation.completeness).toBeLessThan(100);
    expect(result.qualityValidation.missingElements).toContain('coreComponents');
    expect(result.qualityValidation.recommendations).toBeDefined();
    expect(result.qualityValidation.passed).toBe(false);
  });

  // Additional edge case tests
  test('should require approved research before planning', async () => {
    // State without approved research
    await stateManager.save('st06-no-research', {
      phase: 'st06-no-research', phaseTitle: 'No Research Test',
      currentStep: 'plan', completedSteps: ['spec'],
      approvals: { 
        spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 1, approved_by: 'user' },
        research: null, plan: null, tasks: null 
      },
      iterations: { spec: 1, research: 0, plan: 0, tasks: 0 },
      blockers: [], nextAction: 'start_research', dependencies: [],
      metadata: { created: '2025-09-10T09:00:00Z', lastModified: '2025-09-10T10:00:00Z', orchestratorVersion: '1.0.0' }
    });

    const result = await planCommand('st06-no-research', stateManager, {
      templateEngine,
      planData: { architectureOverview: 'Test architecture' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('research must be approved');
    expect(result.prerequisiteCheck.researchApproved).toBe(false);
  });

  test('should handle invalid planning data gracefully', async () => {
    const result = await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData: null
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('plan data is required');
  });

  test('should update state after successful plan generation', async () => {
    await planCommand('st06-plan-test', stateManager, {
      templateEngine,
      planData: {
        architectureOverview: 'Test architecture',
        coreComponents: 'Test components'
      }
    });

    const updatedState = await stateManager.load('st06-plan-test');
    expect(updatedState.currentStep).toBe('plan');
    expect(updatedState.nextAction).toBe('await_plan_approval');
    expect(updatedState.iterations.plan).toBe(1);
  });
});

// TDD Validation: All these tests should FAIL initially (RED phase)
console.log('🔴 TDD RED PHASE: All /orch plan command tests should fail - not implemented yet');