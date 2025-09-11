#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * Comprehensive performance testing for production validation
 */

const { Orchestrator } = require('../core/orchestrator');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');

class PerformanceBenchmark {
  constructor() {
    this.orchestrator = null;
    this.results = {
      singleOperation: {},
      concurrentOperations: {},
      memoryUsage: {},
      stressTest: {},
      enduranceTest: {}
    };
  }

  async run() {
    console.log('🚀 QUALIA•NSS Orchestrator Performance Benchmark\n');
    console.log('=' .repeat(65));

    // Initialize orchestrator
    const stateManager = new OrchStateManager('./benchmark-states');
    const templateEngine = new TemplateEngine();
    this.orchestrator = new Orchestrator({ stateManager, templateEngine });

    try {
      await this.benchmarkSingleOperation();
      await this.benchmarkConcurrentOperations();
      await this.benchmarkMemoryUsage();
      await this.benchmarkStressTest();
      await this.benchmarkEnduranceTest();
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      process.exit(1);
    }
  }

  async benchmarkSingleOperation() {
    console.log('\n⚡ Single Operation Benchmark');
    console.log('-'.repeat(35));

    const operations = ['spec', 'status'];
    const iterations = 100;
    
    for (const operation of operations) {
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        
        if (operation === 'spec') {
          await this.orchestrator.executeCommand('spec', `st${i.toString().padStart(2, '0')}-bench`, {
            specData: {
              objectives: ['Benchmark test objective'],
              requirements: ['Benchmark requirement'],
              dependencies: []
            }
          });
        } else {
          await this.orchestrator.executeCommand('status', `st${i.toString().padStart(2, '0')}-bench`);
        }
        
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1000000); // Convert to milliseconds
      }
      
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
      
      this.results.singleOperation[operation] = { avg, min, max, p95 };
      
      console.log(`📊 ${operation.toUpperCase()} Operation (${iterations} iterations):`);
      console.log(`   Average: ${avg.toFixed(3)}ms`);
      console.log(`   Min:     ${min.toFixed(3)}ms`);
      console.log(`   Max:     ${max.toFixed(3)}ms`);
      console.log(`   95th %:  ${p95.toFixed(3)}ms`);
      console.log();
    }
  }

  async benchmarkConcurrentOperations() {
    console.log('\n🔀 Concurrent Operations Benchmark');
    console.log('-'.repeat(40));

    const concurrencyLevels = [10, 25, 50, 100];
    
    for (const concurrency of concurrencyLevels) {
      const start = process.hrtime.bigint();
      
      const promises = [];
      for (let i = 0; i < concurrency; i++) {
        promises.push(
          this.orchestrator.executeCommand('status', `st${i.toString().padStart(3, '0')}-concurrent`)
        );
      }
      
      const results = await Promise.all(promises);
      const end = process.hrtime.bigint();
      
      const totalTime = Number(end - start) / 1000000;
      const avgTime = totalTime / concurrency;
      const throughput = concurrency / (totalTime / 1000); // operations per second
      
      // Count failures
      const failures = results.filter(r => !r.success).length;
      
      this.results.concurrentOperations[concurrency] = {
        totalTime,
        avgTime,
        throughput,
        failures,
        successRate: ((concurrency - failures) / concurrency * 100)
      };
      
      console.log(`📊 ${concurrency} Concurrent Operations:`);
      console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Avg Time:   ${avgTime.toFixed(3)}ms`);
      console.log(`   Throughput: ${throughput.toFixed(0)} ops/sec`);
      console.log(`   Success:    ${(this.results.concurrentOperations[concurrency].successRate).toFixed(1)}%`);
      console.log();
    }
  }

  async benchmarkMemoryUsage() {
    console.log('\n💾 Memory Usage Benchmark');
    console.log('-'.repeat(30));

    const initialMemory = process.memoryUsage();
    const memorySnapshots = [];
    
    memorySnapshots.push({ iteration: 0, ...initialMemory });
    
    // Perform operations and track memory
    const operationsPerBatch = 50;
    const batches = 10;
    
    for (let batch = 1; batch <= batches; batch++) {
      // Perform batch of operations
      const promises = [];
      for (let i = 0; i < operationsPerBatch; i++) {
        const phaseNum = ((batch - 1) * operationsPerBatch + i).toString().padStart(3, '0');
        promises.push(
          this.orchestrator.executeCommand('spec', `st${phaseNum}-memory`, {
            specData: {
              objectives: [`Memory test objective ${phaseNum}`],
              requirements: [`Memory test requirement ${phaseNum}`],
              dependencies: []
            }
          })
        );
      }
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const currentMemory = process.memoryUsage();
      memorySnapshots.push({ iteration: batch * operationsPerBatch, ...currentMemory });
      
      console.log(`📊 After ${batch * operationsPerBatch} operations:`);
      console.log(`   Heap Used:     ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Heap Total:    ${(currentMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   RSS:           ${(currentMemory.rss / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   External:      ${(currentMemory.external / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Calculate memory growth
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    const rssGrowth = finalMemory.rss - initialMemory.rss;
    
    this.results.memoryUsage = {
      initialHeap: initialMemory.heapUsed,
      finalHeap: finalMemory.heapUsed,
      heapGrowth,
      initialRss: initialMemory.rss,
      finalRss: finalMemory.rss,
      rssGrowth,
      totalOperations: batches * operationsPerBatch,
      snapshots: memorySnapshots
    };
    
    console.log('\n📈 Memory Growth Summary:');
    console.log(`   Heap Growth: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB over ${batches * operationsPerBatch} operations`);
    console.log(`   RSS Growth:  ${(rssGrowth / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Per Operation: ${(heapGrowth / (batches * operationsPerBatch) / 1024).toFixed(2)}KB heap`);
    console.log();
  }

  async benchmarkStressTest() {
    console.log('\n🔥 Stress Test Benchmark');
    console.log('-'.repeat(28));

    const stressOperations = 200;
    const maxConcurrency = 50;
    
    console.log(`Executing ${stressOperations} operations with max concurrency of ${maxConcurrency}...`);
    
    const start = process.hrtime.bigint();
    const promises = [];
    const results = [];
    
    // Launch operations in batches to control concurrency
    for (let i = 0; i < stressOperations; i += maxConcurrency) {
      const batch = [];
      const batchSize = Math.min(maxConcurrency, stressOperations - i);
      
      for (let j = 0; j < batchSize; j++) {
        const opIndex = i + j;
        batch.push(
          this.executeStressOperation(opIndex)
        );
      }
      
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const end = process.hrtime.bigint();
    const totalTime = Number(end - start) / 1000000;
    
    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    const throughput = stressOperations / (totalTime / 1000);
    
    this.results.stressTest = {
      totalOperations: stressOperations,
      successful,
      failed,
      totalTime,
      throughput,
      successRate: (successful / stressOperations * 100)
    };
    
    console.log(`📊 Stress Test Results:`);
    console.log(`   Total Operations: ${stressOperations}`);
    console.log(`   Successful:       ${successful}`);
    console.log(`   Failed:           ${failed}`);
    console.log(`   Total Time:       ${totalTime.toFixed(2)}ms`);
    console.log(`   Throughput:       ${throughput.toFixed(0)} ops/sec`);
    console.log(`   Success Rate:     ${(this.results.stressTest.successRate).toFixed(1)}%`);
    console.log();
  }

  async executeStressOperation(index) {
    const operations = ['spec', 'status'];
    const operation = operations[index % operations.length];
    const phase = `st${index.toString().padStart(3, '0')}-stress`;
    
    if (operation === 'spec') {
      return await this.orchestrator.executeCommand('spec', phase, {
        specData: {
          objectives: [`Stress test objective ${index}`],
          requirements: [`Stress test requirement ${index}`],
          dependencies: []
        }
      });
    } else {
      return await this.orchestrator.executeCommand('status', phase);
    }
  }

  async benchmarkEnduranceTest() {
    console.log('\n⏱️  Endurance Test Benchmark');
    console.log('-'.repeat(32));

    const testDurationMs = 30000; // 30 seconds
    const operationIntervalMs = 100; // 100ms between operations
    const maxOperations = testDurationMs / operationIntervalMs;
    
    console.log(`Running endurance test for ${testDurationMs / 1000} seconds...`);
    
    const start = process.hrtime.bigint();
    const results = [];
    const memorySnapshots = [];
    let operationCount = 0;
    
    const interval = setInterval(async () => {
      const operationStart = process.hrtime.bigint();
      
      try {
        const result = await this.orchestrator.executeCommand('status', `st${operationCount.toString().padStart(3, '0')}-endurance`);
        const operationEnd = process.hrtime.bigint();
        const operationTime = Number(operationEnd - operationStart) / 1000000;
        
        results.push({
          success: result.success,
          time: operationTime,
          timestamp: Date.now()
        });
        
        operationCount++;
        
        // Memory snapshot every 50 operations
        if (operationCount % 50 === 0) {
          memorySnapshots.push({
            operation: operationCount,
            memory: process.memoryUsage(),
            timestamp: Date.now()
          });
        }
        
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }, operationIntervalMs);
    
    // Stop after test duration
    await new Promise(resolve => setTimeout(resolve, testDurationMs));
    clearInterval(interval);
    
    const end = process.hrtime.bigint();
    const actualDuration = Number(end - start) / 1000000;
    
    // Analyze results
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const avgOperationTime = results.reduce((sum, r) => sum + (r.time || 0), 0) / results.length;
    const actualThroughput = results.length / (actualDuration / 1000);
    
    // Memory analysis
    const initialMemory = memorySnapshots.length > 0 ? memorySnapshots[0].memory : process.memoryUsage();
    const finalMemory = memorySnapshots.length > 0 ? memorySnapshots[memorySnapshots.length - 1].memory : process.memoryUsage();
    const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    
    this.results.enduranceTest = {
      duration: actualDuration,
      totalOperations: results.length,
      successful,
      failed,
      avgOperationTime,
      throughput: actualThroughput,
      successRate: (successful / results.length * 100),
      memoryGrowth,
      memorySnapshots
    };
    
    console.log(`📊 Endurance Test Results:`);
    console.log(`   Duration:         ${(actualDuration / 1000).toFixed(1)}s`);
    console.log(`   Total Operations: ${results.length}`);
    console.log(`   Successful:       ${successful}`);
    console.log(`   Failed:           ${failed}`);
    console.log(`   Avg Op Time:      ${avgOperationTime.toFixed(3)}ms`);
    console.log(`   Throughput:       ${actualThroughput.toFixed(1)} ops/sec`);
    console.log(`   Success Rate:     ${(this.results.enduranceTest.successRate).toFixed(1)}%`);
    console.log(`   Memory Growth:    ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    console.log();
  }

  printSummary() {
    console.log('\n' + '='.repeat(65));
    console.log('📊 PERFORMANCE BENCHMARK SUMMARY');
    console.log('='.repeat(65));
    
    // Single operation performance
    console.log('\n⚡ Single Operation Performance:');
    Object.entries(this.results.singleOperation).forEach(([op, results]) => {
      const status = results.avg < 5.0 ? '✅' : results.avg < 10.0 ? '⚠️' : '❌';
      console.log(`   ${status} ${op.toUpperCase()}: ${results.avg.toFixed(3)}ms avg (${results.p95.toFixed(3)}ms p95)`);
    });
    
    // Concurrent operations
    console.log('\n🔀 Concurrent Operations:');
    Object.entries(this.results.concurrentOperations).forEach(([level, results]) => {
      const status = results.avgTime < 5.0 && results.successRate >= 99.0 ? '✅' : 
                     results.avgTime < 10.0 && results.successRate >= 95.0 ? '⚠️' : '❌';
      console.log(`   ${status} ${level} concurrent: ${results.avgTime.toFixed(2)}ms avg, ${results.throughput.toFixed(0)} ops/sec`);
    });
    
    // Memory usage
    console.log('\n💾 Memory Usage:');
    const memGrowthMB = this.results.memoryUsage.heapGrowth / 1024 / 1024;
    const memPerOp = this.results.memoryUsage.heapGrowth / this.results.memoryUsage.totalOperations;
    const memStatus = memGrowthMB < 10 ? '✅' : memGrowthMB < 25 ? '⚠️' : '❌';
    console.log(`   ${memStatus} Heap Growth: ${memGrowthMB.toFixed(2)}MB over ${this.results.memoryUsage.totalOperations} ops`);
    console.log(`       Per Operation: ${(memPerOp / 1024).toFixed(2)}KB`);
    
    // Stress test
    console.log('\n🔥 Stress Test:');
    const stressStatus = this.results.stressTest.successRate >= 99.0 ? '✅' : 
                        this.results.stressTest.successRate >= 95.0 ? '⚠️' : '❌';
    console.log(`   ${stressStatus} ${this.results.stressTest.totalOperations} operations: ${this.results.stressTest.successRate.toFixed(1)}% success rate`);
    console.log(`       Throughput: ${this.results.stressTest.throughput.toFixed(0)} ops/sec`);
    
    // Endurance test
    console.log('\n⏱️  Endurance Test:');
    const enduranceStatus = this.results.enduranceTest.successRate >= 99.0 ? '✅' : 
                           this.results.enduranceTest.successRate >= 95.0 ? '⚠️' : '❌';
    console.log(`   ${enduranceStatus} ${(this.results.enduranceTest.duration / 1000).toFixed(1)}s duration: ${this.results.enduranceTest.successRate.toFixed(1)}% success rate`);
    console.log(`       Average: ${this.results.enduranceTest.avgOperationTime.toFixed(3)}ms per operation`);
    
    // Overall assessment
    console.log('\n🏆 OVERALL ASSESSMENT:');
    const allPassed = this.assessOverallPerformance();
    if (allPassed) {
      console.log('✅ EXCELLENT - All performance benchmarks passed');
      console.log('   System is ready for high-performance production deployment');
    } else {
      console.log('⚠️  REVIEW NEEDED - Some performance benchmarks need attention');
      console.log('   System may need optimization before production deployment');
    }
    
    console.log('\n' + '='.repeat(65));
  }

  assessOverallPerformance() {
    const checks = [
      // Single operation should be fast
      Object.values(this.results.singleOperation).every(r => r.avg < 5.0),
      
      // Concurrent operations should maintain performance
      Object.values(this.results.concurrentOperations).every(r => r.avgTime < 10.0 && r.successRate >= 95.0),
      
      // Memory growth should be reasonable
      (this.results.memoryUsage.heapGrowth / 1024 / 1024) < 25,
      
      // Stress test should have high success rate
      this.results.stressTest.successRate >= 95.0,
      
      // Endurance test should be stable
      this.results.enduranceTest.successRate >= 95.0
    ];
    
    return checks.every(check => check);
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.run().catch(console.error);
}

module.exports = { PerformanceBenchmark };