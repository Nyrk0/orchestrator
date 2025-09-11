/**
 * /orch research Command TDD Test Suite (T081-T087)
 * RED PHASE: Tests written first for research documentation
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { researchCommand } = require('./research');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('/orch research Command - TDD Red Phase (T081-T087)', () => {
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-research');
    testTemplateDir = path.join(__dirname, '../test-templates-research');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create research template
    await fs.writeFile(
      path.join(testTemplateDir, 'research-template.md'),
      '# {{phase}}: {{phaseTitle}} - Research\n\n## Sources\n{{primarySources}}\n\n## Analysis\n{{technicalFoundation}}'
    );
    
    stateManager = new OrchStateManager(testStateDir);
    templateEngine = new TemplateEngine(testTemplateDir);

    // Setup prerequisite approved spec
    await stateManager.save('st06-research-test', {
      phase: 'st06-research-test',
      phaseTitle: 'Research Test Phase',
      currentStep: 'research',
      completedSteps: ['spec'],
      approvals: {
        spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 1, approved_by: 'user' },
        research: null,
        plan: null,
        tasks: null
      },
      iterations: { spec: 1, research: 0, plan: 0, tasks: 0 },
      blockers: [],
      nextAction: 'start_research',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T10:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });
  });

  afterEach(async () => {
    await fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(testTemplateDir, { recursive: true, force: true }).catch(() => {});
  });

  // RED: T081 - This should fail - researchCommand doesn't exist yet
  test('T081: should implement researchCommand function', async () => {
    expect(researchCommand).toBeDefined();
    expect(typeof researchCommand).toBe('function');
  });

  // RED: T082 - This should fail - research workflow doesn't exist yet
  test('T082: should create research workflow based on approved specification', async () => {
    const result = await researchCommand('st06-research-test', stateManager, {
      templateEngine,
      researchData: {
        primarySources: 'IEEE papers on speaker analysis',
        technicalFoundation: 'Frequency response measurement techniques'
      }
    });

    expect(result.success).toBe(true);
    expect(result.prerequisiteCheck).toBeDefined();
    expect(result.prerequisiteCheck.specApproved).toBe(true);
    expect(result.generatedDocument).toContain('Research Test Phase - Research');
    expect(result.basedOnSpecification).toBe(true);
  });

  // RED: T083 - This should fail - source citation validation doesn't exist yet
  test('T083: should implement source citation validation', async () => {
    const researchData = {
      primarySources: [
        { title: 'Speaker Measurement Techniques', author: 'Smith, J.', year: 2023, type: 'journal' },
        { title: 'Audio Analysis Methods', url: 'https://example.com/audio', type: 'web', accessed: '2025-09-10' }
      ],
      secondarySources: [
        { title: 'Background Theory', author: 'Doe, A.', year: 2022, type: 'book' }
      ]
    };

    const result = await researchCommand('st06-research-test', stateManager, {
      templateEngine,
      researchData,
      validateSources: true
    });

    expect(result.sourceValidation).toBeDefined();
    expect(result.sourceValidation.valid).toBe(true);
    expect(result.sourceValidation.totalSources).toBe(3);
    expect(result.sourceValidation.citationFormat).toBe('APA');
    expect(result.formattedSources.primary).toBeDefined();
    expect(result.formattedSources.secondary).toBeDefined();
  });

  // RED: T084 - This should fail - technical analysis framework doesn't exist yet
  test('T084: should add technical analysis framework', async () => {
    const researchData = {
      technicalFoundation: 'Speaker frequency response analysis requires...',
      alternativeAnalysis: {
        approach1: { name: 'FFT Analysis', pros: ['Fast'], cons: ['Memory intensive'] },
        approach2: { name: 'Swept Sine', pros: ['Accurate'], cons: ['Slower'] }
      },
      recommendedApproach: 'approach1',
      justification: 'FFT provides better performance for real-time analysis'
    };

    const result = await researchCommand('st06-research-test', stateManager, {
      templateEngine,
      researchData,
      includeAnalysis: true
    });

    expect(result.technicalAnalysis).toBeDefined();
    expect(result.technicalAnalysis.alternativesConsidered).toBe(2);
    expect(result.technicalAnalysis.recommendedApproach).toBe('approach1');
    expect(result.technicalAnalysis.justification).toContain('FFT provides');
    expect(result.generatedDocument).toContain('FFT Analysis');
  });

  // RED: T085 - This should fail - risk assessment doesn't exist yet
  test('T085: should implement risk assessment generation', async () => {
    const researchData = {
      riskAnalysis: {
        technical: [
          { risk: 'Performance bottlenecks', impact: 'high', probability: 'medium', mitigation: 'Optimize algorithms' }
        ],
        resource: [
          { risk: 'Limited documentation', impact: 'medium', probability: 'high', mitigation: 'Create comprehensive docs' }
        ]
      }
    };

    const result = await researchCommand('st06-research-test', stateManager, {
      templateEngine,
      researchData,
      includeRiskAssessment: true
    });

    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.totalRisks).toBe(2);
    expect(result.riskAssessment.highImpactRisks).toBe(1);
    expect(result.riskAssessment.mitigationStrategies).toHaveLength(2);
    expect(result.generatedDocument).toContain('Performance bottlenecks');
  });

  // RED: T086 - This should fail - research quality validation doesn't exist yet
  test('T086: should add research quality validation', async () => {
    const incompleteResearchData = {
      primarySources: 'Some sources'
      // Missing required fields
    };

    const result = await researchCommand('st06-research-test', stateManager, {
      templateEngine,
      researchData: incompleteResearchData,
      validateQuality: true
    });

    expect(result.qualityValidation).toBeDefined();
    expect(result.qualityValidation.completeness).toBeLessThan(100);
    expect(result.qualityValidation.missingElements).toContain('technicalFoundation');
    expect(result.qualityValidation.recommendations).toBeDefined();
    expect(result.qualityValidation.passed).toBe(false);
  });

  // RED: T087 - This should fail - comprehensive testing doesn't exist yet
  test('T087: should create comprehensive testing', async () => {
    const testScenarios = [
      { 
        phase: 'st06-audio-analysis', 
        domain: 'audio',
        expectedSources: ['IEEE', 'ACM'],
        expectedAnalysis: 'frequency domain'
      },
      {
        phase: 'st07-ui-research',
        domain: 'frontend', 
        expectedSources: ['MDN', 'W3C'],
        expectedAnalysis: 'user interface'
      }
    ];

    for (const scenario of testScenarios) {
      // Setup state
      await stateManager.save(scenario.phase, {
        phase: scenario.phase,
        phaseTitle: `${scenario.domain} research`,
        currentStep: 'research',
        completedSteps: ['spec'],
        approvals: {
          spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 1, approved_by: 'user' },
          research: null, plan: null, tasks: null
        },
        iterations: { spec: 1, research: 0, plan: 0, tasks: 0 },
        blockers: [], nextAction: 'start_research', dependencies: [],
        metadata: { created: '2025-09-10T09:00:00Z', lastModified: '2025-09-10T10:00:00Z', orchestratorVersion: '1.0.0' }
      });

      const result = await researchCommand(scenario.phase, stateManager, {
        templateEngine,
        researchData: {
          primarySources: scenario.expectedSources.join(', '),
          technicalFoundation: `Analysis focusing on ${scenario.expectedAnalysis}`
        },
        comprehensiveTest: true
      });

      expect(result.success).toBe(true);
      expect(result.domainSpecific).toBe(true);
      expect(result.generatedDocument).toContain(scenario.expectedAnalysis);
    }
  });

  // Additional edge case tests
  test('should require approved specification before research', async () => {
    // State without approved spec
    await stateManager.save('st06-no-spec', {
      phase: 'st06-no-spec', phaseTitle: 'No Spec Test',
      currentStep: 'research', completedSteps: [],
      approvals: { spec: null, research: null, plan: null, tasks: null },
      iterations: { spec: 0, research: 0, plan: 0, tasks: 0 },
      blockers: [], nextAction: 'start_specification', dependencies: [],
      metadata: { created: '2025-09-10T09:00:00Z', lastModified: '2025-09-10T10:00:00Z', orchestratorVersion: '1.0.0' }
    });

    const result = await researchCommand('st06-no-spec', stateManager, {
      templateEngine,
      researchData: { primarySources: 'Test sources' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('specification must be approved');
    expect(result.prerequisiteCheck.specApproved).toBe(false);
  });

  test('should handle invalid research data gracefully', async () => {
    const result = await researchCommand('st06-research-test', stateManager, {
      templateEngine,
      researchData: null
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('research data is required');
  });

  test('should update state after successful research generation', async () => {
    await researchCommand('st06-research-test', stateManager, {
      templateEngine,
      researchData: {
        primarySources: 'Test sources',
        technicalFoundation: 'Test analysis'
      }
    });

    const updatedState = await stateManager.load('st06-research-test');
    expect(updatedState.currentStep).toBe('research');
    expect(updatedState.nextAction).toBe('await_research_approval');
    expect(updatedState.iterations.research).toBe(1);
  });
});

// TDD Validation: All these tests should FAIL initially (RED phase)
console.log('🔴 TDD RED PHASE: All /orch research command tests should fail - not implemented yet');