/**
 * TemplateEngine TDD Test Suite  
 * RED PHASE: Tests written first, expect failures
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs').promises;
const path = require('path');
const { TemplateEngine } = require('./template-engine');

describe('TemplateEngine - TDD Red Phase', () => {
  let templateEngine;
  let testTemplatesPath;

  beforeEach(async () => {
    testTemplatesPath = path.join(__dirname, '../test-templates');
    templateEngine = new TemplateEngine(testTemplatesPath);
    
    // Create test templates directory
    await fs.mkdir(testTemplatesPath, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test files
    try {
      await fs.rm(testTemplatesPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // RED: This should fail - TemplateEngine doesn't exist yet
  test('should create TemplateEngine instance', () => {
    expect(templateEngine).toBeDefined();
    expect(templateEngine.templatesPath).toBe(testTemplatesPath);
  });

  // RED: This should fail - loadTemplate method doesn't exist yet
  test('should load template from file', async () => {
    const templateContent = 'Hello {{name}}, welcome to {{project}}!';
    await fs.writeFile(
      path.join(testTemplatesPath, 'test-template.md'),
      templateContent
    );

    const loadedTemplate = await templateEngine.loadTemplate('test-template');
    expect(loadedTemplate).toBe(templateContent);
  });

  // RED: This should fail - renderTemplate method doesn't exist yet
  test('should render template with variable substitution', () => {
    const template = 'Phase: {{phase}}\nTitle: {{phaseTitle}}\nDate: {{timestamp}}';
    const data = {
      phase: 'st06-speakers-spl',
      phaseTitle: 'Speaker Analysis',
      timestamp: '2025-09-09'
    };

    const rendered = templateEngine.renderTemplate(template, data);
    expect(rendered).toContain('Phase: st06-speakers-spl');
    expect(rendered).toContain('Title: Speaker Analysis');
    expect(rendered).toContain('Date: 2025-09-09');
  });

  // RED: This should fail - generate method doesn't exist yet
  test('should generate document from template and data', async () => {
    const templateContent = `# {{phase}}: {{phaseTitle}}

**Status**: {{status}}
**Date**: {{timestamp}}

## Objectives
{{objectives}}

## Dependencies
{{dependencies}}`;

    await fs.writeFile(
      path.join(testTemplatesPath, 'spec-template.md'),
      templateContent
    );

    const data = {
      phase: 'st06-speakers-spl',
      phaseTitle: 'Speaker Analysis',
      status: 'Specification Phase',
      timestamp: '2025-09-09',
      objectives: 'Analyze speaker parameters',
      dependencies: 'st05-mic-calibration'
    };

    const rendered = await templateEngine.generate('spec-template', 'st06-speakers-spl', data);
    expect(rendered).toContain('# st06-speakers-spl: Speaker Analysis');
    expect(rendered).toContain('**Status**: Specification Phase');
  });

  // RED: This should fail - template caching doesn't exist yet
  test('should cache loaded templates', async () => {
    const templateContent = 'Cached template {{value}}';
    await fs.writeFile(
      path.join(testTemplatesPath, 'cached-template.md'),
      templateContent
    );

    // First load
    await templateEngine.loadTemplate('cached-template');
    expect(templateEngine.cache.has('cached-template')).toBe(true);

    // Second load should use cache
    const cached = await templateEngine.loadTemplate('cached-template');
    expect(cached).toBe(templateContent);
  });

  // RED: This should fail - LRU cache eviction doesn't exist yet  
  test('should evict oldest templates when cache is full', async () => {
    // Set small cache size for testing
    templateEngine.cache.maxSize = 2;

    // Create test templates
    await fs.writeFile(path.join(testTemplatesPath, 'template1.md'), 'Template 1');
    await fs.writeFile(path.join(testTemplatesPath, 'template2.md'), 'Template 2');
    await fs.writeFile(path.join(testTemplatesPath, 'template3.md'), 'Template 3');

    // Load templates (should trigger eviction)
    await templateEngine.loadTemplate('template1');
    await templateEngine.loadTemplate('template2');
    await templateEngine.loadTemplate('template3'); // Should evict template1

    expect(templateEngine.cache.has('template1')).toBe(false);
    expect(templateEngine.cache.has('template2')).toBe(true);
    expect(templateEngine.cache.has('template3')).toBe(true);
  });

  // RED: This should fail - template validation doesn't exist yet
  test('should validate template syntax', () => {
    const validTemplate = 'Hello {{name}}!';
    const invalidTemplate = 'Hello {{name}!'; // Missing closing brace

    expect(() => templateEngine.validateTemplate(validTemplate)).not.toThrow();
    expect(() => templateEngine.validateTemplate(invalidTemplate)).toThrow('Invalid template syntax');
  });

  // RED: This should fail - nested variable support doesn't exist yet
  test('should handle nested variable references', () => {
    const template = '{{user.name}} works on {{project.title}}';
    const data = {
      user: { name: 'Developer' },
      project: { title: 'QUALIA•NSS' }
    };

    const rendered = templateEngine.renderTemplate(template, data);
    expect(rendered).toBe('Developer works on QUALIA•NSS');
  });

  // RED: This should fail - template includes don't exist yet
  test('should support template includes', async () => {
    const headerTemplate = '# {{title}}\n**Date**: {{date}}';
    const mainTemplate = '{{>header}}\n\n## Content\n{{content}}';

    await fs.writeFile(path.join(testTemplatesPath, 'header.md'), headerTemplate);
    await fs.writeFile(path.join(testTemplatesPath, 'main.md'), mainTemplate);

    const data = {
      title: 'Test Document',
      date: '2025-09-09',
      content: 'Main content here'
    };

    const rendered = await templateEngine.generate('main', 'test-phase', data);
    expect(rendered).toContain('# Test Document');
    expect(rendered).toContain('**Date**: 2025-09-09');
    expect(rendered).toContain('## Content');
  });

  // RED: This should fail - error handling doesn't exist yet
  test('should handle missing template files gracefully', async () => {
    await expect(templateEngine.loadTemplate('nonexistent')).rejects.toThrow('Template not found');
  });
});

// TDD Validation: All these tests should FAIL initially (RED phase)
console.log('🔴 TDD RED PHASE: All template engine tests should fail - not implemented yet');