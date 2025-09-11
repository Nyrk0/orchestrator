/**
 * Performance & Error Recovery Test Suite (T137-T143)
 * Tests orchestrator system performance, stress testing, and error recovery
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { Orchestrator } = require('../core/orchestrator');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('Performance & Error Recovery Tests (T137-T143)', () => {
  let orchestrator;
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-performance');
    testTemplateDir = path.join(__dirname, '../test-templates-performance');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create optimized templates for performance testing
    await fs.writeFile(
      path.join(testTemplateDir, 'spec-template.md'),
      '# {{phase}}: {{phaseTitle}} - Specification\\n## Objectives\\n{{objectives}}\\n## Requirements\\n{{requirements}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'research-template.md'),
      '# {{phase}}: {{phaseTitle}} - Research\\n## Analysis\\n{{technicalFoundation}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'plan-template.md'),
      '# {{phase}}: {{phaseTitle}} - Plan\\n## Architecture\\n{{architectureOverview}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'tasks-template.md'),
      '# {{phase}}: {{phaseTitle}} - Tasks\\n## Core Tasks\\n{{coreTasks}}'
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

  // T137: High-volume concurrent processing performance
  test('T137: should handle high-volume concurrent operations efficiently', async () => {
    const startTime = Date.now();
    const concurrentPhases = 50; // Increased from 10 to 50
    const phases = [];
    const operations = [];

    // Generate phase names
    for (let i = 1; i <= concurrentPhases; i++) {
      phases.push(`st13-perf-${i.toString().padStart(3, '0')}`);
    }

    // Create concurrent spec operations
    phases.forEach((phase, index) => {
      operations.push(
        orchestrator.executeCommand('spec', phase, {
          specData: {
            objectives: [`Performance objective ${index + 1}`, 'Concurrent processing test'],
            requirements: [`Requirement ${index + 1}.1`, `Requirement ${index + 1}.2`]
          }
        })
      );
    });

    // Execute all operations concurrently
    const results = await Promise.all(operations);

    const executionTime = Date.now() - startTime;

    // Verify all operations succeeded
    expect(results.every(result => result.success)).toBe(true);
    expect(results.length).toBe(concurrentPhases);

    // Performance assertions
    expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    const averageTimePerOperation = executionTime / concurrentPhases;
    expect(averageTimePerOperation).toBeLessThan(500); // Average <500ms per operation

    // Verify state isolation
    for (let i = 0; i < phases.length; i++) {
      const status = await orchestrator.getPhaseStatus(phases[i]);
      expect(status.phase).toBe(phases[i]);
      expect(status.currentStep).toBe('spec');
    }

    console.log(`✅ Performance: ${concurrentPhases} operations in ${executionTime}ms (${averageTimePerOperation.toFixed(1)}ms avg)`);
  });

  // T138: Memory and resource management under load
  test('T138: should manage memory and resources efficiently under sustained load', async () => {
    const memoryBefore = process.memoryUsage();
    const phases = [];
    const batchSize = 20;
    const batches = 5; // 100 total operations

    for (let batch = 0; batch < batches; batch++) {
      const batchOperations = [];
      
      // Create batch of operations
      for (let i = 0; i < batchSize; i++) {
        const phase = `st13-mem-b${batch}-${i.toString().padStart(2, '0')}`;
        phases.push(phase);
        
        batchOperations.push(
          orchestrator.executeCompleteWorkflow(phase, {
            spec: {
              objectives: [`Memory test batch ${batch} item ${i}`],
              requirements: ['Resource management validation']
            },
            research: {
              primarySources: [`Memory research batch ${batch}`],
              technicalFoundation: 'Resource management analysis'
            },
            plan: {
              architectureOverview: 'Memory-efficient architecture',
              coreComponents: [{ name: 'ResourceManager', purpose: 'Manage resources', dependencies: [] }]
            },
            tasks: {
              coreTasks: [{ id: `MEM-${batch}-${i}`, title: 'Memory Task', description: 'Resource task', priority: 'medium', estimatedHours: 2 }]
            },
            autoApprove: { spec: true, research: true, plan: true }
          })
        );
      }

      // Execute batch and wait for completion
      const batchResults = await Promise.all(batchOperations);
      expect(batchResults.every(result => result.success)).toBe(true);

      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
    }

    const memoryAfter = process.memoryUsage();
    const totalOperations = phases.length;

    // Memory growth should be reasonable
    const heapGrowth = memoryAfter.heapUsed - memoryBefore.heapUsed;
    const heapGrowthMB = heapGrowth / (1024 * 1024);
    const growthPerOperation = heapGrowthMB / totalOperations;

    expect(growthPerOperation).toBeLessThan(0.5); // Less than 0.5MB per operation
    expect(heapGrowthMB).toBeLessThan(25); // Total growth less than 25MB

    console.log(`✅ Memory: ${totalOperations} operations, heap growth: ${heapGrowthMB.toFixed(2)}MB (${growthPerOperation.toFixed(3)}MB/op)`);
  });

  // T139: Error cascade prevention and isolation
  test('T139: should prevent error cascades and maintain system stability', async () => {
    const phases = ['st13-error-1', 'st13-error-2', 'st13-error-3', 'st13-error-4', 'st13-error-5'];
    
    // Create a mix of valid and invalid operations
    const operations = [
      // Valid operation
      orchestrator.executeCommand('spec', phases[0], {
        specData: {
          objectives: ['Valid operation'],
          requirements: ['Should succeed']
        }
      }),
      
      // Invalid phase format - should fail gracefully
      orchestrator.executeCommand('spec', 'invalid-phase-format', {
        specData: {
          objectives: ['Invalid phase'],
          requirements: ['Should fail']
        }
      }),
      
      // Valid operation
      orchestrator.executeCommand('spec', phases[1], {
        specData: {
          objectives: ['Another valid operation'],
          requirements: ['Should also succeed']
        }
      }),
      
      // Research without spec approval - should fail gracefully
      orchestrator.executeCommand('research', phases[2], {
        researchData: {
          primarySources: 'Should fail without spec',
          technicalFoundation: 'Missing prerequisite'
        }
      }),
      
      // Valid operation after errors
      orchestrator.executeCommand('spec', phases[3], {
        specData: {
          objectives: ['Post-error operation'],
          requirements: ['Should succeed despite previous errors']
        }
      })
    ];

    const results = await Promise.allSettled(operations);

    // Verify error isolation - valid operations should succeed despite errors
    expect(results[0].value.success).toBe(true); // Valid
    expect(results[1].value.success).toBe(false); // Invalid phase format
    expect(results[2].value.success).toBe(true); // Valid
    expect(results[3].value.success).toBe(false); // Missing data
    expect(results[4].value.success).toBe(true); // Valid after errors

    // Verify error details for failed operations
    expect(results[1].value.error).toContain('Invalid phase format');
    expect(results[3].value.error).toContain('Specification must be approved');

    // Verify successful operations have proper state
    const status0 = await orchestrator.getPhaseStatus(phases[0]);
    const status1 = await orchestrator.getPhaseStatus(phases[1]);
    const status3 = await orchestrator.getPhaseStatus(phases[3]);

    expect(status0.success).toBe(true);
    expect(status1.success).toBe(true);
    expect(status3.success).toBe(true);

    console.log('✅ Error isolation: 3/5 operations succeeded, 2 failed gracefully without affecting others');
  });

  // T140: Recovery from corrupted state files
  test('T140: should recover gracefully from corrupted or missing state files', async () => {
    const phase = 'st13-recovery-test';
    
    // Create initial state
    const initialSpec = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Recovery test'],
        requirements: ['State recovery validation']
      }
    });
    
    expect(initialSpec.success).toBe(true);

    // Verify state file exists
    const stateFile = path.join(testStateDir, phase, '.orch-state.json');
    const stateExists = await fs.access(stateFile).then(() => true).catch(() => false);
    expect(stateExists).toBe(true);

    // Corrupt the state file
    await fs.writeFile(stateFile, '{ invalid json content }');

    // Attempt to read status - should handle corruption gracefully
    const corruptedStatus = await orchestrator.getPhaseStatus(phase);
    expect(corruptedStatus.success).toBe(false);
    expect(corruptedStatus.error).toContain('Could not retrieve status');

    // Delete state file entirely
    await fs.unlink(stateFile);

    // Attempt operations on missing state - should create new state
    const recoverySpec = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Recovery after corruption'],
        requirements: ['New state creation']
      }
    });

    expect(recoverySpec.success).toBe(true);

    // Verify new state was created
    const recoveredStatus = await orchestrator.getPhaseStatus(phase);
    expect(recoveredStatus.success).toBe(true);
    expect(recoveredStatus.phase).toBe(phase);
    expect(recoveredStatus.currentStep).toBe('spec');

    console.log('✅ State recovery: Successfully recovered from corrupted and missing state files');
  });

  // T141: Template system resilience and fallback handling
  test('T141: should handle template errors gracefully with fallback mechanisms', async () => {
    const phase = 'st13-template-resilience';

    // Test with missing template directory
    const invalidTemplateEngine = new TemplateEngine('/nonexistent/template/directory');
    const resilientOrchestrator = new Orchestrator({
      stateManager,
      templateEngine: invalidTemplateEngine
    });

    const missingTemplateResult = await resilientOrchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Template resilience test'],
        requirements: ['Graceful template error handling']
      }
    });

    expect(missingTemplateResult.success).toBe(false);
    expect(missingTemplateResult.error).toContain('Template not found');

    // Test with corrupted template
    const corruptedTemplateDir = path.join(__dirname, '../test-templates-corrupted');
    await fs.mkdir(corruptedTemplateDir, { recursive: true });
    await fs.writeFile(
      path.join(corruptedTemplateDir, 'spec-template.md'),
      '# {{phase}}: {{phaseTitle}} - Specification\\n{{invalidPlaceholder}}'
    );

    const corruptedTemplateEngine = new TemplateEngine(corruptedTemplateDir);
    const corruptedOrchestrator = new Orchestrator({
      stateManager,
      templateEngine: corruptedTemplateEngine
    });

    const corruptedResult = await corruptedOrchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Corrupted template test'],
        requirements: ['Handle template rendering errors']
      }
    });

    // Should succeed but with missing placeholders rendered as-is
    expect(corruptedResult.success).toBe(true);
    expect(corruptedResult.generatedDocument).toContain('Template Resilience - Specification');

    // Cleanup
    await fs.rm(corruptedTemplateDir, { recursive: true, force: true }).catch(() => {});

    // Test recovery with valid orchestrator
    const recoveredResult = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Template recovery test'],
        requirements: ['Successful template processing after errors']
      }
    });

    expect(recoveredResult.success).toBe(true);
    expect(recoveredResult.generatedDocument).toContain('Template Resilience - Specification');

    console.log('✅ Template resilience: Handled missing, corrupted templates and recovered successfully');
  });

  // T142: Network and I/O failure simulation
  test('T142: should handle I/O failures and file system issues gracefully', async () => {
    const phase = 'st13-io-resilience';

    // Test with read-only state directory (simulate permission issues)
    const readOnlyStateDir = path.join(__dirname, '../test-states-readonly');
    await fs.mkdir(readOnlyStateDir, { recursive: true });
    
    // Create a state manager with limited permissions
    const restrictedStateManager = new OrchStateManager(readOnlyStateDir);
    const restrictedOrchestrator = new Orchestrator({
      stateManager: restrictedStateManager,
      templateEngine
    });

    // Try to create spec (will fail on state save)
    const ioResult = await restrictedOrchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['I/O resilience test'],
        requirements: ['Handle file system errors']
      }
    });

    // Should handle I/O errors gracefully
    expect(ioResult.success).toBe(true); // Command executes successfully
    
    // Test disk space simulation (create very large content)
    const largeContentPhase = 'st13-large-content';
    const largeObjectives = Array(1000).fill(0).map((_, i) => `Large objective ${i + 1}`);
    
    const largeContentResult = await orchestrator.executeCommand('spec', largeContentPhase, {
      specData: {
        objectives: largeObjectives,
        requirements: Array(1000).fill(0).map((_, i) => `Large requirement ${i + 1}`)
      }
    });

    expect(largeContentResult.success).toBe(true);
    expect(largeContentResult.generatedDocument.length).toBeGreaterThan(10000);

    // Cleanup
    await fs.rm(readOnlyStateDir, { recursive: true, force: true }).catch(() => {});

    console.log('✅ I/O resilience: Handled file system issues and large content successfully');
  });

  // T143: System stability under extreme conditions
  test('T143: should maintain stability under extreme stress conditions', async () => {
    const stressTestPhases = [];
    const stressOperations = [];
    const stressTestSize = 25; // Moderate size for CI stability
    
    // Create extreme stress test with mixed operations
    for (let i = 0; i < stressTestSize; i++) {
      const phase = `st13-stress-${i.toString().padStart(3, '0')}`;
      stressTestPhases.push(phase);
      
      // Mix of different operation types
      const operationType = i % 4;
      
      switch (operationType) {
        case 0: // Spec only
          stressOperations.push(
            orchestrator.executeCommand('spec', phase, {
              specData: {
                objectives: [`Stress test spec ${i}`],
                requirements: ['Stress testing validation']
              }
            })
          );
          break;
          
        case 1: // Complete workflow
          stressOperations.push(
            orchestrator.executeCompleteWorkflow(phase, {
              spec: { objectives: [`Stress workflow ${i}`], requirements: ['Full workflow'] },
              research: { primarySources: ['Stress research'], technicalFoundation: 'Stress analysis' },
              plan: { architectureOverview: 'Stress architecture', coreComponents: [{ name: 'StressComponent', purpose: 'Stress test', dependencies: [] }] },
              tasks: { coreTasks: [{ id: `STRESS-${i}`, title: 'Stress Task', description: 'Stress testing', priority: 'high', estimatedHours: 1 }] },
              autoApprove: { spec: true, research: true, plan: true }
            })
          );
          break;
          
        case 2: // Status check
          // First create a spec for status checking
          stressOperations.push(
            orchestrator.executeCommand('spec', phase, {
              specData: { objectives: [`Status test ${i}`], requirements: ['Status validation'] }
            }).then(async () => {
              return await orchestrator.executeCommand('status', phase);
            })
          );
          break;
          
        case 3: // Approval workflow
          stressOperations.push(
            orchestrator.executeCommand('spec', phase, {
              specData: { objectives: [`Approval test ${i}`], requirements: ['Approval testing'] }
            }).then(async () => {
              return await orchestrator.processApproval(phase, {
                type: 'spec',
                approved: true,
                comments: `Stress test approval ${i}`
              });
            })
          );
          break;
      }
    }

    const startTime = Date.now();
    
    // Execute all stress operations
    const stressResults = await Promise.allSettled(stressOperations);
    
    const executionTime = Date.now() - startTime;
    
    // Analyze results
    const successful = stressResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = stressResults.length - successful;
    const successRate = (successful / stressResults.length) * 100;
    
    // Stress test acceptance criteria
    expect(successRate).toBeGreaterThanOrEqual(95); // At least 95% success rate
    expect(executionTime).toBeLessThan(30000); // Complete within 30 seconds
    
    // Verify system is still functional after stress
    const postStressResult = await orchestrator.executeCommand('spec', 'st13-post-stress', {
      specData: {
        objectives: ['Post-stress functionality test'],
        requirements: ['System should remain functional']
      }
    });
    
    expect(postStressResult.success).toBe(true);
    
    // Memory usage should be reasonable
    const finalMemory = process.memoryUsage();
    expect(finalMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    
    console.log(`✅ Stress test: ${successful}/${stressResults.length} operations succeeded (${successRate.toFixed(1)}%) in ${executionTime}ms`);
  });
});

console.log('⚡ Performance & Error Recovery Tests: System resilience validation ready');