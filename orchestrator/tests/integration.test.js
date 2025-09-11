/**
 * Orchestrator Integration Test Suite (T116-T122)
 * Tests complete workflow: spec → research → plan → tasks
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { Orchestrator } = require('../core/orchestrator');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('Orchestrator Integration Tests (T116-T122)', () => {
  let orchestrator;
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-integration');
    testTemplateDir = path.join(__dirname, '../test-templates-integration');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create all templates
    await fs.writeFile(
      path.join(testTemplateDir, 'spec-template.md'),
      '# {{phase}}: {{phaseTitle}} - Specification\\n\\n## Objectives\\n{{objectives}}\\n\\n## Requirements\\n{{requirements}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'research-template.md'),
      '# {{phase}}: {{phaseTitle}} - Research\\n\\n## Sources\\n{{primarySources}}\\n\\n## Analysis\\n{{technicalFoundation}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'plan-template.md'),
      '# {{phase}}: {{phaseTitle}} - Implementation Plan\\n\\n## Architecture\\n{{architectureOverview}}\\n\\n## Components\\n{{coreComponents}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'tasks-template.md'),
      '# {{phase}}: {{phaseTitle}} - Task Breakdown\\n\\n## Core Tasks\\n{{coreTasks}}\\n\\n## Timeline\\n{{estimatedTimeline}}'
    );
    
    stateManager = new OrchStateManager(testStateDir);
    templateEngine = new TemplateEngine(testTemplateDir);
    
    orchestrator = new Orchestrator({
      stateManager,
      templateEngine
    });
  });

  afterEach(async () => {
    await fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(testTemplateDir, { recursive: true, force: true }).catch(() => {});
  });

  // T116: Complete workflow integration test
  test('T116: should execute complete spec → research → plan → tasks workflow', async () => {
    const phase = 'st06-integration-test';

    // Step 1: Generate specification
    const specResult = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Implement audio processing module', 'Create user interface'],
        requirements: ['Web Audio API support', 'Real-time processing'],
        dependencies: ['st05-foundation']
      }
    });

    expect(specResult.success).toBe(true);
    expect(specResult.generatedDocument).toContain('Integration Test - Specification');

    // Approve spec
    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Specification approved for testing'
    });

    // Step 2: Generate research based on approved spec
    const researchResult = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: ['Web Audio API Documentation', 'Audio Processing Research Papers'],
        technicalFoundation: 'Real-time audio processing requires efficient algorithms...',
        alternativeAnalysis: {
          approach1: { name: 'WebAssembly', pros: ['Performance'], cons: ['Complexity'] },
          approach2: { name: 'Native JS', pros: ['Simplicity'], cons: ['Performance'] }
        },
        recommendedApproach: 'approach1',
        justification: 'WebAssembly provides better performance for real-time audio'
      }
    });

    expect(researchResult.success).toBe(true);
    expect(researchResult.generatedDocument).toContain('WebAssembly');

    // Approve research
    await orchestrator.processApproval(phase, {
      type: 'research',
      approved: true,
      comments: 'Research approved - WebAssembly approach looks good'
    });

    // Step 3: Generate plan based on approved research
    const planResult = await orchestrator.executeCommand('plan', phase, {
      planData: {
        architectureOverview: 'Modular WebAssembly-based audio processing system',
        coreComponents: [
          { name: 'AudioProcessor', purpose: 'Core audio processing', dependencies: [] },
          { name: 'UIController', purpose: 'User interface management', dependencies: ['AudioProcessor'] }
        ],
        fileStructure: {
          directories: [
            { path: 'src/audio/', purpose: 'Audio processing modules' },
            { path: 'src/ui/', purpose: 'User interface components' }
          ]
        }
      }
    });

    expect(planResult.success).toBe(true);
    expect(planResult.generatedDocument).toContain('AudioProcessor');

    // Approve plan
    await orchestrator.processApproval(phase, {
      type: 'plan',
      approved: true,
      comments: 'Implementation plan approved'
    });

    // Step 4: Generate tasks based on approved plan
    const tasksResult = await orchestrator.executeCommand('tasks', phase, {
      tasksData: {
        coreTasks: [
          { id: 'TASK-001', title: 'Setup WebAssembly Module', description: 'Initialize WASM processing core', priority: 'high', estimatedHours: 16 },
          { id: 'TASK-002', title: 'Implement AudioProcessor', description: 'Core audio processing logic', priority: 'high', estimatedHours: 24, dependencies: ['TASK-001'] },
          { id: 'TASK-003', title: 'Build UI Components', description: 'User interface controls', priority: 'medium', estimatedHours: 12, dependencies: ['TASK-002'] }
        ],
        resourceAllocation: {
          developers: 2,
          hoursPerDay: 8
        }
      }
    });

    expect(tasksResult.success).toBe(true);
    expect(tasksResult.generatedDocument).toContain('TASK-001');

    // Verify final state
    const finalStatus = await orchestrator.getPhaseStatus(phase);
    expect(finalStatus.approvals.spec).toBe(true);
    expect(finalStatus.approvals.research).toBe(true);
    expect(finalStatus.approvals.plan).toBe(true);
    expect(finalStatus.iterations.spec).toBe(1);
  });

  // T117: State consistency validation across workflow
  test('T117: should maintain state consistency throughout workflow', async () => {
    const phase = 'st06-state-consistency';

    // Generate spec and validate initial state
    await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Test state consistency'],
        requirements: ['Proper state management']
      }
    });

    let status = await orchestrator.getPhaseStatus(phase);
    expect(status.currentStep).toBe('spec');
    expect(status.nextAction).toBe('await_spec_approval');
    expect(status.iterations.spec).toBe(1);
    expect(status.approvals.research).toBe(false);

    // Approve spec and proceed to research
    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'State consistency test approval'
    });

    await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Test sources',
        technicalFoundation: 'Test foundation'
      }
    });

    status = await orchestrator.getPhaseStatus(phase);
    expect(status.currentStep).toBe('research');
    expect(status.nextAction).toBe('await_research_approval');
    expect(status.iterations.research).toBe(1);
    expect(status.approvals.spec).toBe(true);

    // Verify state schema compliance
    expect(status).toHaveProperty('phase');
    expect(status).toHaveProperty('approvals');
    expect(status).toHaveProperty('iterations');
  });

  // T118: Error handling and recovery integration
  test('T118: should handle errors and maintain system stability', async () => {
    const phase = 'st06-error-handling';

    // Test invalid phase format
    const invalidResult = await orchestrator.executeCommand('spec', 'invalid-phase', {
      specData: { objectives: ['Test'] }
    });

    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('Invalid phase format');

    // Test workflow violation (research before spec approval)
    await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Test error handling'],
        requirements: ['Proper error responses']
      }
    });

    const researchResult = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Test sources',
        technicalFoundation: 'Test foundation'
      }
    });

    expect(researchResult.success).toBe(false);
    expect(researchResult.error).toContain('Specification must be approved');

    // Verify state wasn't corrupted by error
    const status = await orchestrator.getPhaseStatus(phase);
    expect(status.iterations.research).toBe(0);
    expect(status.currentStep).toBe('spec');
  });

  // T119: Template integration and document consistency
  test('T119: should generate consistent documents across all commands', async () => {
    const phase = 'st06-document-consistency';

    const specResult = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Document consistency test'],
        requirements: ['Template integration']
      }
    });

    // Verify document structure and metadata
    expect(specResult.generatedDocument).toMatch(/# st06-document-consistency: Document Consistency - Specification/);
    expect(specResult.documentPath).toBe('st06-document-consistency/spec.md');
    expect(specResult.orchestrator.command).toBe('spec');

    // Approve and continue to research
    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Document consistency test'
    });

    const researchResult = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Consistency test sources',
        technicalFoundation: 'Consistency test foundation'
      }
    });

    // Verify consistent phase title across documents
    expect(researchResult.generatedDocument).toMatch(/# st06-document-consistency: Document Consistency - Research/);
    expect(researchResult.orchestrator.command).toBe('research');
  });

  // T120: Performance and concurrent operations
  test('T120: should handle concurrent operations efficiently', async () => {
    const phases = ['st06-perf-1', 'st06-perf-2', 'st06-perf-3'];
    
    // Run multiple spec commands concurrently
    const concurrentSpecs = phases.map(phase =>
      orchestrator.executeCommand('spec', phase, {
        specData: {
          objectives: [`Performance test for ${phase}`],
          requirements: ['Concurrent processing support']
        }
      })
    );

    const results = await Promise.all(concurrentSpecs);

    // Verify all succeeded
    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.phase).toBe(phases[index]);
      expect(result.generatedDocument).toContain(`Perf ${index + 1} - Specification`);
    });

    // Verify states are isolated
    for (const phase of phases) {
      const status = await orchestrator.getPhaseStatus(phase);
      expect(status.phase).toBe(phase);
      expect(status.currentStep).toBe('spec');
    }
  });

  // T121: Dependency validation and prerequisite checking
  test('T121: should validate dependencies and prerequisites correctly', async () => {
    const phase = 'st06-dependency-test';

    // Create spec with dependencies
    const specResult = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Dependency validation test'],
        requirements: ['Proper prerequisite checking'],
        dependencies: ['st05-nonexistent']
      }
    });

    expect(specResult.success).toBe(true);
    expect(specResult.dependencyValidation.valid).toBe(false);
    expect(specResult.dependencyValidation.missingDependencies).toContain('st05-nonexistent');

    // Test research prerequisite validation
    const researchResult = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Test sources',
        technicalFoundation: 'Test foundation'
      }
    });

    expect(researchResult.success).toBe(false);
    expect(researchResult.error).toContain('Specification must be approved');
  });

  // T122: Data flow integrity throughout workflow
  test('T122: should maintain data flow integrity throughout workflow', async () => {
    const phase = 'st06-data-flow';
    const testObjective = 'Data flow integrity validation';

    // Step 1: Spec with specific objective
    await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: [testObjective],
        requirements: ['Data consistency across workflow']
      }
    });

    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Data flow test approved'
    });

    // Step 2: Research referencing spec objective
    await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: ['Source related to data flow integrity'],
        technicalFoundation: `Research foundation addressing: ${testObjective}`
      }
    });

    await orchestrator.processApproval(phase, {
      type: 'research',
      approved: true,
      comments: 'Research data flow validated'
    });

    // Step 3: Plan building on research
    await orchestrator.executeCommand('plan', phase, {
      planData: {
        architectureOverview: 'Architecture ensuring data flow integrity',
        coreComponents: [
          { name: 'DataValidator', purpose: 'Ensure data integrity', dependencies: [] }
        ]
      }
    });

    await orchestrator.processApproval(phase, {
      type: 'plan',
      approved: true,
      comments: 'Plan maintains data consistency'
    });

    // Step 4: Tasks implementing plan
    await orchestrator.executeCommand('tasks', phase, {
      tasksData: {
        coreTasks: [
          { id: 'TASK-001', title: 'Implement DataValidator', description: 'Build data validation component', priority: 'high', estimatedHours: 8 }
        ]
      }
    });

    // Verify data flow integrity
    const finalStatus = await orchestrator.getPhaseStatus(phase);
    expect(finalStatus.phaseTitle).toBe('Data Flow');
    expect(finalStatus.approvals.spec).toBe(true);
    expect(finalStatus.approvals.research).toBe(true);
    expect(finalStatus.approvals.plan).toBe(true);
    expect(finalStatus.progress).toBe(75); // 3 out of 4 steps approved
  });
});

console.log('🧪 Integration Test Suite: Complete workflow validation ready');