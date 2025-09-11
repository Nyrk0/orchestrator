/**
 * Main Orchestrator Controller (T123-T129)
 * Central command routing and workflow management
 */

const { specCommand } = require('../commands/spec');
const { researchCommand } = require('../commands/research');
const { planCommand } = require('../commands/plan');
const { tasksCommand } = require('../commands/tasks');
const { requestUserApproval, processApprovalResponse } = require('../commands/approval');
const { OrchStateManager } = require('./state-manager');
const { TemplateEngine } = require('./template-engine');
const { ValidationError, WorkflowError } = require('./error-handler');
const { TaskCompletionLogger } = require('./task-completion-logger');

/**
 * Main Orchestrator class for managing the complete workflow
 */
class Orchestrator {
  constructor(options = {}) {
    this.stateManager = options.stateManager || new OrchStateManager();
    this.templateEngine = options.templateEngine || new TemplateEngine();
    this.taskLogger = options.taskLogger || new TaskCompletionLogger(options.logging);
    this.validCommands = ['spec', 'research', 'plan', 'tasks', 'status', 'approve', 'progress'];
  }

  /**
   * T123: Execute a command with proper routing and error handling
   */
  async executeCommand(command, phase, options = {}) {
    try {
      // Validate command
      if (!this.validCommands.includes(command)) {
        return {
          success: false,
          error: `Invalid command: ${command}. Valid commands: ${this.validCommands.join(', ')}`
        };
      }

      // Validate phase format
      if (phase && !this.isValidPhaseFormat(phase)) {
        return {
          success: false,
          error: `Invalid phase format: ${phase}. Expected format: st##-description`
        };
      }

      // Add standard options
      const enhancedOptions = {
        ...options,
        templateEngine: this.templateEngine
      };

      // Route to appropriate command
      switch (command) {
        case 'spec':
          return await this.executeSpecCommand(phase, enhancedOptions);
        case 'research':
          return await this.executeResearchCommand(phase, enhancedOptions);
        case 'plan':
          return await this.executePlanCommand(phase, enhancedOptions);
        case 'tasks':
          return await this.executeTasksCommand(phase, enhancedOptions);
        case 'status':
          return await this.getPhaseStatus(phase);
        case 'approve':
          return await this.processApproval(phase, enhancedOptions);
        case 'progress':
          return await this.getProjectProgress(phase);
        default:
          return {
            success: false,
            error: `Command '${command}' not implemented`
          };
      }
    } catch (error) {
      // Convert all errors to consistent format
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  /**
   * T124: Execute spec command with enhanced features
   */
  async executeSpecCommand(phase, options) {
    try {
      // Ensure phase title is properly extracted
      if (options.specData && !options.specData.phaseTitle) {
        options.specData.phaseTitle = this.extractPhaseTitle(phase);
      }

      const result = await specCommand(phase, this.stateManager, options);
      
      // Ensure iteration is properly incremented in state
      if (result.success) {
        const state = await this.stateManager.load(phase);
        if (state.iterations.spec === 0) {
          state.iterations.spec = 1;
          await this.stateManager.save(phase, state);
        }
        
        // Log task completion
        await this.logTaskCompletion({
          taskId: `SPEC-${phase}`,
          taskTitle: `Specification generation for ${phase}`,
          phase: 'Phase 2: Basic Commands',
          phaseTitle: this.extractPhaseTitle(phase),
          completedBy: 'orchestrator',
          artifacts: [result.filePath || `${phase}-spec.md`],
          acceptanceCriteria: ['Specification document generated', 'All required sections included'],
          notes: `Specification for ${phase} successfully generated and validated`
        });
      }
      
      // Enhanced result with orchestrator metadata
      return {
        ...result,
        orchestrator: {
          version: '1.0.0',
          command: 'spec',
          executedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        phase,
        error: error.message
      };
    }
  }

  /**
   * T125: Execute research command with dependency validation
   */
  async executeResearchCommand(phase, options) {
    try {
      // Check prerequisites
      const state = await this.stateManager.load(phase);
      if (!state.approvals?.spec?.approved_by) {
        return {
          success: false,
          phase,
          error: 'Specification must be approved before starting research',
          prerequisiteCheck: { specApproved: false }
        };
      }

      // Ensure phase title from state
      if (options.researchData && !options.researchData.phaseTitle) {
        options.researchData.phaseTitle = state.phaseTitle || this.extractPhaseTitle(phase);
      }

      // Auto-enable analysis if alternative analysis data is present
      if (options.researchData?.alternativeAnalysis && !options.includeAnalysis) {
        options.includeAnalysis = true;
      }

      const result = await researchCommand(phase, this.stateManager, options);
      
      return {
        ...result,
        orchestrator: {
          version: '1.0.0',
          command: 'research',
          executedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        phase,
        error: error.message
      };
    }
  }

  /**
   * T126: Execute plan command with architecture validation
   */
  async executePlanCommand(phase, options) {
    try {
      // Check prerequisites
      const state = await this.stateManager.load(phase);
      if (!state.approvals?.research?.approved_by) {
        return {
          success: false,
          phase,
          error: 'Research must be approved before starting planning',
          prerequisiteCheck: { researchApproved: false }
        };
      }

      // Ensure phase title from state
      if (options.planData && !options.planData.phaseTitle) {
        options.planData.phaseTitle = state.phaseTitle || this.extractPhaseTitle(phase);
      }

      const result = await planCommand(phase, this.stateManager, options);
      
      return {
        ...result,
        orchestrator: {
          version: '1.0.0',
          command: 'plan',
          executedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        phase,
        error: error.message
      };
    }
  }

  /**
   * T127: Execute tasks command with timeline validation
   */
  async executeTasksCommand(phase, options) {
    try {
      // Check prerequisites
      const state = await this.stateManager.load(phase);
      if (!state.approvals?.plan?.approved_by) {
        return {
          success: false,
          phase,
          error: 'Implementation plan must be approved before creating tasks',
          prerequisiteCheck: { planApproved: false }
        };
      }

      // Ensure phase title from state
      if (options.tasksData && !options.tasksData.phaseTitle) {
        options.tasksData.phaseTitle = state.phaseTitle || this.extractPhaseTitle(phase);
      }

      const result = await tasksCommand(phase, this.stateManager, options);
      
      return {
        ...result,
        orchestrator: {
          version: '1.0.0',
          command: 'tasks',
          executedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        phase,
        error: error.message
      };
    }
  }

  /**
   * T128: Get comprehensive phase status
   */
  async getPhaseStatus(phase) {
    try {
      const state = await this.stateManager.load(phase);
      
      const status = {
        success: true,
        phase,
        phaseTitle: state.phaseTitle || this.extractPhaseTitle(phase),
        currentStep: state.currentStep,
        nextAction: state.nextAction,
        completedSteps: state.completedSteps || [],
        progress: this.calculateProgress(state),
        approvals: {
          spec: !!state.approvals?.spec?.approved_by,
          research: !!state.approvals?.research?.approved_by,
          plan: !!state.approvals?.plan?.approved_by,
          tasks: !!state.approvals?.tasks?.approved_by
        },
        iterations: state.iterations || { spec: 0, research: 0, plan: 0, tasks: 0 },
        blockers: state.blockers || [],
        dependencies: state.dependencies || [],
        metadata: state.metadata
      };

      return status;
    } catch (error) {
      return {
        success: false,
        phase,
        error: `Could not retrieve status: ${error.message}`
      };
    }
  }

  /**
   * T129: Process user approval with workflow validation
   */
  async processApproval(phase, options) {
    try {
      const { type, approved, comments, feedback } = options;
      
      if (!type || !['spec', 'research', 'plan', 'tasks'].includes(type)) {
        return {
          success: false,
          error: 'Invalid approval type. Must be: spec, research, plan, or tasks'
        };
      }

      const state = await this.stateManager.load(phase);
      const iteration = state.iterations[type] || 1;

      const approvalResponse = await processApprovalResponse(phase, type, {
        approved: !!approved,
        comments: comments || '',
        feedback: feedback || [],
        iteration
      });

      // Update state with approval
      state.approvals[type] = {
        ...approvalResponse,
        approved_by: 'user' // Ensure approved_by field is set
      };
      
      if (approved) {
        state.completedSteps = state.completedSteps || [];
        if (!state.completedSteps.includes(type)) {
          state.completedSteps.push(type);
        }
        
        // Set next action based on workflow
        const nextActions = {
          spec: 'start_research',
          research: 'start_plan', 
          plan: 'start_tasks',
          tasks: 'ready_for_handoff'
        };
        state.nextAction = nextActions[type] || 'completed';
      }

      await this.stateManager.save(phase, state);

      return {
        success: true,
        phase,
        type,
        approved: !!approved,
        approvalResponse,
        nextAction: state.nextAction
      };
    } catch (error) {
      return {
        success: false,
        phase,
        error: error.message
      };
    }
  }

  /**
   * Execute complete workflow from spec to tasks
   */
  async executeCompleteWorkflow(phase, workflowData) {
    const results = {
      phase,
      steps: {},
      success: true,
      errors: []
    };

    try {
      // Step 1: Specification
      if (workflowData.spec) {
        results.steps.spec = await this.executeSpecCommand(phase, {
          specData: workflowData.spec
        });
        
        if (!results.steps.spec.success) {
          results.success = false;
          results.errors.push(`Spec failed: ${results.steps.spec.error}`);
          return results;
        }

        // Auto-approve if requested
        if (workflowData.autoApprove?.spec) {
          await this.processApproval(phase, {
            type: 'spec',
            approved: true,
            comments: 'Auto-approved for workflow execution'
          });
        }
      }

      // Step 2: Research (if spec approved)
      if (workflowData.research) {
        results.steps.research = await this.executeResearchCommand(phase, {
          researchData: workflowData.research,
          includeAnalysis: true
        });
        
        if (!results.steps.research.success) {
          results.success = false;
          results.errors.push(`Research failed: ${results.steps.research.error}`);
          return results;
        }

        if (workflowData.autoApprove?.research) {
          await this.processApproval(phase, {
            type: 'research',
            approved: true,
            comments: 'Auto-approved for workflow execution'
          });
        }
      }

      // Step 3: Plan (if research approved)
      if (workflowData.plan) {
        results.steps.plan = await this.executePlanCommand(phase, {
          planData: workflowData.plan,
          validateArchitecture: true,
          includeFileStructure: true
        });
        
        if (!results.steps.plan.success) {
          results.success = false;
          results.errors.push(`Plan failed: ${results.steps.plan.error}`);
          return results;
        }

        if (workflowData.autoApprove?.plan) {
          await this.processApproval(phase, {
            type: 'plan',
            approved: true,
            comments: 'Auto-approved for workflow execution'
          });
        }
      }

      // Step 4: Tasks (if plan approved)
      if (workflowData.tasks) {
        results.steps.tasks = await this.executeTasksCommand(phase, {
          tasksData: workflowData.tasks,
          validateTasks: true,
          analyzeDependencies: true,
          managePriorities: true
        });
        
        if (!results.steps.tasks.success) {
          results.success = false;
          results.errors.push(`Tasks failed: ${results.steps.tasks.error}`);
          return results;
        }
      }

      return results;
    } catch (error) {
      results.success = false;
      results.errors.push(`Workflow execution failed: ${error.message}`);
      return results;
    }
  }

  /**
   * Helper methods
   */
  isValidPhaseFormat(phase) {
    return /^st\d{2}-[\w-]+$/.test(phase);
  }

  extractPhaseTitle(phase) {
    return phase.replace(/^st\d{2}-/, '').replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  calculateProgress(state) {
    const totalSteps = 4; // spec, research, plan, tasks
    const completedSteps = (state.completedSteps || []).length;
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Log task completion
   */
  async logTaskCompletion(taskData) {
    try {
      await this.taskLogger.logTaskCompletion(taskData);
    } catch (error) {
      console.warn('Failed to log task completion:', error.message);
      // Don't fail the main operation due to logging issues
    }
  }

  /**
   * Get project progress and completion status
   */
  async getProjectProgress(phase = null) {
    try {
      const progressData = await this.taskLogger.getCompletionStatus(phase);
      
      return {
        success: true,
        progress: progressData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get progress: ${error.message}`
      };
    }
  }
}

module.exports = { Orchestrator };

console.log('🎯 Orchestrator Controller: Centralized command routing and workflow management ready');