/**
 * /orch spec Command TDD Test Suite (T053-T059)
 * RED PHASE: Tests written first for specification generation
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { specCommand } = require('./spec');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('/orch spec Command - TDD Red Phase (T053-T059)', () => {
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states');
    testTemplateDir = path.join(__dirname, '../test-templates');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    stateManager = new OrchStateManager(testStateDir);
    templateEngine = new TemplateEngine(testTemplateDir);
  });

  afterEach(async () => {
    await fs.rmdir(testStateDir, { recursive: true }).catch(() => {});
    await fs.rmdir(testTemplateDir, { recursive: true }).catch(() => {});
  });

  // RED: T053 - This should fail - specCommand doesn't exist yet
  test('T053: should implement specCommand function', async () => {
    expect(specCommand).toBeDefined();
    expect(typeof specCommand).toBe('function');
  });

  // RED: T054 - This should fail - interactive workflow doesn't exist yet
  test('T054: should create interactive specification gathering workflow', async () => {
    const mockUserInputs = {
      phaseTitle: 'Speaker Analysis System',
      phaseType: 'Audio Processing',
      objectives: 'Implement speaker measurement and analysis',
      userStories: [
        { actor: 'engineer', want: 'measure speaker response', outcome: 'accurate analysis' }
      ]
    };

    const result = await specCommand('st06-speakers-spl', stateManager, {
      interactive: true,
      inputs: mockUserInputs
    });

    expect(result.success).toBe(true);
    expect(result.workflow).toBe('interactive');
    expect(result.userInputs).toEqual(mockUserInputs);
  });

  // RED: T055 - This should fail - phase dependency validation doesn't exist yet
  test('T055: should implement phase dependency validation', async () => {
    // Mock existing dependencies
    await stateManager.save('st05-mic-calibration', {
      phase: 'st05-mic-calibration',
      status: 'completed',
      approvals: { spec: true, research: true, plan: true, tasks: true }
    });

    const result = await specCommand('st06-speakers-spl', stateManager, {
      dependencies: ['st05-mic-calibration']
    });

    expect(result.dependencyValidation).toBeDefined();
    expect(result.dependencyValidation.valid).toBe(true);
    expect(result.dependencyValidation.resolvedDependencies).toContain('st05-mic-calibration');
  });

  // RED: T056 - This should fail - document generation doesn't exist yet
  test('T056: should implement specification document generation', async () => {
    // Create test template
    const template = '# {{phase}}: {{phaseTitle}}\n\n{{objectives}}';
    await fs.writeFile(path.join(testTemplateDir, 'spec-template.md'), template);

    const specData = {
      phaseTitle: 'Speaker Analysis',
      objectives: 'Implement comprehensive speaker measurement system'
    };

    const result = await specCommand('st06-speakers-spl', stateManager, {
      templateEngine,
      specData
    });

    expect(result.generatedDocument).toBeDefined();
    expect(result.generatedDocument).toContain('# st06-speakers-spl: Speaker Analysis');
    expect(result.documentPath).toBe('st06-speakers-spl/spec.md');
  });

  // RED: T057 - This should fail - user approval workflow doesn't exist yet
  test('T057: should add user approval workflow integration', async () => {
    const specData = { phaseTitle: 'Test Phase', objectives: 'Test objectives' };

    const result = await specCommand('st06-test', stateManager, {
      specData,
      requireApproval: true
    });

    expect(result.approvalRequired).toBe(true);
    expect(result.approvalStatus).toBe('pending');
    expect(result.approvalMessage).toContain('Please review the generated specification');
  });

  // RED: T058 - This should fail - iteration support doesn't exist yet
  test('T058: should implement specification iteration support', async () => {
    // First iteration
    const initialData = { phaseTitle: 'Initial Title', objectives: 'Initial objectives' };
    const result1 = await specCommand('st06-test', stateManager, {
      specData: initialData,
      iteration: 1
    });

    // Second iteration with changes
    const updatedData = { phaseTitle: 'Updated Title', objectives: 'Updated objectives' };
    const result2 = await specCommand('st06-test', stateManager, {
      specData: updatedData,
      iteration: 2,
      previousIteration: result1
    });

    expect(result2.iterationNumber).toBe(2);
    expect(result2.previousVersions).toHaveLength(1);
    expect(result2.changes).toBeDefined();
    expect(result2.changes.phaseTitle).toEqual({
      from: 'Initial Title',
      to: 'Updated Title'
    });
  });

  // RED: T059 - This should fail - comprehensive testing doesn't exist yet
  test('T059: should add comprehensive testing with auto-verification', async () => {
    const testScenarios = [
      { phase: 'st06-speakers-spl', type: 'audio-processing' },
      { phase: 'st07-psychoacoustics', type: 'analysis' },
      { phase: 'st08-pwa', type: 'frontend' }
    ];

    for (const scenario of testScenarios) {
      const result = await specCommand(scenario.phase, stateManager, {
        specData: {
          phaseTitle: `Test ${scenario.type}`,
          phaseType: scenario.type,
          objectives: `Test objectives for ${scenario.type}`
        },
        autoVerify: true
      });

      expect(result.success).toBe(true);
      expect(result.autoVerification).toBeDefined();
      expect(result.autoVerification.templateValid).toBe(true);
      expect(result.autoVerification.dataComplete).toBe(true);
      expect(result.autoVerification.schemaValid).toBe(true);
    }
  });

  // Additional edge case tests
  test('should handle invalid phase format', async () => {
    await expect(specCommand('invalid-phase', stateManager, {}))
      .rejects.toThrow('Invalid phase format');
  });

  test('should handle missing template', async () => {
    const result = await specCommand('st06-test', stateManager, {
      templateEngine,
      specData: { phaseTitle: 'Test' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Template not found');
  });

  test('should validate required specification data', async () => {
    const incompleteData = { phaseTitle: 'Test' }; // Missing required fields

    const result = await specCommand('st06-test', stateManager, {
      specData: incompleteData,
      validateRequired: true
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors).toBeDefined();
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });

  test('should handle concurrent specification generation', async () => {
    const promises = [
      specCommand('st06-test1', stateManager, { specData: { phaseTitle: 'Test 1' } }),
      specCommand('st06-test2', stateManager, { specData: { phaseTitle: 'Test 2' } }),
      specCommand('st06-test3', stateManager, { specData: { phaseTitle: 'Test 3' } })
    ];

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      expect(result.status).toBe('fulfilled');
      expect(result.value.success).toBe(true);
      expect(result.value.phase).toBe(`st06-test${index + 1}`);
    });
  });

  test('should preserve state consistency during spec generation', async () => {
    const initialState = await stateManager.load('st06-test');
    
    await specCommand('st06-test', stateManager, {
      specData: { phaseTitle: 'Consistency Test' }
    });

    const finalState = await stateManager.load('st06-test');
    
    expect(finalState.phase).toBe('st06-test');
    expect(finalState.currentStep).toBe('spec');
    expect(finalState.approvals.spec).toBe(false); // Initially pending
  });
});

// TDD Validation: All these tests should FAIL initially (RED phase)
console.log('🔴 TDD RED PHASE: All /orch spec command tests should fail - not implemented yet');