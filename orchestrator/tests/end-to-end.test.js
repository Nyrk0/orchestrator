/**
 * End-to-End Workflow Test Suite (T130-T136)
 * Tests complete orchestrator workflows with real-world scenarios
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { Orchestrator } = require('../core/orchestrator');
const { OrchStateManager } = require('../core/state-manager');
const { TemplateEngine } = require('../core/template-engine');
const fs = require('fs').promises;
const path = require('path');

describe('End-to-End Workflow Tests (T130-T136)', () => {
  let orchestrator;
  let stateManager;
  let templateEngine;
  let testStateDir;
  let testTemplateDir;

  beforeEach(async () => {
    testStateDir = path.join(__dirname, '../test-states-e2e');
    testTemplateDir = path.join(__dirname, '../test-templates-e2e');
    
    await fs.mkdir(testStateDir, { recursive: true });
    await fs.mkdir(testTemplateDir, { recursive: true });
    
    // Create realistic templates
    await fs.writeFile(
      path.join(testTemplateDir, 'spec-template.md'),
      '# {{phase}}: {{phaseTitle}} - Specification\\n\\n' +
      '**Status**: {{phaseType}}\\n**Created**: {{timestamp}}\\n\\n' +
      '## Project Objectives\\n{{objectives}}\\n\\n' +
      '## Technical Requirements\\n{{requirements}}\\n\\n' +
      '## Dependencies\\n{{dependencies}}\\n\\n' +
      '## Success Criteria\\n{{successCriteria}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'research-template.md'),
      '# {{phase}}: {{phaseTitle}} - Research & Analysis\\n\\n' +
      '**Research Phase**: {{phaseType}}\\n**Completed**: {{timestamp}}\\n\\n' +
      '## Primary Sources\\n{{primarySources}}\\n\\n' +
      '## Technical Foundation\\n{{technicalFoundation}}\\n\\n' +
      '## Alternative Approaches\\n{{alternativeAnalysis}}\\n\\n' +
      '## Recommended Solution\\n{{recommendedApproach}}\\n{{justification}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'plan-template.md'),
      '# {{phase}}: {{phaseTitle}} - Implementation Plan\\n\\n' +
      '**Planning Phase**: {{phaseType}}\\n**Date**: {{timestamp}}\\n\\n' +
      '## Architecture Overview\\n{{architectureOverview}}\\n\\n' +
      '## Core Components\\n{{coreComponents}}\\n\\n' +
      '## File Structure\\n{{fileStructure}}\\n\\n' +
      '## Implementation Strategy\\n{{implementationStrategy}}'
    );
    
    await fs.writeFile(
      path.join(testTemplateDir, 'tasks-template.md'),
      '# {{phase}}: {{phaseTitle}} - Task Breakdown\\n\\n' +
      '**Task Planning**: {{phaseType}}\\n**Generated**: {{timestamp}}\\n\\n' +
      '## Core Tasks\\n{{coreTasks}}\\n\\n' +
      '## Task Dependencies\\n{{taskDependencies}}\\n\\n' +
      '## Timeline Estimation\\n{{estimatedTimeline}}\\n\\n' +
      '## Resource Allocation\\n{{resourceAllocation}}'
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

  // T130: Complete real-world audio processing workflow
  test('T130: should execute complete audio processing feature workflow', async () => {
    const phase = 'st07-audio-equalizer';

    // Step 1: Define comprehensive specification
    const specResult = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: [
          'Implement real-time audio equalizer',
          'Support multiple EQ bands (7-band minimum)',
          'Provide visual feedback and analysis',
          'Ensure high-performance processing'
        ],
        requirements: [
          'Web Audio API integration',
          'Real-time frequency analysis',
          'Interactive UI controls',
          'Mobile-responsive design',
          'Cross-browser compatibility'
        ],
        dependencies: ['st06-audio-foundation', 'st05-ui-framework'],
        successCriteria: [
          'EQ processing with <10ms latency',
          'Support for 44.1kHz and 48kHz sample rates',
          'Smooth UI performance on mobile devices'
        ]
      }
    });

    expect(specResult.success).toBe(true);
    expect(specResult.generatedDocument).toContain('Audio Equalizer - Specification');
    expect(specResult.generatedDocument).toContain('Web Audio API integration');
    expect(specResult.dependencyValidation.missingDependencies).toEqual(
      expect.arrayContaining(['st06-audio-foundation', 'st05-ui-framework'])
    );

    // Approve specification
    const specApproval = await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Specification approved - comprehensive audio equalizer requirements defined'
    });

    expect(specApproval.success).toBe(true);
    expect(specApproval.nextAction).toBe('start_research');

    // Step 2: Research phase with technical analysis
    const researchResult = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: [
          'Web Audio API Specification (W3C)',
          'Digital Signal Processing Principles (Smith)',
          'Real-time Audio Processing in Browsers (Mozilla Developer Network)'
        ],
        technicalFoundation: 'Audio equalization requires precise frequency domain processing using Fast Fourier Transform (FFT) algorithms. The Web Audio API provides BiquadFilterNode and AnalyserNode for real-time implementation.',
        alternativeAnalysis: {
          approach1: { 
            name: 'BiquadFilter Chain', 
            pros: ['Native Web Audio performance', 'Low latency', 'Browser optimized'], 
            cons: ['Limited to basic filter types', 'Requires multiple nodes'] 
          },
          approach2: { 
            name: 'Custom FFT Processing', 
            pros: ['Complete control', 'Advanced algorithms', 'Custom frequency response'], 
            cons: ['Higher CPU usage', 'Complex implementation', 'Potential latency issues'] 
          },
          approach3: { 
            name: 'Hybrid Approach', 
            pros: ['Best performance', 'Flexible implementation', 'Optimized for different use cases'], 
            cons: ['Increased complexity', 'More testing required'] 
          }
        },
        recommendedApproach: 'approach3',
        justification: 'Hybrid approach combining BiquadFilter for standard EQ bands with custom processing for advanced features provides optimal balance of performance and flexibility',
        riskAnalysis: {
          technical: [
            { risk: 'Browser compatibility variations', impact: 'medium', mitigation: 'Feature detection and fallbacks' },
            { risk: 'Mobile performance limitations', impact: 'high', mitigation: 'Adaptive processing quality' }
          ],
          resource: [
            { risk: 'Development complexity', impact: 'medium', mitigation: 'Incremental implementation approach' }
          ]
        }
      }
    });

    expect(researchResult.success).toBe(true);
    expect(researchResult.generatedDocument).toContain('Hybrid Approach');
    expect(researchResult.generatedDocument).toContain('BiquadFilter');
    expect(researchResult.generatedDocument).toContain('Fast Fourier Transform');

    // Approve research
    await orchestrator.processApproval(phase, {
      type: 'research',
      approved: true,
      comments: 'Research phase completed - hybrid approach provides solid technical foundation'
    });

    // Step 3: Implementation planning
    const planResult = await orchestrator.executeCommand('plan', phase, {
      planData: {
        architectureOverview: 'Modular audio equalizer architecture with Web Audio API core, UI control layer, and analysis visualization components',
        coreComponents: [
          { name: 'AudioProcessor', purpose: 'Core equalizer processing using Web Audio API', dependencies: [] },
          { name: 'FrequencyAnalyzer', purpose: 'Real-time frequency analysis and visualization', dependencies: ['AudioProcessor'] },
          { name: 'EQControlPanel', purpose: 'Interactive equalizer controls UI', dependencies: ['AudioProcessor'] },
          { name: 'VisualizationEngine', purpose: 'Spectrum and waveform visualization', dependencies: ['FrequencyAnalyzer'] },
          { name: 'PresetManager', purpose: 'EQ preset storage and management', dependencies: ['EQControlPanel'] }
        ],
        fileStructure: {
          directories: [
            { path: 'src/audio-equalizer/', purpose: 'Main equalizer module' },
            { path: 'src/audio-equalizer/core/', purpose: 'Audio processing components' },
            { path: 'src/audio-equalizer/ui/', purpose: 'User interface components' },
            { path: 'src/audio-equalizer/visualization/', purpose: 'Audio visualization components' },
            { path: 'src/audio-equalizer/presets/', purpose: 'Preset management' }
          ],
          files: [
            { path: 'src/audio-equalizer/core/equalizer.js', purpose: 'Main EQ processing class' },
            { path: 'src/audio-equalizer/core/filter-chain.js', purpose: 'BiquadFilter chain management' },
            { path: 'src/audio-equalizer/ui/eq-panel.js', purpose: 'EQ control panel component' },
            { path: 'src/audio-equalizer/visualization/spectrum-analyzer.js', purpose: 'Real-time spectrum analysis' }
          ]
        },
        implementationStrategy: 'Incremental development starting with core audio processing, followed by UI controls, then visualization features'
      }
    });

    expect(planResult.success).toBe(true);
    expect(planResult.generatedDocument).toContain('AudioProcessor');
    expect(planResult.generatedDocument).toContain('Web Audio API core');

    // Approve plan
    await orchestrator.processApproval(phase, {
      type: 'plan',
      approved: true,
      comments: 'Implementation plan approved - modular architecture supports incremental development'
    });

    // Step 4: Task breakdown with timeline
    const tasksResult = await orchestrator.executeCommand('tasks', phase, {
      tasksData: {
        coreTasks: [
          { 
            id: 'EQ-001', 
            title: 'Audio Context Setup', 
            description: 'Initialize Web Audio API context and input/output routing', 
            priority: 'high', 
            estimatedHours: 8,
            assignee: 'audio-engineer'
          },
          { 
            id: 'EQ-002', 
            title: 'BiquadFilter Chain Implementation', 
            description: 'Create filter chain for 7-band equalizer using BiquadFilter nodes', 
            priority: 'high', 
            estimatedHours: 16,
            dependencies: ['EQ-001'],
            assignee: 'audio-engineer'
          },
          { 
            id: 'EQ-003', 
            title: 'Frequency Analysis Engine', 
            description: 'Implement real-time FFT analysis for visualization', 
            priority: 'high', 
            estimatedHours: 12,
            dependencies: ['EQ-001'],
            assignee: 'audio-engineer'
          },
          { 
            id: 'EQ-004', 
            title: 'EQ Control Panel UI', 
            description: 'Create interactive sliders and controls for EQ bands', 
            priority: 'medium', 
            estimatedHours: 20,
            dependencies: ['EQ-002'],
            assignee: 'ui-developer'
          },
          { 
            id: 'EQ-005', 
            title: 'Spectrum Visualization', 
            description: 'Real-time spectrum analyzer with WebGL rendering', 
            priority: 'medium', 
            estimatedHours: 24,
            dependencies: ['EQ-003'],
            assignee: 'ui-developer'
          },
          { 
            id: 'EQ-006', 
            title: 'Preset Management System', 
            description: 'Save, load, and manage EQ presets', 
            priority: 'low', 
            estimatedHours: 10,
            dependencies: ['EQ-004'],
            assignee: 'ui-developer'
          },
          { 
            id: 'EQ-007', 
            title: 'Mobile Optimization', 
            description: 'Optimize performance and UI for mobile devices', 
            priority: 'medium', 
            estimatedHours: 16,
            dependencies: ['EQ-004', 'EQ-005'],
            assignee: 'mobile-specialist'
          },
          { 
            id: 'EQ-008', 
            title: 'Cross-browser Testing', 
            description: 'Test compatibility across Chrome, Firefox, Safari, Edge', 
            priority: 'high', 
            estimatedHours: 12,
            dependencies: ['EQ-007'],
            assignee: 'qa-engineer'
          }
        ],
        resourceAllocation: {
          developers: 3,
          hoursPerDay: 8,
          totalTeamMembers: 4
        },
        milestones: [
          { name: 'Core Audio Processing', tasks: ['EQ-001', 'EQ-002', 'EQ-003'], dueDate: 'Week 2' },
          { name: 'UI Implementation', tasks: ['EQ-004', 'EQ-005'], dueDate: 'Week 4' },
          { name: 'Feature Complete', tasks: ['EQ-006', 'EQ-007'], dueDate: 'Week 6' },
          { name: 'Production Ready', tasks: ['EQ-008'], dueDate: 'Week 7' }
        ]
      }
    });

    expect(tasksResult.success).toBe(true);
    expect(tasksResult.generatedDocument).toContain('EQ-001');
    expect(tasksResult.generatedDocument).toContain('BiquadFilter Chain');
    expect(tasksResult.generatedDocument).toContain('Cross-browser Testing');

    // Verify complete workflow state
    const finalStatus = await orchestrator.getPhaseStatus(phase);
    expect(finalStatus.phaseTitle).toBe('Audio Equalizer');
    expect(finalStatus.progress).toBe(75); // 3 out of 4 steps approved
    expect(finalStatus.approvals.spec).toBe(true);
    expect(finalStatus.approvals.research).toBe(true);
    expect(finalStatus.approvals.plan).toBe(true);
    expect(finalStatus.nextAction).toBe('await_tasks_approval');
  });

  // T131: Multi-phase dependency workflow
  test('T131: should handle complex multi-phase dependency workflows', async () => {
    const foundationPhase = 'st05-audio-foundation';
    const uiPhase = 'st06-ui-framework';
    const equalizerPhase = 'st07-audio-equalizer';

    // Create foundation phase
    const foundationResult = await orchestrator.executeCompleteWorkflow(foundationPhase, {
      spec: {
        objectives: ['Create audio processing foundation'],
        requirements: ['Web Audio API wrapper', 'Basic audio utilities']
      },
      research: {
        primarySources: ['Web Audio API docs'],
        technicalFoundation: 'Foundation for audio processing'
      },
      plan: {
        architectureOverview: 'Basic audio foundation architecture',
        coreComponents: [
          { name: 'AudioContext', purpose: 'Audio context management', dependencies: [] }
        ]
      },
      tasks: {
        coreTasks: [
          { id: 'FOUND-001', title: 'Audio Context', description: 'Setup audio context', priority: 'high', estimatedHours: 4 }
        ]
      },
      autoApprove: { spec: true, research: true, plan: true }
    });

    expect(foundationResult.success).toBe(true);

    // Create UI framework phase
    const uiResult = await orchestrator.executeCompleteWorkflow(uiPhase, {
      spec: {
        objectives: ['Create UI component framework'],
        requirements: ['Reusable components', 'Theme support']
      },
      research: {
        primarySources: ['UI framework research'],
        technicalFoundation: 'Component-based UI architecture'
      },
      plan: {
        architectureOverview: 'Modular UI component system',
        coreComponents: [
          { name: 'ComponentBase', purpose: 'Base component class', dependencies: [] }
        ]
      },
      tasks: {
        coreTasks: [
          { id: 'UI-001', title: 'Component Base', description: 'Base component implementation', priority: 'high', estimatedHours: 6 }
        ]
      },
      autoApprove: { spec: true, research: true, plan: true }
    });

    expect(uiResult.success).toBe(true);

    // Now create equalizer that depends on both
    const equalizerSpec = await orchestrator.executeCommand('spec', equalizerPhase, {
      specData: {
        objectives: ['Build advanced equalizer using foundation and UI components'],
        requirements: ['Integration with foundation', 'Use UI framework'],
        dependencies: [foundationPhase, uiPhase]
      }
    });

    expect(equalizerSpec.success).toBe(true);
    expect(equalizerSpec.dependencyValidation.valid).toBe(false); // Dependencies not fully completed yet
    expect(equalizerSpec.dependencyValidation.missingDependencies).toEqual(
      expect.arrayContaining([foundationPhase, uiPhase])
    );

    // Complete foundation tasks to satisfy dependency
    await orchestrator.processApproval(foundationPhase, {
      type: 'tasks',
      approved: true,
      comments: 'Foundation tasks completed'
    });

    // Complete UI tasks to satisfy dependency
    await orchestrator.processApproval(uiPhase, {
      type: 'tasks',
      approved: true,
      comments: 'UI framework tasks completed'
    });

    // Now check dependencies again
    const updatedEqualizerSpec = await orchestrator.executeCommand('spec', equalizerPhase, {
      specData: {
        objectives: ['Build advanced equalizer using foundation and UI components'],
        requirements: ['Integration with foundation', 'Use UI framework'],
        dependencies: [foundationPhase, uiPhase]
      }
    });

    // Dependencies should be satisfied since we completed all tasks for both phases
    // This validates that our dependency validation correctly detects completed phases
    expect(updatedEqualizerSpec.dependencyValidation.valid).toBe(true); // Should be true now - phases are complete
    expect(updatedEqualizerSpec.dependencyValidation.resolvedDependencies).toEqual(
      expect.arrayContaining([foundationPhase, uiPhase])
    );
    expect(updatedEqualizerSpec.dependencyValidation.missingDependencies.length).toBe(0);

    // Verify phase status tracking
    const foundationStatus = await orchestrator.getPhaseStatus(foundationPhase);
    const uiStatus = await orchestrator.getPhaseStatus(uiPhase);
    const equalizerStatus = await orchestrator.getPhaseStatus(equalizerPhase);

    expect(foundationStatus.progress).toBeGreaterThan(0);
    expect(uiStatus.progress).toBeGreaterThan(0);
    expect(equalizerStatus.phase).toBe(equalizerPhase);
  });

  // T132: Iteration and refinement workflow
  test('T132: should support iterative refinement across workflow steps', async () => {
    const phase = 'st08-iterative-feature';

    // Initial specification (v1)
    const specV1 = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Initial feature concept'],
        requirements: ['Basic implementation']
      }
    });

    expect(specV1.success).toBe(true);
    expect(specV1.iterationNumber).toBe(1);

    // Approve spec v1
    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Initial spec approved'
    });

    // Initial research
    await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: ['Initial research'],
        technicalFoundation: 'Basic technical approach'
      }
    });

    // Reject research - needs more detail
    await orchestrator.processApproval(phase, {
      type: 'research',
      approved: false,
      comments: 'Needs more comprehensive technical analysis',
      feedback: ['Add performance analysis', 'Include alternative approaches']
    });

    // Enhanced research (v2)
    const researchV2 = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: ['Enhanced research sources', 'Performance benchmarks'],
        technicalFoundation: 'Comprehensive technical analysis with performance considerations',
        alternativeAnalysis: {
          approach1: { name: 'Conservative', pros: ['Safe'], cons: ['Limited'] },
          approach2: { name: 'Aggressive', pros: ['Fast'], cons: ['Risky'] }
        },
        recommendedApproach: 'approach1',
        justification: 'Conservative approach ensures stability'
      }
    });

    expect(researchV2.success).toBe(true);
    expect(researchV2.generatedDocument).toContain('Conservative');
    expect(researchV2.generatedDocument).toContain('performance considerations');

    // Approve enhanced research
    await orchestrator.processApproval(phase, {
      type: 'research',
      approved: true,
      comments: 'Enhanced research approved - comprehensive analysis provided'
    });

    // Create implementation plan
    await orchestrator.executeCommand('plan', phase, {
      planData: {
        architectureOverview: 'Conservative architecture based on research findings',
        coreComponents: [
          { name: 'SafeProcessor', purpose: 'Stable processing engine', dependencies: [] }
        ]
      }
    });

    await orchestrator.processApproval(phase, {
      type: 'plan',
      approved: true,
      comments: 'Plan reflects research recommendations'
    });

    // Verify iteration tracking
    const status = await orchestrator.getPhaseStatus(phase);
    expect(status.iterations.spec).toBe(1);
    expect(status.iterations.research).toBeGreaterThanOrEqual(1);
    expect(status.approvals.research).toBe(true);
    expect(status.progress).toBe(75);
  });

  // T133: Error recovery and resilience workflow
  test('T133: should demonstrate robust error recovery and workflow resilience', async () => {
    const phase = 'st09-resilience-test';

    // Test template error recovery
    const invalidTemplateDir = path.join(__dirname, '../nonexistent-templates');
    const resilientOrchestrator = new Orchestrator({
      stateManager: new OrchStateManager(testStateDir),
      templateEngine: new TemplateEngine(invalidTemplateDir)
    });

    const templateErrorResult = await resilientOrchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Test template error handling'],
        requirements: ['Graceful failure']
      }
    });

    expect(templateErrorResult.success).toBe(false);
    expect(templateErrorResult.error).toContain('Template not found');

    // Test with valid orchestrator - should work
    const validResult = await orchestrator.executeCommand('spec', phase, {
      specData: {
        objectives: ['Test recovery after template error'],
        requirements: ['System should recover properly']
      }
    });

    expect(validResult.success).toBe(true);
    expect(validResult.generatedDocument).toContain('Resilience Test');

    // Test prerequisite violation error
    const prematureResearch = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: ['Premature research'],
        technicalFoundation: 'Should fail without spec approval'
      }
    });

    expect(prematureResearch.success).toBe(false);
    expect(prematureResearch.error).toContain('Specification must be approved');

    // Approve spec and retry research - should work
    await orchestrator.processApproval(phase, {
      type: 'spec',
      approved: true,
      comments: 'Spec approved for error recovery test'
    });

    const successfulResearch = await orchestrator.executeCommand('research', phase, {
      researchData: {
        primarySources: ['Valid research after spec approval'],
        technicalFoundation: 'Research now succeeds with proper prerequisites'
      }
    });

    expect(successfulResearch.success).toBe(true);
    expect(successfulResearch.generatedDocument).toContain('proper prerequisites');

    // Verify state consistency after errors
    const finalStatus = await orchestrator.getPhaseStatus(phase);
    expect(finalStatus.success).toBe(true);
    expect(finalStatus.approvals.spec).toBe(true);
    expect(finalStatus.currentStep).toBe('research');
  });

  // T134: Performance validation with large datasets
  test('T134: should handle large-scale workflows efficiently', async () => {
    const startTime = Date.now();
    const phases = [];
    const concurrentOperations = [];

    // Create 10 concurrent phases
    for (let i = 1; i <= 10; i++) {
      const phase = `st10-perf-${i.toString().padStart(2, '0')}`;
      phases.push(phase);
      
      concurrentOperations.push(
        orchestrator.executeCommand('spec', phase, {
          specData: {
            objectives: [`Performance test objective ${i}`, 'Scalability validation', 'Concurrent processing'],
            requirements: [`Requirement ${i}.1`, `Requirement ${i}.2`, `Requirement ${i}.3`],
            dependencies: i > 1 ? [`st10-perf-${(i-1).toString().padStart(2, '0')}`] : []
          }
        })
      );
    }

    // Execute all specs concurrently
    const specResults = await Promise.all(concurrentOperations);

    // Verify all succeeded
    specResults.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.phase).toBe(phases[index]);
      expect(result.generatedDocument).toContain(`Perf ${(index + 1).toString().padStart(2, '0')}`);
    });

    // Performance validation
    const executionTime = Date.now() - startTime;
    expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds

    // Verify state isolation
    for (const phase of phases) {
      const status = await orchestrator.getPhaseStatus(phase);
      expect(status.phase).toBe(phase);
      expect(status.currentStep).toBe('spec');
      expect(status.iterations.spec).toBe(1);
    }

    console.log(`✅ Performance test: ${phases.length} concurrent operations completed in ${executionTime}ms`);
  });

  // T135: Complete workflow automation
  test('T135: should support fully automated workflow execution', async () => {
    const phase = 'st11-automated-workflow';

    const workflowData = {
      spec: {
        objectives: [
          'Implement automated audio processing pipeline',
          'Support batch processing workflows',
          'Provide automation APIs'
        ],
        requirements: [
          'RESTful API endpoints',
          'Queue management system',
          'Progress tracking and notifications',
          'Error handling and recovery'
        ],
        successCriteria: [
          'Process 1000+ files per hour',
          'Less than 1% error rate',
          'Real-time progress updates'
        ]
      },
      research: {
        primarySources: [
          'Audio Processing Automation Patterns',
          'Queue Management Best Practices',
          'Microservices Architecture for Media Processing'
        ],
        technicalFoundation: 'Automated audio processing requires robust queue management, efficient parallel processing, and comprehensive error recovery mechanisms.',
        alternativeAnalysis: {
          approach1: { 
            name: 'Message Queue Based', 
            pros: ['Scalable', 'Reliable', 'Industry standard'], 
            cons: ['Complex setup', 'Additional infrastructure'] 
          },
          approach2: { 
            name: 'Direct Processing', 
            pros: ['Simple', 'Low latency'], 
            cons: ['Limited scalability', 'No fault tolerance'] 
          },
          approach3: { 
            name: 'Hybrid Approach', 
            pros: ['Best of both worlds', 'Flexible deployment'], 
            cons: ['Increased complexity'] 
          }
        },
        recommendedApproach: 'approach1',
        justification: 'Message queue approach provides necessary scalability and reliability for production automation'
      },
      plan: {
        architectureOverview: 'Microservices-based automation architecture with message queues, processing workers, and management API',
        coreComponents: [
          { name: 'QueueManager', purpose: 'Manage processing queues and job distribution', dependencies: [] },
          { name: 'ProcessingWorker', purpose: 'Execute audio processing tasks', dependencies: ['QueueManager'] },
          { name: 'ProgressTracker', purpose: 'Track job progress and status updates', dependencies: ['QueueManager'] },
          { name: 'APIGateway', purpose: 'RESTful API for workflow management', dependencies: ['QueueManager', 'ProgressTracker'] },
          { name: 'NotificationService', purpose: 'Real-time notifications and alerts', dependencies: ['ProgressTracker'] }
        ],
        implementationStrategy: 'Begin with queue infrastructure, add processing workers, then build management APIs'
      },
      tasks: {
        coreTasks: [
          { id: 'AUTO-001', title: 'Queue Infrastructure', description: 'Setup message queue and job management', priority: 'high', estimatedHours: 24 },
          { id: 'AUTO-002', title: 'Processing Workers', description: 'Implement audio processing worker nodes', priority: 'high', estimatedHours: 32, dependencies: ['AUTO-001'] },
          { id: 'AUTO-003', title: 'Progress Tracking', description: 'Real-time job progress monitoring', priority: 'medium', estimatedHours: 16, dependencies: ['AUTO-001'] },
          { id: 'AUTO-004', title: 'Management API', description: 'RESTful API for workflow control', priority: 'medium', estimatedHours: 20, dependencies: ['AUTO-002', 'AUTO-003'] },
          { id: 'AUTO-005', title: 'Notification System', description: 'Real-time status notifications', priority: 'low', estimatedHours: 12, dependencies: ['AUTO-003'] },
          { id: 'AUTO-006', title: 'Load Testing', description: 'Performance and scalability testing', priority: 'high', estimatedHours: 16, dependencies: ['AUTO-004'] }
        ],
        resourceAllocation: {
          developers: 4,
          hoursPerDay: 8,
          totalDays: 20
        }
      },
      autoApprove: { spec: true, research: true, plan: true }
    };

    const automatedResult = await orchestrator.executeCompleteWorkflow(phase, workflowData);

    expect(automatedResult.success).toBe(true);
    expect(automatedResult.steps.spec.success).toBe(true);
    expect(automatedResult.steps.research.success).toBe(true);
    expect(automatedResult.steps.plan.success).toBe(true);
    expect(automatedResult.steps.tasks.success).toBe(true);

    // Verify content quality
    expect(automatedResult.steps.spec.generatedDocument).toContain('Automated Workflow');
    expect(automatedResult.steps.research.generatedDocument).toContain('Message Queue Based');
    expect(automatedResult.steps.plan.generatedDocument).toContain('QueueManager');
    expect(automatedResult.steps.tasks.generatedDocument).toContain('AUTO-001');

    // Verify final state
    const finalStatus = await orchestrator.getPhaseStatus(phase);
    expect(finalStatus.progress).toBe(75); // 3 out of 4 steps approved
    expect(finalStatus.phaseTitle).toBe('Automated Workflow');
    expect(finalStatus.approvals.spec).toBe(true);
    expect(finalStatus.approvals.research).toBe(true);
    expect(finalStatus.approvals.plan).toBe(true);
    expect(finalStatus.nextAction).toBe('await_tasks_approval');
  });

  // T136: Comprehensive system validation
  test('T136: should demonstrate comprehensive orchestrator system capabilities', async () => {
    const testPhases = ['st12-validation-spec', 'st12-validation-research', 'st12-validation-integration'];
    const allResults = [];

    // Test comprehensive command coverage
    const commands = ['spec', 'research', 'plan', 'tasks', 'status'];
    
    for (const command of commands.slice(0, 4)) { // spec, research, plan, tasks
      const phase = `st12-cmd-${command}`;
      
      let result;
      switch (command) {
        case 'spec':
          result = await orchestrator.executeCommand('spec', phase, {
            specData: {
              objectives: [`Test ${command} command validation`],
              requirements: ['Comprehensive testing', 'System validation']
            }
          });
          break;
          
        case 'research':
          // First create and approve spec
          await orchestrator.executeCommand('spec', phase, {
            specData: { objectives: ['Prerequisite for research'], requirements: ['Research prerequisites'] }
          });
          await orchestrator.processApproval(phase, { type: 'spec', approved: true, comments: 'Approved for research' });
          
          result = await orchestrator.executeCommand('research', phase, {
            researchData: {
              primarySources: [`${command} validation sources`],
              technicalFoundation: `Technical foundation for ${command} testing`
            }
          });
          break;
          
        case 'plan':
          // Setup prerequisites
          await orchestrator.executeCommand('spec', phase, {
            specData: { objectives: ['Prerequisite for plan'], requirements: ['Plan prerequisites'] }
          });
          await orchestrator.processApproval(phase, { type: 'spec', approved: true, comments: 'Approved' });
          await orchestrator.executeCommand('research', phase, {
            researchData: { primarySources: ['Research'], technicalFoundation: 'Foundation' }
          });
          await orchestrator.processApproval(phase, { type: 'research', approved: true, comments: 'Approved' });
          
          result = await orchestrator.executeCommand('plan', phase, {
            planData: {
              architectureOverview: `${command} validation architecture`,
              coreComponents: [{ name: 'TestComponent', purpose: 'Testing', dependencies: [] }]
            }
          });
          break;
          
        case 'tasks':
          // Setup prerequisites
          await orchestrator.executeCommand('spec', phase, {
            specData: { objectives: ['Prerequisite for tasks'], requirements: ['Task prerequisites'] }
          });
          await orchestrator.processApproval(phase, { type: 'spec', approved: true, comments: 'Approved' });
          await orchestrator.executeCommand('research', phase, {
            researchData: { primarySources: ['Research'], technicalFoundation: 'Foundation' }
          });
          await orchestrator.processApproval(phase, { type: 'research', approved: true, comments: 'Approved' });
          await orchestrator.executeCommand('plan', phase, {
            planData: { architectureOverview: 'Architecture', coreComponents: [{ name: 'Component', purpose: 'Test', dependencies: [] }] }
          });
          await orchestrator.processApproval(phase, { type: 'plan', approved: true, comments: 'Approved' });
          
          result = await orchestrator.executeCommand('tasks', phase, {
            tasksData: {
              coreTasks: [{ id: 'TEST-001', title: 'Test Task', description: 'Task testing', priority: 'high', estimatedHours: 4 }]
            }
          });
          break;
      }
      
      expect(result.success).toBe(true);
      expect(result.orchestrator.command).toBe(command);
      allResults.push(result);
    }

    // Test status command
    const statusResult = await orchestrator.executeCommand('status', 'st12-cmd-spec');
    expect(statusResult.success).toBe(true);
    expect(statusResult.phase).toBe('st12-cmd-spec');
    expect(statusResult.phaseTitle).toBe('Cmd Spec');

    // Verify error handling
    const invalidResult = await orchestrator.executeCommand('invalid-command', 'st12-test');
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('Invalid command');

    // Comprehensive validation summary
    expect(allResults.length).toBe(4);
    expect(allResults.every(result => result.success)).toBe(true);
    expect(allResults.every(result => result.generatedDocument)).toBeTruthy();
    expect(allResults.every(result => result.orchestrator)).toBeTruthy();

    console.log(`✅ System validation: ${allResults.length} commands tested successfully`);
  });
});

console.log('🎯 End-to-End Workflow Tests: Real-world scenario validation ready');