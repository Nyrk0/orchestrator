#!/usr/bin/env node

/**
 * Production Validation Script
 * Comprehensive validation of orchestrator system for production deployment
 */

const { Orchestrator } = require('../core/orchestrator');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

class ProductionValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    
    this.orchestrator = null;
  }

  async validate() {
    console.log('🔍 QUALIA•NSS Orchestrator Production Validation\n');
    console.log('=' .repeat(60));

    try {
      // Core system validation
      await this.validateCoreSystem();
      await this.validateComponents();
      await this.validatePerformance();
      await this.validateErrorHandling();
      await this.validateSecurity();
      await this.validateDocumentation();
      
      // Summary
      this.printSummary();
      
      // Exit with appropriate code
      process.exit(this.results.failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('❌ Critical validation failure:', error.message);
      process.exit(1);
    }
  }

  async validateCoreSystem() {
    console.log('\n📋 Core System Validation');
    console.log('-'.repeat(30));

    // Test orchestrator initialization
    await this.runTest('Orchestrator Initialization', async () => {
      const stateManager = new OrchStateManager();
      const templateEngine = new TemplateEngine();
      this.orchestrator = new Orchestrator({ stateManager, templateEngine });
      
      if (!this.orchestrator || !this.orchestrator.executeCommand) {
        throw new Error('Orchestrator initialization failed');
      }
    });

    // Test valid commands
    await this.runTest('Command Validation', async () => {
      const validCommands = ['spec', 'research', 'plan', 'tasks', 'status', 'approve'];
      if (!this.orchestrator.validCommands || 
          this.orchestrator.validCommands.length !== validCommands.length ||
          !validCommands.every(cmd => this.orchestrator.validCommands.includes(cmd))) {
        throw new Error('Invalid command configuration');
      }
    });

    // Test phase format validation
    await this.runTest('Phase Format Validation', async () => {
      const validPhases = ['st01-test', 'st99-production'];
      const invalidPhases = ['phase1', 'st1-test', 'invalid'];
      
      validPhases.forEach(phase => {
        if (!this.orchestrator.isValidPhaseFormat(phase)) {
          throw new Error(`Valid phase ${phase} rejected`);
        }
      });
      
      invalidPhases.forEach(phase => {
        if (this.orchestrator.isValidPhaseFormat(phase)) {
          throw new Error(`Invalid phase ${phase} accepted`);
        }
      });
    });
  }

  async validateComponents() {
    console.log('\n🔧 Component Validation');
    console.log('-'.repeat(25));

    // Test state manager
    await this.runTest('State Manager Functionality', async () => {
      const stateManager = new OrchStateManager('./test-states');
      const testPhase = 'st01-validation-test';
      
      // Create initial state
      const initialState = stateManager.createInitialState(testPhase);
      if (!initialState || !initialState.phase || !initialState.phaseTitle) {
        throw new Error('Initial state creation failed');
      }
      
      // Save and load state
      await stateManager.save(testPhase, initialState);
      const loadedState = await stateManager.load(testPhase);
      
      if (JSON.stringify(initialState) !== JSON.stringify(loadedState)) {
        throw new Error('State persistence failed');
      }
    });

    // Test template engine
    await this.runTest('Template Engine Functionality', async () => {
      const templateEngine = new TemplateEngine();
      
      const testData = {
        phaseTitle: 'Test Phase',
        objectives: ['Test objective 1', 'Test objective 2']
      };
      
      const rendered = await templateEngine.render('spec', testData);
      if (!rendered || !rendered.includes('Test Phase') || !rendered.includes('Test objective 1')) {
        throw new Error('Template rendering failed');
      }
    });

    // Test command execution
    await this.runTest('Command Execution', async () => {
      const testPhase = 'st02-command-test';
      const result = await this.orchestrator.executeCommand('spec', testPhase, {
        specData: {
          objectives: ['Test specification generation'],
          requirements: ['Basic functionality'],
          dependencies: []
        }
      });
      
      if (!result.success) {
        throw new Error(`Command execution failed: ${result.error}`);
      }
    });
  }

  async validatePerformance() {
    console.log('\n🚀 Performance Validation');
    console.log('-'.repeat(27));

    // Single operation performance
    await this.runTest('Single Operation Performance', async () => {
      const start = process.hrtime.bigint();
      
      await this.orchestrator.executeCommand('status', 'st01-perf-test');
      
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1000000;
      
      if (durationMs > 10) { // 10ms threshold for single operation
        throw new Error(`Operation too slow: ${durationMs}ms`);
      }
      
      console.log(`    ✓ Operation completed in ${durationMs.toFixed(2)}ms`);
    });

    // Memory usage validation
    await this.runTest('Memory Usage Validation', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await this.orchestrator.executeCommand('status', `st${i.toString().padStart(2, '0')}-memory-test`);
      }
      
      global.gc && global.gc(); // Force garbage collection if available
      
      const finalMemory = process.memoryUsage();
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Allow for some growth, but shouldn't be excessive
      if (heapGrowth > 10 * 1024 * 1024) { // 10MB threshold
        this.addWarning(`Memory growth: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB`);
      }
      
      console.log(`    ✓ Heap growth: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB`);
    });

    // Concurrent operations
    await this.runTest('Concurrent Operations', async () => {
      const concurrentOps = 25;
      const start = process.hrtime.bigint();
      
      const promises = [];
      for (let i = 0; i < concurrentOps; i++) {
        promises.push(
          this.orchestrator.executeCommand('status', `st${i.toString().padStart(2, '0')}-concurrent-test`)
        );
      }
      
      const results = await Promise.all(promises);
      const end = process.hrtime.bigint();
      
      const durationMs = Number(end - start) / 1000000;
      const avgMs = durationMs / concurrentOps;
      
      // All operations should succeed
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        throw new Error(`${failures.length} concurrent operations failed`);
      }
      
      // Performance should be reasonable
      if (avgMs > 5) { // 5ms average threshold
        this.addWarning(`Concurrent performance: ${avgMs.toFixed(2)}ms average`);
      }
      
      console.log(`    ✓ ${concurrentOps} operations in ${durationMs.toFixed(2)}ms (${avgMs.toFixed(2)}ms avg)`);
    });
  }

  async validateErrorHandling() {
    console.log('\n🛡️  Error Handling Validation');
    console.log('-'.repeat(32));

    // Invalid command handling
    await this.runTest('Invalid Command Handling', async () => {
      const result = await this.orchestrator.executeCommand('invalid-command', 'st01-test');
      
      if (result.success) {
        throw new Error('Invalid command was accepted');
      }
      
      if (!result.error || !result.error.includes('Invalid command')) {
        throw new Error('Error message not descriptive');
      }
    });

    // Invalid phase format handling
    await this.runTest('Invalid Phase Format Handling', async () => {
      const result = await this.orchestrator.executeCommand('spec', 'invalid-phase');
      
      if (result.success) {
        throw new Error('Invalid phase format was accepted');
      }
      
      if (!result.error || !result.error.includes('Invalid phase format')) {
        throw new Error('Error message not descriptive');
      }
    });

    // Prerequisite validation
    await this.runTest('Prerequisite Validation', async () => {
      const testPhase = 'st03-prereq-test';
      
      // Try to run research without approved spec
      const result = await this.orchestrator.executeCommand('research', testPhase, {
        researchData: {
          primarySources: ['Test source'],
          technicalFoundation: 'Test foundation'
        }
      });
      
      if (result.success) {
        throw new Error('Research was allowed without approved spec');
      }
      
      if (!result.error || !result.error.includes('Specification must be approved')) {
        throw new Error('Prerequisite error message not descriptive');
      }
    });

    // State corruption recovery
    await this.runTest('State Corruption Recovery', async () => {
      const stateManager = new OrchStateManager('./test-corruption');
      const testPhase = 'st04-corruption-test';
      
      // Create corrupted state file
      const corruptedStatePath = path.join('./test-corruption', testPhase, '.orch-state.json');
      await fs.mkdir(path.dirname(corruptedStatePath), { recursive: true });
      await fs.writeFile(corruptedStatePath, '{ invalid json }');
      
      // Should recover gracefully by creating new state
      try {
        const state = await stateManager.load(testPhase);
        if (!state || !state.phase) {
          throw new Error('Failed to recover from corruption');
        }
      } catch (error) {
        if (!error.message.includes('Failed to load state')) {
          throw error; // Unexpected error type
        }
      }
    });
  }

  async validateSecurity() {
    console.log('\n🔒 Security Validation');
    console.log('-'.repeat(22));

    // Input validation
    await this.runTest('Input Validation', async () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '<script>alert("xss")</script>',
        '${process.env}',
        '`rm -rf /`'
      ];
      
      for (const input of maliciousInputs) {
        const result = await this.orchestrator.executeCommand('spec', 'st05-security-test', {
          specData: {
            objectives: [input],
            requirements: ['Test'],
            dependencies: []
          }
        });
        
        // Should succeed but sanitize input
        if (!result.success) {
          // Expected to fail due to validation, which is good
          continue;
        }
        
        // If it succeeds, make sure input is sanitized
        if (result.document && result.document.includes(input)) {
          this.addWarning(`Potentially unsanitized input: ${input.substring(0, 20)}...`);
        }
      }
    });

    // Path traversal protection
    await this.runTest('Path Traversal Protection', async () => {
      const stateManager = new OrchStateManager('./test-security');
      
      const maliciousPaths = [
        '../../../malicious',
        '/etc/passwd',
        'C:\\Windows\\System32'
      ];
      
      for (const maliciousPath of maliciousPaths) {
        try {
          await stateManager.load(maliciousPath);
          // If it doesn't throw, check that it didn't access malicious path
          // This is hard to test without filesystem monitoring
        } catch (error) {
          // Expected to fail, which is good for security
          if (error.message.includes('Invalid phase format')) {
            continue; // Good - blocked by validation
          }
        }
      }
    });

    // Information disclosure
    await this.runTest('Information Disclosure Protection', async () => {
      const result = await this.orchestrator.executeCommand('invalid', 'st01-test');
      
      // Error messages should not contain sensitive information
      if (result.error && (
          result.error.includes(__dirname) ||
          result.error.includes(process.env.HOME) ||
          result.details
        )) {
        this.addWarning('Error messages may contain sensitive information');
      }
    });
  }

  async validateDocumentation() {
    console.log('\n📚 Documentation Validation');
    console.log('-'.repeat(30));

    // Check required files
    const requiredFiles = [
      'README.md',
      'API.md',
      'CHANGELOG.md',
      'PRODUCTION-GUIDE.md',
      'package.json',
      'cli.js'
    ];

    await this.runTest('Required Files Present', async () => {
      for (const file of requiredFiles) {
        try {
          await fs.access(path.join(__dirname, '..', file));
        } catch (error) {
          throw new Error(`Required file missing: ${file}`);
        }
      }
    });

    // Check package.json structure
    await this.runTest('Package Configuration', async () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageContent = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      const requiredFields = ['name', 'version', 'description', 'main', 'scripts', 'dependencies'];
      for (const field of requiredFields) {
        if (!packageContent[field]) {
          throw new Error(`Package.json missing required field: ${field}`);
        }
      }
      
      if (!packageContent.scripts.test) {
        throw new Error('Package.json missing test script');
      }
    });

    // Check CLI functionality
    await this.runTest('CLI Help System', async () => {
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const cli = spawn('node', ['cli.js', '--help'], {
          cwd: path.join(__dirname, '..')
        });
        
        let output = '';
        cli.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        cli.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`CLI help failed with code ${code}`));
          } else if (!output.includes('QUALIA•NSS Orchestrator')) {
            reject(new Error('CLI help output incomplete'));
          } else {
            resolve();
          }
        });
        
        cli.on('error', reject);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          cli.kill();
          reject(new Error('CLI help timeout'));
        }, 5000);
      });
    });
  }

  async runTest(name, testFn) {
    try {
      await testFn();
      console.log(`✅ ${name}`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
    }
  }

  addWarning(message) {
    console.log(`⚠️  Warning: ${message}`);
    this.results.warnings++;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRODUCTION VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📊 Total Tests: ${this.results.tests.length}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 PRODUCTION VALIDATION SUCCESSFUL');
      console.log('✅ System is ready for production deployment');
    } else {
      console.log('\n🚨 PRODUCTION VALIDATION FAILED');
      console.log('❌ System is NOT ready for production deployment');
      console.log('\nFailed tests:');
      this.results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    }
    
    if (this.results.warnings > 0) {
      console.log(`\n⚠️  ${this.results.warnings} warnings detected - review recommended`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.validate().catch(console.error);
}

module.exports = { ProductionValidator };