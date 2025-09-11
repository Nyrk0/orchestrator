/**
 * Task Completion Logger
 * Tracks and logs completed tasks for project completion monitoring
 */

const fs = require('fs').promises;
const path = require('path');

class TaskCompletionLogger {
  constructor(options = {}) {
    this.logDirectory = options.logDirectory || './project-logs';
    this.completionFile = path.join(this.logDirectory, 'task-completion.json');
    this.progressFile = path.join(this.logDirectory, 'project-progress.md');
    this.auditFile = path.join(this.logDirectory, 'completion-audit.log');
  }

  /**
   * Log a completed task
   */
  async logTaskCompletion(taskData) {
    try {
      await this.ensureLogDirectory();
      
      const completionEntry = {
        taskId: taskData.taskId,
        taskTitle: taskData.taskTitle,
        phase: taskData.phase,
        phaseTitle: taskData.phaseTitle,
        completedAt: new Date().toISOString(),
        completedBy: taskData.completedBy || 'orchestrator',
        duration: taskData.duration || null,
        status: 'completed',
        acceptanceCriteria: taskData.acceptanceCriteria || [],
        artifacts: taskData.artifacts || [],
        notes: taskData.notes || ''
      };

      // Update completion log
      await this.updateCompletionLog(completionEntry);
      
      // Update progress file
      await this.updateProgressFile();
      
      // Log to audit file
      await this.auditLog(`TASK_COMPLETED: ${taskData.taskId} - ${taskData.taskTitle}`);
      
      return completionEntry;
    } catch (error) {
      console.error('Failed to log task completion:', error);
      throw error;
    }
  }

  /**
   * Update the main completion log (JSON format)
   */
  async updateCompletionLog(completionEntry) {
    try {
      let completionData = { tasks: [], summary: {} };
      
      // Load existing data
      try {
        const existingData = await fs.readFile(this.completionFile, 'utf8');
        completionData = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist yet, use default structure
      }

      // Add new completion
      completionData.tasks.push(completionEntry);
      
      // Update summary
      completionData.summary = this.calculateSummary(completionData.tasks);
      completionData.lastUpdated = new Date().toISOString();

      await fs.writeFile(this.completionFile, JSON.stringify(completionData, null, 2));
    } catch (error) {
      throw new Error(`Failed to update completion log: ${error.message}`);
    }
  }

  /**
   * Update the progress markdown file for human readability
   */
  async updateProgressFile() {
    try {
      const completionData = await this.loadCompletionData();
      const progressContent = this.generateProgressMarkdown(completionData);
      
      await fs.writeFile(this.progressFile, progressContent);
    } catch (error) {
      throw new Error(`Failed to update progress file: ${error.message}`);
    }
  }

  /**
   * Generate progress markdown content
   */
  generateProgressMarkdown(completionData) {
    const { tasks, summary } = completionData;
    const phases = this.groupTasksByPhase(tasks);

    let markdown = `# QUALIA•NSS Orchestrator - Project Completion Progress

**Last Updated**: ${new Date().toISOString()}

## 📊 Overall Progress

**Tasks Completed**: ${summary.totalCompleted || 0} / ${summary.totalPlanned || 160}  
**Completion Rate**: ${summary.completionPercentage || 0}%  
**Phases Complete**: ${summary.phasesCompleted || 0} / ${summary.totalPhases || 4}  

`;

    // Phase-by-phase breakdown
    markdown += `## 📋 Phase-by-Phase Progress

`;

    for (const [phaseName, phaseTasks] of Object.entries(phases)) {
      const phaseCompleted = phaseTasks.length;
      const phaseStatus = this.getPhaseStatus(phaseName, phaseCompleted);
      
      markdown += `### ${phaseName} ${phaseStatus}
**Tasks Completed**: ${phaseCompleted}  
**Last Activity**: ${this.getLastActivity(phaseTasks)}  

`;

      // List completed tasks
      phaseTasks.slice(-5).forEach(task => {
        markdown += `- ✅ **${task.taskId}**: ${task.taskTitle} (${new Date(task.completedAt).toLocaleDateString()})
`;
      });

      if (phaseTasks.length > 5) {
        markdown += `- ... and ${phaseTasks.length - 5} more tasks
`;
      }
      markdown += `
`;
    }

    // Recent activity
    markdown += `## 🕒 Recent Activity (Last 10 Tasks)

`;

    const recentTasks = tasks.slice(-10).reverse();
    recentTasks.forEach(task => {
      markdown += `- ✅ **${task.taskId}** (${task.phase}): ${task.taskTitle}  
  *Completed*: ${new Date(task.completedAt).toLocaleString()}
`;
    });

    // Next milestones
    markdown += `
## 🎯 Project Status

`;

    if (summary.completionPercentage >= 100) {
      markdown += `🎉 **PROJECT COMPLETE!** All planned tasks have been finished.

**Final Status**: Production Ready ✅  
**Achievement**: Enterprise-grade orchestrator system deployed  
**Next Phase**: Operational deployment and maintenance  
`;
    } else {
      markdown += `**Current Phase**: ${this.getCurrentPhase(phases)}  
**Progress**: ${summary.completionPercentage}% complete  
**Estimated Remaining**: ${summary.totalPlanned - summary.totalCompleted} tasks  
`;
    }

    return markdown;
  }

  /**
   * Group tasks by phase
   */
  groupTasksByPhase(tasks) {
    const phases = {};
    tasks.forEach(task => {
      const phaseName = task.phase || 'Unknown Phase';
      if (!phases[phaseName]) phases[phaseName] = [];
      phases[phaseName].push(task);
    });
    return phases;
  }

  /**
   * Get phase status indicator
   */
  getPhaseStatus(phaseName, taskCount) {
    const phaseTargets = {
      'Phase 1: Core Framework': 35,
      'Phase 2: Basic Commands': 38, 
      'Phase 3: Full Command Suite': 42,
      'Phase 4: Integration & Testing': 38,
      'Production Readiness': 7
    };

    const target = phaseTargets[phaseName] || 30;
    if (taskCount >= target) return '✅ COMPLETE';
    if (taskCount >= target * 0.7) return '🔄 IN PROGRESS';
    if (taskCount > 0) return '🟡 STARTED';
    return '⏳ PENDING';
  }

  /**
   * Get last activity timestamp for a phase
   */
  getLastActivity(phaseTasks) {
    if (phaseTasks.length === 0) return 'No activity';
    const latest = phaseTasks[phaseTasks.length - 1];
    return new Date(latest.completedAt).toLocaleString();
  }

  /**
   * Get current active phase
   */
  getCurrentPhase(phases) {
    const phaseOrder = [
      'Phase 1: Core Framework',
      'Phase 2: Basic Commands', 
      'Phase 3: Full Command Suite',
      'Phase 4: Integration & Testing',
      'Production Readiness'
    ];

    for (const phase of phaseOrder) {
      if (!phases[phase] || phases[phase].length < 30) {
        return phase;
      }
    }
    return 'All Phases Complete';
  }

  /**
   * Calculate completion summary
   */
  calculateSummary(tasks) {
    const totalPlanned = 160; // Based on orchestrator-tasks.md
    const totalCompleted = tasks.length;
    const completionPercentage = Math.round((totalCompleted / totalPlanned) * 100);
    
    const phases = this.groupTasksByPhase(tasks);
    const phasesCompleted = Object.keys(phases).filter(phase => 
      phases[phase].length >= 30 // Minimum tasks per phase
    ).length;

    return {
      totalPlanned,
      totalCompleted,
      completionPercentage,
      totalPhases: 5, // 4 main phases + production readiness
      phasesCompleted,
      lastTaskCompleted: tasks.length > 0 ? tasks[tasks.length - 1] : null,
      tasksToday: tasks.filter(task => 
        new Date(task.completedAt).toDateString() === new Date().toDateString()
      ).length
    };
  }

  /**
   * Log to audit file
   */
  async auditLog(message) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      await fs.appendFile(this.auditFile, logEntry);
    } catch (error) {
      console.error('Audit log failed:', error.message);
    }
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create log directory: ${error.message}`);
    }
  }

  /**
   * Load completion data
   */
  async loadCompletionData() {
    try {
      const data = await fs.readFile(this.completionFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { tasks: [], summary: {} };
    }
  }

  /**
   * Get completion status for a phase or project
   */
  async getCompletionStatus(phase = null) {
    try {
      const completionData = await this.loadCompletionData();
      
      if (phase) {
        const phaseTasks = completionData.tasks.filter(task => task.phase === phase);
        return {
          phase,
          completedTasks: phaseTasks.length,
          recentTasks: phaseTasks.slice(-5),
          status: this.getPhaseStatus(phase, phaseTasks.length)
        };
      }

      return {
        project: 'QUALIA•NSS Orchestrator',
        summary: completionData.summary,
        totalTasks: completionData.tasks.length,
        phases: this.groupTasksByPhase(completionData.tasks)
      };
    } catch (error) {
      throw new Error(`Failed to get completion status: ${error.message}`);
    }
  }

  /**
   * Initialize with existing completed tasks (for migration)
   */
  async initializeWithExistingTasks(existingTasks) {
    try {
      await this.ensureLogDirectory();
      
      for (const task of existingTasks) {
        await this.logTaskCompletion(task);
      }
      
      await this.auditLog(`INITIALIZATION: Imported ${existingTasks.length} existing completed tasks`);
      
      return await this.getCompletionStatus();
    } catch (error) {
      throw new Error(`Failed to initialize with existing tasks: ${error.message}`);
    }
  }
}

module.exports = { TaskCompletionLogger };