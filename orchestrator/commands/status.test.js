/**
 * /orch status Command TDD Test Suite (T060-T066)
 * RED PHASE: Tests written first for status reporting
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { statusCommand } = require('./status');
const { OrchStateManager } = require('../core/state-manager');
const fs = require('fs').promises;
const path = require('path');

describe('/orch status Command - TDD Red Phase (T060-T066)', () => {
  let stateManager;
  let testStateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-status');
    await fs.mkdir(testStateDir, { recursive: true });
    stateManager = new OrchStateManager(testStateDir);
  });

  afterEach(async () => {
    await fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {});
  });

  // RED: T060 - This should fail - statusCommand doesn't exist yet
  test('T060: should implement statusCommand function', async () => {
    expect(statusCommand).toBeDefined();
    expect(typeof statusCommand).toBe('function');
  });

  // RED: T061 - This should fail - phase progress visualization doesn't exist yet
  test('T061: should create phase progress visualization', async () => {
    // Setup test state
    await stateManager.save('st06-speakers-spl', {
      phase: 'st06-speakers-spl',
      phaseTitle: 'Speaker Analysis System',
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
        lastModified: '2025-09-10T10:30:00Z',
        orchestratorVersion: '1.0.0'
      }
    });

    const result = await statusCommand('st06-speakers-spl', stateManager, {});

    expect(result.success).toBe(true);
    expect(result.progressVisualization).toBeDefined();
    expect(result.progressVisualization).toContain('spec ✅');
    expect(result.progressVisualization).toContain('research ⏳');
    expect(result.progressVisualization).toContain('plan ⏸️');
    expect(result.progressVisualization).toContain('tasks ⏸️');
  });

  // RED: T062 - This should fail - workflow position reporting doesn't exist yet
  test('T062: should implement workflow position reporting', async () => {
    await stateManager.save('st06-test', {
      phase: 'st06-test',
      phaseTitle: 'Test Phase',
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
      nextAction: 'await_plan_approval',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T12:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });

    const result = await statusCommand('st06-test', stateManager, {});

    expect(result.workflowPosition).toBeDefined();
    expect(result.workflowPosition.currentStep).toBe('plan');
    expect(result.workflowPosition.completedSteps).toEqual(['spec', 'research']);
    expect(result.workflowPosition.remainingSteps).toEqual(['tasks']);
    expect(result.workflowPosition.progressPercentage).toBe(50); // 2 of 4 steps completed
  });

  // RED: T063 - This should fail - approval status tracking doesn't exist yet
  test('T063: should add approval status tracking', async () => {
    await stateManager.save('st06-test', {
      phase: 'st06-test',
      phaseTitle: 'Test Phase',
      currentStep: 'research',
      completedSteps: ['spec'],
      approvals: {
        spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 2, approved_by: 'user', comments: 'Looks good' },
        research: null,
        plan: null,
        tasks: null
      },
      iterations: { spec: 2, research: 1, plan: 0, tasks: 0 },
      blockers: [],
      nextAction: 'await_research_approval',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T11:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });

    const result = await statusCommand('st06-test', stateManager, {});

    expect(result.approvalStatus).toBeDefined();
    expect(result.approvalStatus.spec).toEqual({
      approved: true,
      timestamp: '2025-09-10T10:00:00Z',
      iteration: 2,
      approved_by: 'user',
      comments: 'Looks good'
    });
    expect(result.approvalStatus.research).toEqual({
      approved: false,
      status: 'pending_approval'
    });
  });

  // RED: T064 - This should fail - next action recommendations don't exist yet
  test('T064: should create next action recommendations', async () => {
    await stateManager.save('st06-test', {
      phase: 'st06-test',
      phaseTitle: 'Test Phase',
      currentStep: 'spec',
      completedSteps: [],
      approvals: { spec: null, research: null, plan: null, tasks: null },
      iterations: { spec: 0, research: 0, plan: 0, tasks: 0 },
      blockers: [
        {
          id: 'dep-missing-001',
          type: 'dependency_missing',
          description: 'st05-mic-calibration not completed',
          created: '2025-09-10T10:00:00Z'
        }
      ],
      nextAction: 'start_specification',
      dependencies: ['st05-mic-calibration'],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T10:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });

    const result = await statusCommand('st06-test', stateManager, {});

    expect(result.nextActions).toBeDefined();
    expect(result.nextActions.primary).toBe('Resolve dependency: st05-mic-calibration');
    expect(result.nextActions.commands).toContain('/orch status st05-mic-calibration');
    expect(result.nextActions.blockers).toHaveLength(1);
    expect(result.nextActions.blockers[0].type).toBe('dependency_missing');
  });

  // RED: T065 - This should fail - status formatting doesn't exist yet
  test('T065: should add status formatting and display', async () => {
    await stateManager.save('st06-test', {
      phase: 'st06-test',
      phaseTitle: 'Test Phase Analysis',
      currentStep: 'research',
      completedSteps: ['spec'],
      approvals: {
        spec: { timestamp: '2025-09-10T10:00:00Z', iteration: 1, approved_by: 'user' },
        research: null,
        plan: null,
        tasks: null
      },
      iterations: { spec: 1, research: 1, plan: 0, tasks: 0 },
      blockers: [],
      nextAction: 'await_research_approval',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T11:30:00Z',
        orchestratorVersion: '1.0.0'
      }
    });

    const result = await statusCommand('st06-test', stateManager, { format: 'detailed' });

    expect(result.formattedDisplay).toBeDefined();
    expect(result.formattedDisplay).toContain('# ST06: Test Phase Analysis');
    expect(result.formattedDisplay).toContain('**Current Step**: research');
    expect(result.formattedDisplay).toContain('**Progress**: 25% (1/4 steps completed)');
    expect(result.formattedDisplay).toContain('**Next Action**: await_research_approval');
  });

  // RED: T066 - This should fail - status command tests don't exist yet
  test('T066: should create status command tests', async () => {
    // Test with non-existent phase
    const result1 = await statusCommand('st99-nonexistent', stateManager, {});
    console.log('DEBUG non-existent result:', JSON.stringify(result1, null, 2));
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('Phase not found');

    // Test with minimal state
    await stateManager.save('st06-minimal', {
      phase: 'st06-minimal',
      phaseTitle: 'Minimal Test',
      currentStep: null,
      completedSteps: [],
      approvals: { spec: null, research: null, plan: null, tasks: null },
      iterations: { spec: 0, research: 0, plan: 0, tasks: 0 },
      blockers: [],
      nextAction: 'start_specification',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T09:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });

    const result2 = await statusCommand('st06-minimal', stateManager, {});
    expect(result2.success).toBe(true);
    expect(result2.workflowPosition.progressPercentage).toBe(0);
  });

  // Additional edge case tests
  test('should handle invalid phase format', async () => {
    const result = await statusCommand('invalid-phase', stateManager, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid phase format');
  });

  test('should provide compact format option', async () => {
    await stateManager.save('st06-compact', {
      phase: 'st06-compact',
      phaseTitle: 'Compact Test',
      currentStep: 'spec',
      completedSteps: [],
      approvals: { spec: null, research: null, plan: null, tasks: null },
      iterations: { spec: 1, research: 0, plan: 0, tasks: 0 },
      blockers: [],
      nextAction: 'await_spec_approval',
      dependencies: [],
      metadata: {
        created: '2025-09-10T09:00:00Z',
        lastModified: '2025-09-10T10:00:00Z',
        orchestratorVersion: '1.0.0'
      }
    });

    const result = await statusCommand('st06-compact', stateManager, { format: 'compact' });

    expect(result.success).toBe(true);
    expect(result.compactStatus).toBeDefined();
    expect(result.compactStatus).toMatch(/st06-compact.*spec.*0%/);
  });

  test('should show time since last activity', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    
    await stateManager.save('st06-timeline', {
      phase: 'st06-timeline',
      phaseTitle: 'Timeline Test',
      currentStep: 'spec',
      completedSteps: [],
      approvals: { spec: null, research: null, plan: null, tasks: null },
      iterations: { spec: 1, research: 0, plan: 0, tasks: 0 },
      blockers: [],
      nextAction: 'await_spec_approval',
      dependencies: [],
      metadata: {
        created: twoDaysAgo,
        lastModified: twoDaysAgo,
        orchestratorVersion: '1.0.0'
      }
    });

    const result = await statusCommand('st06-timeline', stateManager, { includeTimeline: true });

    expect(result.timeline).toBeDefined();
    expect(result.timeline.lastActivity).toContain('2 days ago');
  });
});

// TDD Validation: All these tests should FAIL initially (RED phase)
console.log('🔴 TDD RED PHASE: All /orch status command tests should fail - not implemented yet');