/**
 * /orch tasks Command TDD Test Suite (T109-T115)  
 * RED PHASE: Tests written first for task breakdown
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { tasksCommand } = require('./tasks');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('/orch tasks Command - TDD Red Phase (T109-T115)', () => {
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-tasks');
    testTemplateDir = path.join(__dirname, '../test-templates-tasks');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create tasks template
    await fs.writeFile(
      path.join(testTemplateDir, 'tasks-template.md'),
      '# {{phase}}: {{phaseTitle}} - Task Breakdown\\n\\n## Core Tasks\\n{{coreTasks}}\\n\\n## Dependencies\\n{{taskDependencies}}\\n\\n## Timeline\\n{{estimatedTimeline}}'
    );
    
    stateManager = new OrchStateManager(testStateDir);
    templateEngine = new TemplateEngine(testTemplateDir);

    // Setup prerequisite approved plan
    await stateManager.save('st06-tasks-test', {
      phase: 'st06-tasks-test',
      phaseTitle: 'Tasks Test Phase',
      currentStep: 'tasks',
      completedSteps: ['spec', 'research', 'plan'],
      approvals: {
        spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 1, approved_by: 'user' },
        research: { timestamp: '2025-09-10T11:00:00Z', iteration: 1, approved_by: 'user' },
        plan: { timestamp: '2025-09-10T12:00:00Z', iteration: 1, approved_by: 'user' },
        tasks: null
      },
      iterations: { spec: 1, research: 1, plan: 1, tasks: 0 },
      blockers: [],
      nextAction: 'start_tasks',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T12:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });
  });

  afterEach(async () => {
    await fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(testTemplateDir, { recursive: true, force: true }).catch(() => {});
  });

  // RED: T109 - This should fail - tasksCommand doesn't exist yet
  test('T109: should implement tasksCommand function', async () => {
    expect(tasksCommand).toBeDefined();
    expect(typeof tasksCommand).toBe('function');
  });

  // RED: T110 - This should fail - tasks workflow doesn't exist yet
  test('T110: should create task breakdown based on approved plan', async () => {
    const result = await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData: {
        coreTasks: [
          { id: 'TASK-001', title: 'Setup project structure', description: 'Create initial directories and files' },
          { id: 'TASK-002', title: 'Implement audio processor', description: 'Core audio processing logic' }
        ],
        estimatedTimeline: '2 weeks total development time'
      }
    });

    expect(result.success).toBe(true);
    expect(result.prerequisiteCheck).toBeDefined();
    expect(result.prerequisiteCheck.planApproved).toBe(true);
    expect(result.generatedDocument).toContain('Tasks Test Phase - Task Breakdown');
    expect(result.basedOnPlan).toBe(true);
  });

  // RED: T111 - This should fail - task validation doesn't exist yet
  test('T111: should implement task validation', async () => {
    const tasksData = {
      coreTasks: [
        { 
          id: 'TASK-001', 
          title: 'Setup project structure', 
          description: 'Create initial directories and files',
          priority: 'high',
          estimatedHours: 8,
          assignee: 'developer',
          dependencies: []
        },
        { 
          id: 'TASK-002', 
          title: 'Implement audio processor', 
          description: 'Core audio processing logic',
          priority: 'high',
          estimatedHours: 16,
          assignee: 'developer',
          dependencies: ['TASK-001']
        }
      ]
    };

    const result = await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData,
      validateTasks: true
    });

    expect(result.taskValidation).toBeDefined();
    expect(result.taskValidation.totalTasks).toBe(2);
    expect(result.taskValidation.validTasks).toBe(2);
    expect(result.taskValidation.dependencyValidation.valid).toBe(true);
    expect(result.generatedDocument).toContain('TASK-001');
  });

  // RED: T112 - This should fail - dependency analysis doesn't exist yet
  test('T112: should add task dependency analysis', async () => {
    const tasksData = {
      coreTasks: [
        { id: 'TASK-001', title: 'Foundation', dependencies: [] },
        { id: 'TASK-002', title: 'Core Logic', dependencies: ['TASK-001'] },
        { id: 'TASK-003', title: 'UI Components', dependencies: ['TASK-001'] },
        { id: 'TASK-004', title: 'Integration', dependencies: ['TASK-002', 'TASK-003'] }
      ]
    };

    const result = await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData,
      analyzeDependencies: true
    });

    expect(result.dependencyAnalysis).toBeDefined();
    expect(result.dependencyAnalysis.totalDependencies).toBe(4);
    expect(result.dependencyAnalysis.criticalPath).toBeDefined();
    expect(result.dependencyAnalysis.parallelTasks).toBeDefined();
    expect(result.generatedDocument).toContain('TASK-001');
  });

  // RED: T113 - This should fail - priority management doesn't exist yet
  test('T113: should implement priority management', async () => {
    const tasksData = {
      coreTasks: [
        { id: 'TASK-001', title: 'Critical Setup', priority: 'high' },
        { id: 'TASK-002', title: 'Core Feature', priority: 'high' },
        { id: 'TASK-003', title: 'Enhancement', priority: 'medium' },
        { id: 'TASK-004', title: 'Documentation', priority: 'low' }
      ]
    };

    const result = await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData,
      managePriorities: true
    });

    expect(result.priorityManagement).toBeDefined();
    expect(result.priorityManagement.highPriority).toBe(2);
    expect(result.priorityManagement.mediumPriority).toBe(1);
    expect(result.priorityManagement.lowPriority).toBe(1);
    expect(result.priorityManagement.priorityMatrix).toBeDefined();
    expect(result.generatedDocument).toContain('Critical Setup');
  });

  // RED: T114 - This should fail - timeline estimation doesn't exist yet
  test('T114: should add timeline estimation', async () => {
    const tasksData = {
      coreTasks: [
        { id: 'TASK-001', title: 'Setup', estimatedHours: 8, priority: 'high' },
        { id: 'TASK-002', title: 'Development', estimatedHours: 24, priority: 'high' },
        { id: 'TASK-003', title: 'Testing', estimatedHours: 16, priority: 'medium' }
      ],
      resourceAllocation: {
        developers: 2,
        hoursPerDay: 6
      }
    };

    const result = await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData,
      estimateTimeline: true
    });

    expect(result.timelineEstimation).toBeDefined();
    expect(result.timelineEstimation.totalHours).toBe(48);
    expect(result.timelineEstimation.totalDays).toBeDefined();
    expect(result.timelineEstimation.criticalPathDuration).toBeDefined();
    expect(result.generatedDocument).toContain('48');
  });

  // RED: T115 - This should fail - task quality validation doesn't exist yet
  test('T115: should add task quality validation', async () => {
    const incompleteTasksData = {
      coreTasks: [
        { id: 'TASK-001', title: 'Incomplete Task' }
        // Missing required fields
      ]
    };

    const result = await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData: incompleteTasksData,
      validateQuality: true
    });

    expect(result.qualityValidation).toBeDefined();
    expect(result.qualityValidation.completeness).toBeLessThan(100);
    expect(result.qualityValidation.missingFields).toContain('description');
    expect(result.qualityValidation.recommendations).toBeDefined();
    expect(result.qualityValidation.passed).toBe(false);
  });

  // Additional edge case tests
  test('should require approved plan before task breakdown', async () => {
    // State without approved plan
    await stateManager.save('st06-no-plan', {
      phase: 'st06-no-plan', phaseTitle: 'No Plan Test',
      currentStep: 'tasks', completedSteps: ['spec', 'research'],
      approvals: { 
        spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 1, approved_by: 'user' },
        research: { timestamp: '2025-09-10T11:00:00Z', iteration: 1, approved_by: 'user' },
        plan: null, tasks: null 
      },
      iterations: { spec: 1, research: 1, plan: 0, tasks: 0 },
      blockers: [], nextAction: 'start_plan', dependencies: [],
      metadata: { created: '2025-09-10T09:00:00Z', lastModified: '2025-09-10T11:00:00Z', orchestratorVersion: '1.0.0' }
    });

    const result = await tasksCommand('st06-no-plan', stateManager, {
      templateEngine,
      tasksData: { coreTasks: [{ id: 'TASK-001', title: 'Test task' }] }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('plan must be approved');
    expect(result.prerequisiteCheck.planApproved).toBe(false);
  });

  test('should handle invalid tasks data gracefully', async () => {
    const result = await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData: null
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('tasks data is required');
  });

  test('should update state after successful task breakdown', async () => {
    await tasksCommand('st06-tasks-test', stateManager, {
      templateEngine,
      tasksData: {
        coreTasks: [{ id: 'TASK-001', title: 'Test task', description: 'Test description' }]
      }
    });

    const updatedState = await stateManager.load('st06-tasks-test');
    expect(updatedState.currentStep).toBe('tasks');
    expect(updatedState.nextAction).toBe('await_tasks_approval');
    expect(updatedState.iterations.tasks).toBe(1);
  });
});

// TDD Validation: All these tests should FAIL initially (RED phase)
console.log('🔴 TDD RED PHASE: All /orch tasks command tests should fail - not implemented yet');