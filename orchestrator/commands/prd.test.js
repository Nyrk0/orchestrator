/**
 * PRD Command Tests
 */

const { prdCommand } = require('./prd');
const fs = require('fs').promises;
const path = require('path');

// Mock state manager
const mockStateManager = {
  getPhaseState: jest.fn(),
  updatePhaseState: jest.fn()
};

describe('PRD Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fail if phase does not exist', async () => {
    mockStateManager.getPhaseState.mockResolvedValue(null);
    
    const result = await prdCommand('st01-test', mockStateManager);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Phase not found');
  });

  test('should fail if plan is not approved', async () => {
    mockStateManager.getPhaseState.mockResolvedValue({
      plan: 'in_progress'
    });
    
    const result = await prdCommand('st01-test', mockStateManager);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Plan must be approved before starting PRD');
  });

  test('should generate PRD with semantic analysis', async () => {
    mockStateManager.getPhaseState.mockResolvedValue({
      plan: 'approved'
    });
    
    const result = await prdCommand('st01-test', mockStateManager, {
      prdData: {
        mvpGoal: 'Test MVP goal',
        keyFeatures: ['Feature 1', 'Feature 2']
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('PRD generated successfully');
  });
});