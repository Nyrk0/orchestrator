async executeDashboard() {
    console.log(`📊 Generating project dashboard...`);
    const { DashboardCommand } = require('./commands/dashboard');
    const command = new DashboardCommand(this.orchestrator);
    await command.execute();
  }

  showVersion() {t { TemplateEngine } = require('./core/template-engine');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class OrchCLI {
  constructor() {
    this.orchestrator = null;
    this.defaultStateDir = './orchestrator-states';
    this.defaultTemplateDir = './templates';
    this.configPath = path.join(os.homedir(), '.config', 'orchestrator', 'orch-config.json');
    this.config = null;
  }

  async checkConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('❌ Orchestrator not configured.');
        console.log('Please run "/orch setup" to perform first-time setup.');
        return false;
      }
      throw error;
    }
  }

  async initialize() {
    // Ensure directories exist
    await fs.mkdir(this.defaultStateDir, { recursive: true });
    await fs.mkdir(this.defaultTemplateDir, { recursive: true });
    
    // Initialize orchestrator components
    const stateManager = new OrchStateManager(this.defaultStateDir);
    const templateEngine = new TemplateEngine(this.defaultTemplateDir);
    this.orchestrator = new Orchestrator({ stateManager, templateEngine, config: this.config });
  }

  async run() {
    if (!await this.checkConfig()) {
      process.exit(1); // Exit if config is missing
    }

    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return;
    }

    try {
      await this.initialize();
      await this.executeCommand(args);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async executeCommand(args) {
    const [command, phase, ...options] = args;

    switch (command) {
      case 'spec':
        await this.executeSpec(phase, options);
        break;
      case 'research':
        await this.executeResearch(phase, options);
        break;
      case 'plan':
        await this.executePlan(phase, options);
        break;
      case 'prd':
        await this.executePRD(phase, options);
        break;
      case 'tasks':
        await this.executeTasks(phase, options);
        break;
      case 'status':
        await this.executeStatus(phase);
        break;
      case 'progress':
        await this.executeProgress(phase);
        break;
      case 'approve':
        await this.executeApprove(phase, options);
        break;
      case 'workflow':
        await this.executeWorkflow(phase, options);
        break;
      case 'batch':
        await this.executeBatch(options);
        break;
      case 'export':
        await this.executeExport(phase, options);
        break;
      case 'remember':
        await this.executeRemember(phase, options);
        break;
      case 'dashboard':
        await this.executeDashboard();
        break;
      case 'version':
        this.showVersion();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node cli.js --help" for usage information');
        process.exit(1);
    }
  }

  async executeSpec(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for spec command');
      console.log('Usage: node cli.js spec <phase> --objectives "..." --requirements "..."');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const specData = {
      objectives: this.parseList(parsedOptions.objectives) || ['Specification objective to be defined'],
      requirements: this.parseList(parsedOptions.requirements) || ['Requirements to be specified'],
      dependencies: this.parseList(parsedOptions.dependencies) || [],
      successCriteria: this.parseList(parsedOptions.criteria) || []
    };

    console.log(`🎯 Generating specification for ${phase}...`);
    
    const result = await this.orchestrator.executeCommand('spec', phase, { specData });
    
    if (result.success) {
      console.log(`✅ Specification generated successfully`);
      console.log(`📄 Document: ${result.documentPath}`);
      console.log(`🔄 Iteration: ${result.iterationNumber}`);
      
      if (result.dependencyValidation && !result.dependencyValidation.valid) {
        console.log(`⚠️  Missing dependencies: ${result.dependencyValidation.missingDependencies.join(', ')}`);
      }
    } else {
      console.error(`❌ Specification generation failed: ${result.error}`);
    }
  }

  async executeResearch(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for research command');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const researchData = {
      primarySources: this.parseList(parsedOptions.sources) || ['Primary sources to be documented'],
      technicalFoundation: parsedOptions.foundation || 'Technical foundation to be established',
      alternativeAnalysis: parsedOptions.alternatives ? 
        JSON.parse(parsedOptions.alternatives) : undefined,
      recommendedApproach: parsedOptions.recommended || undefined,
      justification: parsedOptions.justification || undefined
    };

    console.log(`🔬 Conducting research analysis for ${phase}...`);
    
    const result = await this.orchestrator.executeCommand('research', phase, { researchData });
    
    if (result.success) {
      console.log(`✅ Research analysis completed`);
      console.log(`📄 Document: ${result.documentPath}`);
    } else {
      console.error(`❌ Research analysis failed: ${result.error}`);
    }
  }

  async executePlan(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for plan command');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const planData = {
      architectureOverview: parsedOptions.architecture || 'Architecture overview to be defined',
      coreComponents: parsedOptions.components ? 
        this.parseComponents(parsedOptions.components) : 
        [{ name: 'CoreComponent', purpose: 'Main component', dependencies: [] }],
      fileStructure: parsedOptions.structure ? 
        JSON.parse(parsedOptions.structure) : undefined,
      implementationStrategy: parsedOptions.strategy || 'Implementation strategy to be determined'
    };

    console.log(`📋 Creating implementation plan for ${phase}...`);
    
    const result = await this.orchestrator.executeCommand('plan', phase, { planData });
    
    if (result.success) {
      console.log(`✅ Implementation plan created`);
      console.log(`📄 Document: ${result.documentPath}`);
    } else {
      console.error(`❌ Plan creation failed: ${result.error}`);
    }
  }

  async executePRD(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for prd command');
      console.log('Usage: node cli.js prd <phase> --goal "..." --features "..."');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const prdData = {
      mvpGoal: parsedOptions.goal || 'MVP goal to be defined through semantic analysis',
      keyFeatures: parsedOptions.features ? 
        this.parseFeatures(parsedOptions.features) : [],
      successMetrics: parsedOptions.metrics ? 
        this.parseMetrics(parsedOptions.metrics) : [],
      outOfScope: parsedOptions.outOfScope ? 
        this.parseOutOfScope(parsedOptions.outOfScope) : []
    };

    console.log(`🎯 Generating PRD with semantic analysis for ${phase}...`);
    
    const result = await this.orchestrator.executeCommand('prd', phase, { prdData, interactive: parsedOptions.interactive });
    
    if (result.success) {
      console.log(`✅ PRD generated successfully`);
      console.log(`📄 Document: ${result.document}`);
      console.log(`🧠 Semantic analysis completed`);
      
      if (result.data && result.data.estimatedTimeline) {
        console.log(`⏱️  Estimated timeline: ${result.data.estimatedTimeline}`);
      }
    } else {
      console.error(`❌ PRD generation failed: ${result.error}`);
    }
  }

  async executeTasks(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for tasks command');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const tasksData = {
      coreTasks: parsedOptions.tasks ? 
        this.parseTasks(parsedOptions.tasks, parsedOptions.hours) : 
        [{ id: 'TASK-001', title: 'Setup', description: 'Initial setup', priority: 'high', estimatedHours: 8 }],
      resourceAllocation: {
        developers: parseInt(parsedOptions.developers) || 1,
        hoursPerDay: parseInt(parsedOptions.hoursPerDay) || 8
      }
    };

    console.log(`📝 Generating task breakdown for ${phase}...`);
    
    const result = await this.orchestrator.executeCommand('tasks', phase, { tasksData });
    
    if (result.success) {
      console.log(`✅ Task breakdown generated`);
      console.log(`📄 Document: ${result.documentPath}`);
      
      if (result.timelineEstimation) {
        console.log(`⏱️  Total hours: ${result.timelineEstimation.totalHours}`);
        console.log(`📅 Estimated days: ${result.timelineEstimation.totalDays}`);
      }
    } else {
      console.error(`❌ Task generation failed: ${result.error}`);
    }
  }

  async executeStatus(phase) {
    if (!phase) {
      console.error('❌ Phase name required for status command');
      return;
    }

    console.log(`📊 Getting status for ${phase}...`);
    
    const result = await this.orchestrator.getPhaseStatus(phase);
    
    if (result.success) {
      console.log(`
📋 Phase Status: ${result.phaseTitle}`);
      console.log(`🎯 Current Step: ${result.currentStep || 'Not started'}`);
      console.log(`📈 Progress: ${result.progress}%`);
      console.log(`⏭️  Next Action: ${result.nextAction || 'None'}`);
      
      console.log(`
✅ Approvals:`);
      console.log(`   Spec: ${result.approvals.spec ? '✓' : '○'}`);
      console.log(`   Research: ${result.approvals.research ? '✓' : '○'}`);
      console.log(`   Plan: ${result.approvals.plan ? '✓' : '○'}`);
      console.log(`   PRD: ${result.approvals.prd ? '✓' : '○'}`);
      console.log(`   Tasks: ${result.approvals.tasks ? '✓' : '○'}`);
      
      console.log(`
🔄 Iterations:`);
      console.log(`   Spec: ${result.iterations.spec}`);
      console.log(`   Research: ${result.iterations.research}`);
      console.log(`   Plan: ${result.iterations.plan}`);
      console.log(`   PRD: ${result.iterations.prd}`);
      console.log(`   Tasks: ${result.iterations.tasks}`);
      
      if (result.dependencies && result.dependencies.length > 0) {
        console.log(`
🔗 Dependencies: ${result.dependencies.join(', ')}`);
      }
      
      if (result.blockers && result.blockers.length > 0) {
        console.log(`
⚠️  Blockers: ${result.blockers.join(', ')}`);
      }
    } else {
      console.error(`❌ Status check failed: ${result.error}`);
    }
  }

  async executeProgress(phase) {
    console.log(`📊 Getting project completion progress${phase ? ` for ${phase}` : ''}...`);
    
    const result = await this.orchestrator.getProjectProgress(phase);
    
    if (result.success) {
      const progress = result.progress;
      
      if (phase) {
        // Phase-specific progress
        console.log(`
📋 Phase Progress: ${progress.phase}`);
        console.log(`✅ Completed Tasks: ${progress.completedTasks}`);
        console.log(`📊 Status: ${progress.status}`);
        
        if (progress.recentTasks && progress.recentTasks.length > 0) {
          console.log(`
🕒 Recent Activity:`);
          progress.recentTasks.forEach(task => {
            console.log(`   ✅ ${task.taskId}: ${task.taskTitle}`);
            console.log(`      Completed: ${new Date(task.completedAt).toLocaleString()}`);
          });
        }
      } else {
        // Overall project progress
        const summary = progress.summary;
        console.log(`
🎯 Overall Project Progress:`);
        console.log(`   Project: ${progress.project}`);
        console.log(`   Total Tasks: ${summary.totalCompleted} / ${summary.totalPlanned} (${summary.completionPercentage}%)`);
        console.log(`   Phases Complete: ${summary.phasesCompleted} / ${summary.totalPhases}`);
        console.log(`   Tasks Today: ${summary.tasksToday}`);
        
        if (summary.lastTaskCompleted) {
          console.log(`   Last Task: ${summary.lastTaskCompleted.taskTitle}`);
          console.log(`   Completed: ${new Date(summary.lastTaskCompleted.completedAt).toLocaleString()}`);
        }
        
        // Phase breakdown
        console.log(`
📋 Phase Breakdown:`);
        Object.entries(progress.phases).forEach(([phaseName, tasks]) => {
          const phaseStatus = tasks.length >= 30 ? '✅' : tasks.length >= 20 ? '🔄' : tasks.length > 0 ? '🟡' : '⏳';
          console.log(`   ${phaseStatus} ${phaseName}: ${tasks.length} tasks completed`);
        });
        
        // Overall status
        if (summary.completionPercentage >= 100) {
          console.log(`
🎉 PROJECT COMPLETE! All planned tasks have been finished.`);
        } else {
          const remaining = summary.totalPlanned - summary.totalCompleted;
          console.log(`
📈 Project Status: ${summary.completionPercentage}% complete`);
          console.log(`   Remaining: ${remaining} tasks`);
        }
      }
    } else {
      console.error(`❌ Progress check failed: ${result.error}`);
    }
  }

  async executeApprove(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for approve command');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const approvalData = {
      type: parsedOptions.type || 'spec',
      approved: parsedOptions.approved !== undefined ? parsedOptions.approved !== 'false' : true,
      comments: parsedOptions.comments || 'CLI approval',
      feedback: this.parseList(parsedOptions.feedback) || []
    };

    console.log(`${approvalData.approved ? '✅' : '❌'} Processing ${approvalData.type} approval for ${phase}...`);
    
    const result = await this.orchestrator.processApproval(phase, approvalData);
    
    if (result.success) {
      console.log(`✅ Approval processed successfully`);
      console.log(`📋 Type: ${result.type}`);
      console.log(`✓ Approved: ${result.approved}`);
      console.log(`⏭️  Next Action: ${result.nextAction}`);
    } else {
      console.error(`❌ Approval failed: ${result.error}`);
    }
  }

  async executeWorkflow(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for workflow command');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const autoApprove = parsedOptions.autoApprove !== 'false';
    
    let workflowData;
    if (parsedOptions.config) {
      try {
        const configContent = await fs.readFile(parsedOptions.config, 'utf8');
        workflowData = JSON.parse(configContent);
      } catch (error) {
        console.error(`❌ Failed to load config file: ${error.message}`);
        return;
      }
    } else {
      // Default workflow data
      workflowData = {
        spec: {
          objectives: ['Complete workflow execution'],
          requirements: ['Automated processing']
        },
        research: {
          primarySources: ['Workflow documentation'],
          technicalFoundation: 'Automated workflow processing'
        },
        plan: {
          architectureOverview: 'Workflow-based architecture',
          coreComponents: [{ name: 'WorkflowProcessor', purpose: 'Process workflows', dependencies: [] }]
        },
        tasks: {
          coreTasks: [
            { id: 'WF-001', title: 'Workflow Setup', description: 'Initialize workflow', priority: 'high', estimatedHours: 4 }
          ]
        },
        autoApprove: autoApprove ? { spec: true, research: true, plan: true } : {}
      };
    }

    console.log(`🔄 Executing complete workflow for ${phase}...`);
    
    const result = await this.orchestrator.executeCompleteWorkflow(phase, workflowData);
    
    if (result.success) {
      console.log(`✅ Complete workflow executed successfully`);
      console.log(`📋 Steps completed:`);
      if (result.steps.spec?.success) console.log(`   ✓ Specification`);
      if (result.steps.research?.success) console.log(`   ✓ Research`);
      if (result.steps.plan?.success) console.log(`   ✓ Plan`);
      if (result.steps.tasks?.success) console.log(`   ✓ Tasks`);
    } else {
      console.error(`❌ Workflow execution failed`);
      if (result.errors.length > 0) {
        console.error(`Errors: ${result.errors.join(', ')}`);
      }
    }
  }

  async executeBatch(options) {
    const parsedOptions = this.parseOptions(options);
    const phases = this.parseList(parsedOptions.phases);
    const command = parsedOptions.command || 'spec';
    const parallel = parsedOptions.parallel !== 'false';

    if (!phases || phases.length === 0) {
      console.error('❌ Phases list required for batch command');
      console.log('Usage: node cli.js batch --phases "st01,st02,st03" --command spec');
      return;
    }

    console.log(`🚀 Executing batch ${command} for ${phases.length} phases...`);

    const operations = phases.map(phase => {
      switch (command) {
        case 'spec':
          return this.orchestrator.executeCommand('spec', phase, {
            specData: {
              objectives: [`Batch ${command} for ${phase}`],
              requirements: ['Batch processing']
            }
          });
        case 'status':
          return this.orchestrator.getPhaseStatus(phase);
        default:
          throw new Error(`Unsupported batch command: ${command}`);
      }
    });

    try {
      const results = parallel ? 
        await Promise.all(operations) : 
        await this.sequentialExecution(operations);

      const successful = results.filter(r => r.success).length;
      console.log(`✅ Batch operation completed: ${successful}/${results.length} successful`);

      results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${phases[index]}: ${result.success ? 'Success' : result.error}`);
      });
    } catch (error) {
      console.error(`❌ Batch execution failed: ${error.message}`);
    }
  }

  async executeExport(phase, options) {
    if (!phase) {
      console.error('❌ Phase name required for export command');
      return;
    }

    const parsedOptions = this.parseOptions(options);
    const format = parsedOptions.format || 'json';
    const output = parsedOptions.output || `./${phase}-export.${format}`;

    console.log(`📤 Exporting ${phase} data...`);

    try {
      const status = await this.orchestrator.getPhaseStatus(phase);
      
      if (!status.success) {
        console.error(`❌ Cannot export ${phase}: ${status.error}`);
        return;
      }

      const exportData = {
        phase: status.phase,
        phaseTitle: status.phaseTitle,
        status: status,
        exportedAt: new Date().toISOString(),
        format: format
      };

      let outputContent;
      switch (format) {
        case 'json':
          outputContent = JSON.stringify(exportData, null, 2);
          break;
        case 'yaml':
          // Simple YAML-like format
          outputContent = this.toYAML(exportData);
          break;
        default:
          console.error(`❌ Unsupported export format: ${format}`);
          return;
      }

      await fs.writeFile(output, outputContent);
      console.log(`✅ Export completed: ${output}`);

    } catch (error) {
      console.error(`❌ Export failed: ${error.message}`);
    }
  }

  async sequentialExecution(operations) {
    const results = [];
    for (const operation of operations) {
      results.push(await operation);
    }
    return results;
  }

  async executeRemember(phase, options) {
    const parsedOptions = this.parseOptions(options);
    
    // Get the text from arguments (everything after 'remember')
    let textToRemember = parsedOptions.text || parsedOptions.note || parsedOptions.directive;
    
    // If not in options, try to get from remaining arguments
    if (!textToRemember && options.length > 0) {
      textToRemember = options.join(' ').replace(/^["']|["']$/g, ''); // Remove quotes
    }
    
    if (!textToRemember) {
      console.error('❌ Text required for remember command');
      console.log('Usage: node cli.js remember "Your important note here"');
      return;
    }

    console.log(`🧠 Adding user directive to project memory...`);
    
    const result = await this.orchestrator.executeCommand('remember', null, { text: textToRemember });
    
    if (result.success) {
      console.log(`✅ User directive added to project log`);
      console.log(`📝 Text: "${result.text}"`);
      console.log(`📍 Location: ${result.location}`);
    } else {
      console.error(`❌ Failed to add directive: ${result.error}`);
    }
  }

  parseOptions(options) {
    const parsed = {};
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].startsWith('--')) {
        const key = options[i].substring(2);
        const value = (i + 1 < options.length && !options[i + 1].startsWith('--')) 
          ? options[i + 1] 
          : true;
        
        parsed[key] = value;
        if (value !== true) i++; // Skip next item if it was used as value
      }
    }
    
    return parsed;
  }

  parseList(value) {
    if (!value || typeof value !== 'string') return null;
    return value.split(',').map(item => item.trim());
  }

  parseComponents(value) {
    if (!value) return [];
    return value.split(',').map(comp => ({
      name: comp.trim(),
      purpose: `${comp.trim()} component`,
      dependencies: []
    }));
  }

  parseFeatures(value) {
    if (!value) return [];
    return value.split(',').map(feature => feature.trim());
  }

  parseMetrics(value) {
    if (!value) return [];
    return value.split(',').map(metric => metric.trim());
  }

  parseOutOfScope(value) {
    if (!value) return [];
    return value.split(',').map(item => item.trim());
  }

  parseTasks(tasksString, hoursString) {
    if (!tasksString) return [];
    
    const tasks = tasksString.split(',').map(task => task.trim());
    const hours = hoursString ? hoursString.split(',').map(h => parseInt(h.trim())) : [];
    
    return tasks.map((task, index) => ({
      id: `TASK-${(index + 1).toString().padStart(3, '0')}`,
      title: task,
      description: `${task} implementation`,
      priority: index === 0 ? 'high' : 'medium',
      estimatedHours: hours[index] || 8
    }));
  }

  toYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let result = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        value.forEach(item => {
          result += `${spaces}  - ${item}\n`;
        });
      } else {
        result += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return result;
  }

  showVersion() {
    console.log('QUALIA•NSS Orchestrator CLI v1.0.0');
    console.log('Production Ready - Enterprise-grade specification-driven development');
  }

  showHelp() {
    console.log(`
🎯 QUALIA•NSS Orchestrator CLI
===============================

A comprehensive specification-driven development framework CLI

USAGE:
    node cli.js <command> [phase] [options]

COMMANDS:
    spec <phase>        Generate specification document
    research <phase>    Conduct research analysis  
    plan <phase>        Create implementation plan
    prd <phase>         Generate Product Requirements Document (MVP definition)
    tasks <phase>       Generate task breakdown
    status <phase>      Check phase status
    progress [phase]    Show project completion progress
    approve <phase>     Process approval
    workflow <phase>    Execute complete workflow
    batch               Batch process multiple phases
    export <phase>      Export phase data
    remember "<text>"   Add user directive to project memory
    version             Show version information

EXAMPLES:
    # Generate specification
    node cli.js spec st01-audio-engine --objectives "Real-time audio" --requirements "Low latency"
    
    # Conduct research with alternatives
    node cli.js research st01-audio-engine --sources "Web Audio API docs" --foundation "Technical analysis"
    
    # Create implementation plan
    node cli.js plan st01-audio-engine --architecture "Component-based system" --components "AudioProcessor,UIController"
    
    # Generate Product Requirements Document (MVP)
    node cli.js prd st01-audio-engine --goal "Real-time audio MVP" --features "BasicPlayback,VolumeControl"
    
    # Generate task breakdown
    node cli.js tasks st01-audio-engine --tasks "Setup,Development,Testing" --hours "8,24,12"
    
    # Check status
    node cli.js status st01-audio-engine
    
    # Show project completion progress
    node cli.js progress                    # Overall project progress
    node cli.js progress st01-audio-engine  # Phase-specific progress
    
    # Process approval
    node cli.js approve st01-audio-engine --type spec --approved --comments "Looks good"
    
    # Execute complete workflow
    node cli.js workflow st01-audio-engine --auto-approve --config workflow.json
    
    # Batch processing
    node cli.js batch --phases "st01,st02,st03" --command spec --parallel
    
    # Export data
    node cli.js export st01-audio-engine --format json --output ./exports/
    
    # Add user directive to project memory
    node cli.js remember "All API endpoints must be secured with OAuth2"

PHASE FORMAT:
    st##-descriptive-name (e.g., st01-foundation, st07-audio-engine)

OPTIONS:
    --objectives <list>     Comma-separated objectives
    --requirements <list>   Comma-separated requirements  
    --dependencies <list>   Comma-separated dependencies
    --sources <list>        Research sources
    --foundation <text>     Technical foundation
    --architecture <text>   Architecture overview
    --components <list>     Component names
    --goal <text>           PRD MVP goal statement
    --features <list>       Key MVP features (comma-separated)
    --metrics <list>        Success metrics (comma-separated)
    --tasks <list>          Task names
    --hours <list>          Estimated hours per task
    --type <type>           Approval type (spec|research|plan|prd|tasks)
    --approved              Mark as approved
    --comments <text>       Approval comments
    --auto-approve          Auto-approve workflow steps
    --config <file>         Configuration file path
    --phases <list>         Phase list for batch operations
    --command <cmd>         Command for batch operations
    --parallel              Execute batch operations in parallel
    --format <format>       Export format (json|yaml)
    --output <path>         Output file path

For more information, visit: https://github.com/your-repo/orchestrator
`);
  }
}


// Run CLI if called directly
if (require.main === module) {
  const cli = new OrchCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = { OrchCLI };

console.log('🖥️  CLI Interface: Command-line orchestrator interface ready');
