/**
 * Orchestrator Controller Test Suite (T123-T129)
 * Tests centralized command routing and workflow management
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { Orchestrator } = require('../core/orchestrator');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('Orchestrator Controller Tests (T123-T129)', () => {
  let orchestrator;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-orchestrator');
    testTemplateDir = path.join(__dirname, '../test-templates-orchestrator');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create templates
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
    
    const stateManager = new OrchStateManager(testStateDir);
    const templateEngine = new TemplateEngine(testTemplateDir);
    
    orchestrator = new Orchestrator({
      stateManager,
      templateEngine
    });
  });

  afterEach(async () => {
    await fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(testTemplateDir, { recursive: true, force: true }).catch(() => {});
  });

  // T123: Test command routing
  test('T123: should route commands correctly and handle errors gracefully', async () => {
    const phase = 'st06-routing-test';

    // Test valid command
    const validResult = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Test command routing'],
        requirements: ['Proper error handling']
      }
    });

    expect(validResult.success).toBe(true);
    expect(validResult.orchestrator.command).toBe('spec');
    expect(validResult.generatedDocument).toContain('Routing Test - Specification');

    // Test invalid command
    const invalidResult = await orchestrator.executeCommand('invalid', phase);
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('Invalid command: invalid');

    // Test invalid phase format
    const invalidPhaseResult = await orchestrator.executeCommand('spec', 'invalid-phase');
    expect(invalidPhaseResult.success).toBe(false);
    expect(invalidPhaseResult.error).toContain('Invalid phase format');
  });

  // T124: Test enhanced spec command
  test('T124: should execute spec command with proper phase title extraction', async () => {
    const phase = 'st06-enhanced-spec';

    const result = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Test enhanced spec functionality'],
        requirements: ['Phase title extraction', 'Orchestrator metadata']
      }
    });

    expect(result.success).toBe(true);
    expect(result.orchestrator).toBeDefined();
    expect(result.orchestrator.command).toBe('spec');
    expect(result.orchestrator.version).toBe('1.0.0');
    expect(result.generatedDocument).toContain('Enhanced Spec - Specification');
  });

  // T125: Test research command with prerequisites
  test('T125: should validate prerequisites for research command', async () => {
    const phase = 'st06-research-prereq';

    // Try research without approved spec - should fail
    const failResult = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Test sources',
        technicalFoundation: 'Test foundation'
      }
    });

    expect(failResult.success).toBe(false);
    expect(failResult.error).toContain('Specification must be approved');

    // Create and approve spec first
    await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Research prerequisite test'],
        requirements: ['Spec approval validation']
      }
    });

    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Approved for research test'
    });

    // Now research should succeed
    const successResult = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Test sources for research',
        technicalFoundation: 'Validated research foundation'
      }
    });

    expect(successResult.success).toBe(true);
    expect(successResult.orchestrator.command).toBe('research');
    expect(successResult.generatedDocument).toContain('Research Prereq - Research');
  });

  // T126: Test plan command with architecture validation
  test('T126: should execute plan command with enhanced architecture validation', async () => {
    const phase = 'st06-plan-arch';

    // Setup prerequisites
    await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Plan architecture test'],
        requirements: ['Component validation']
      }
    });

    await orchestrator.processApproval(phase, { type: 'spec', approved: true });

    await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Architecture research',
        technicalFoundation: 'Component-based design principles'
      }
    });

    await orchestrator.processApproval(phase, { type: 'research', approved: true });

    // Execute plan command
    const result = await orchestrator.executeCommand('plan', phase, {
      planData: {
        architectureOverview: 'Component-based architecture for testing',
        coreComponents: [
          { name: 'ComponentA', purpose: 'Base functionality', dependencies: [] },
          { name: 'ComponentB', purpose: 'Extended functionality', dependencies: ['ComponentA'] }
        ]
      }
    });

    expect(result.success).toBe(true);
    expect(result.orchestrator.command).toBe('plan');
    expect(result.generatedDocument).toContain('Plan Arch - Implementation Plan');
  });

  // T127: Test tasks command with timeline validation
  test('T127: should execute tasks command with comprehensive validation', async () => {
    const phase = 'st06-tasks-validation';

    // Setup complete workflow
    const workflowData = {
      spec: {
        objectives: ['Tasks validation test'],
        requirements: ['Timeline estimation', 'Dependency analysis']
      },
      research: {
        primarySources: 'Task management research',
        technicalFoundation: 'Project management methodologies'
      },
      plan: {
        architectureOverview: 'Task-oriented architecture',
        coreComponents: 'Task management system'
      },
      tasks: {
        coreTasks: [
          { id: 'TASK-001', title: 'Setup', description: 'Initial setup', priority: 'high', estimatedHours: 8 },
          { id: 'TASK-002', title: 'Development', description: 'Core development', priority: 'high', estimatedHours: 24, dependencies: ['TASK-001'] }
        ],
        resourceAllocation: { developers: 2, hoursPerDay: 8 }
      },
      autoApprove: { spec: true, research: true, plan: true }
    };

    const result = await orchestrator.executeCompleteWorkflow(phase, workflowData);

    expect(result.success).toBe(true);
    expect(result.steps.spec.success).toBe(true);
    expect(result.steps.research.success).toBe(true);
    expect(result.steps.plan.success).toBe(true);
    expect(result.steps.tasks.success).toBe(true);
  });

  // T128: Test comprehensive phase status
  test('T128: should provide comprehensive phase status information', async () => {
    const phase = 'st06-status-test';

    // Create initial spec
    await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Status reporting test'],
        requirements: ['Comprehensive status information']
      }
    });

    // Get status
    const status = await orchestrator.getPhaseStatus(phase);

    expect(status.success).toBe(true);
    expect(status.phase).toBe(phase);
    expect(status.phaseTitle).toBe('Status Test');
    expect(status.currentStep).toBe('spec');
    expect(status.progress).toBe(0); // No approvals yet
    expect(status.approvals.spec).toBe(false);
    expect(status.iterations.spec).toBe(1);

    // Approve spec and check updated status
    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Status test approval'
    });

    const updatedStatus = await orchestrator.getPhaseStatus(phase);
    expect(updatedStatus.approvals.spec).toBe(true);
    expect(updatedStatus.progress).toBe(25); // 1 out of 4 steps completed
    expect(updatedStatus.nextAction).toBe('start_research');
  });

  // T129: Test approval workflow validation
  test('T129: should handle approval workflow with proper validation', async () => {
    const phase = 'st06-approval-workflow';

    // Create spec
    await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Approval workflow test'],
        requirements: ['Proper approval handling']
      }
    });

    // Test invalid approval type
    const invalidResult = await orchestrator.processApproval(phase, {
      type: 'invalid',
      approved: true
    });

    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('Invalid approval type');

    // Test valid approval
    const validResult = await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Approved for workflow test'
    });

    expect(validResult.success).toBe(true);
    expect(validResult.approved).toBe(true);
    expect(validResult.nextAction).toBe('start_research');

    // Test rejection
    await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: 'Test research sources',
        technicalFoundation: 'Test research foundation'
      }
    });

    const rejectionResult = await orchestrator.processApproval(phase, {
      type: 'research',
      approved: false,
      comments: 'Needs more detail',
      feedback: ['Add more sources', 'Expand technical analysis']
    });

    expect(rejectionResult.success).toBe(true);
    expect(rejectionResult.approved).toBe(false);
    expect(rejectionResult.approvalResponse.feedback).toBeDefined();
  });

  // Test complete workflow execution
  test('should execute complete workflow with all validations', async () => {
    const phase = 'st06-complete-workflow';

    const workflowData = {
      spec: {
        objectives: ['Complete workflow validation', 'End-to-end testing'],
        requirements: ['All commands working', 'Proper state management'],
        dependencies: ['st05-foundation']
      },
      research: {
        primarySources: ['Research paper 1', 'Research paper 2'],
        technicalFoundation: 'Comprehensive technical analysis for workflow testing',
        alternativeAnalysis: {
          approach1: { name: 'Traditional Approach', pros: ['Well-known'], cons: ['Limited'] },
          approach2: { name: 'Modern Approach', pros: ['Flexible'], cons: ['Complex'] }
        },
        recommendedApproach: 'approach2',
        justification: 'Modern approach provides better flexibility'
      },
      plan: {
        architectureOverview: 'Modern, flexible architecture for complete workflow',
        coreComponents: [
          { name: 'CoreEngine', purpose: 'Main processing engine', dependencies: [] },
          { name: 'InterfaceLayer', purpose: 'User interface management', dependencies: ['CoreEngine'] }
        ],
        fileStructure: {
          directories: [
            { path: 'src/core/', purpose: 'Core engine components' },
            { path: 'src/ui/', purpose: 'Interface components' }
          ]
        }
      },
      tasks: {
        coreTasks: [
          { id: 'TASK-001', title: 'Core Engine Setup', description: 'Initialize core processing', priority: 'high', estimatedHours: 16 },
          { id: 'TASK-002', title: 'Interface Development', description: 'Build user interface', priority: 'medium', estimatedHours: 12, dependencies: ['TASK-001'] },
          { id: 'TASK-003', title: 'Integration Testing', description: 'Test complete system', priority: 'medium', estimatedHours: 8, dependencies: ['TASK-002'] }
        ]
      },
      autoApprove: { spec: true, research: true, plan: true }
    };

    const result = await orchestrator.executeCompleteWorkflow(phase, workflowData);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.steps.spec.generatedDocument).toContain('Complete Workflow - Specification');
    expect(result.steps.research.generatedDocument).toContain('Modern Approach');
    expect(result.steps.plan.generatedDocument).toContain('CoreEngine');
    expect(result.steps.tasks.generatedDocument).toContain('TASK-001');

    // Verify final state
    const finalStatus = await orchestrator.getPhaseStatus(phase);
    expect(finalStatus.progress).toBe(75); // 3 out of 4 steps approved
    expect(finalStatus.approvals.spec).toBe(true);
    expect(finalStatus.approvals.research).toBe(true);
    expect(finalStatus.approvals.plan).toBe(true);
  });
});

console.log('🎯 Orchestrator Controller Tests: Command routing and workflow validation ready');