/**
 * TemplateEngine - Document Generation with Caching
 * TDD GREEN PHASE: Minimal implementation to pass tests
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateEngine {
  constructor(templatesPath = './templates') {
    this.templatesPath = templatesPath;
    this.cache = new TemplateCache();
  }

  async loadTemplate(templateName) {
    // Check cache first
    const cached = this.cache.get(templateName);
    if (cached) {
      return cached;
    }

    // Load from file
    const templatePath = path.join(this.templatesPath, `${templateName}.md`);
    
    try {
      const content = await fs.readFile(templatePath, 'utf8');
      
      // Add to cache
      this.cache.set(templateName, content);
      
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template not found: ${templateName}`);
      }
      throw error;
    }
  }

  renderTemplate(template, data) {
    // Validate template syntax
    this.validateTemplate(template);
    
    // Handle nested variable references
    const processNestedData = (obj, prefix = '') => {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, processNestedData(value, fullKey));
        } else {
          result[fullKey] = value;
        }
      }
      return result;
    };

    const flatData = processNestedData(data);
    
    // Simple template variable replacement with nested support
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return flatData[trimmedKey] !== undefined ? flatData[trimmedKey] : match;
    });
  }

  async generate(templateName, phase, data) {
    // Load template
    let template = await this.loadTemplate(templateName);
    
    // Process includes (simple implementation)
    template = await this.processIncludes(template);
    
    // Add standard template data
    const templateData = {
      ...data,
      phase,
      timestamp: new Date().toISOString(),
      methodologyReference: '/dev/QUALIA-NSS-METHOD-DIAGRAMS.md'
    };
    
    return this.renderTemplate(template, templateData);
  }

  async processIncludes(template) {
    // Simple include processing {{>templateName}}
    const includeRegex = /\{\{>([^}]+)\}\}/g;
    let processed = template;
    
    const matches = [...template.matchAll(includeRegex)];
    
    for (const match of matches) {
      const includeName = match[1].trim();
      try {
        const includeContent = await this.loadTemplate(includeName);
        processed = processed.replace(match[0], includeContent);
      } catch (error) {
        // If include fails, leave the placeholder
        console.warn(`Include template not found: ${includeName}`);
      }
    }
    
    return processed;
  }

  validateTemplate(template) {
    // Basic validation for template syntax
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      throw new Error('Invalid template syntax: Mismatched braces');
    }
    
    return true;
  }
}

class TemplateCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(templateName) {
    if (this.cache.has(templateName)) {
      // Move to end (LRU)
      const template = this.cache.get(templateName);
      this.cache.delete(templateName);
      this.cache.set(templateName, template);
      return template;
    }
    return null;
  }

  set(templateName, template) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(templateName, template);
  }

  has(templateName) {
    return this.cache.has(templateName);
  }
}

class TemplateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TemplateError';
  }
}

module.exports = {
  TemplateEngine,
  TemplateCache,
  TemplateError
};

console.log('🟢 TDD GREEN PHASE: TemplateEngine implemented with minimal functionality');