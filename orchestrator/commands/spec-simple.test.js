/**
 * Simplified /orch spec Command Test - Focus on GREEN phase
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { specCommand } = require('./spec');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('Simplified /orch spec Command', () => {
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-simple');
    testTemplateDir = path.join(__dirname, '../test-templates-simple');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create a simple template
    await fs.writeFile(
      path.join(testTemplateDir, 'spec-template.md'), 
      '# {{phase}}: {{phaseTitle}}\n\nObjectives: {{objectives}}'
    );
    
    stateManager = new OrchStateManager(testStateDir);
    templateEngine = new TemplateEngine(testTemplateDir);
  });

  afterEach(async () => {
    await fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(testTemplateDir, { recursive: true, force: true }).catch(() => {});
  });

  test('should generate basic specification document', async () => {
    const result = await specCommand('st06-test', stateManager, {
      templateEngine,
      specData: {
        phaseTitle: 'Test Phase',
        objectives: 'Test objectives'
      }
    });

    console.log('DEBUG: result =', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    expect(result.generatedDocument).toContain('# st06-test: Test Phase');
    expect(result.generatedDocument).toContain('Objectives: Test objectives');
  });
});

console.log('🔧 Simplified /orch spec test for debugging GREEN phase');