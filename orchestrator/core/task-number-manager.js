/**
 * Task Number Management System
 * Implements T### format for systematic task identification
 */

class TaskNumberManager {
  constructor() {
    this.currentNumber = 1;
    this.taskRegistry = new Map();
    this.phaseTaskCounts = new Map();
  }

  generateTaskNumber() {
    const number = `T${String(this.currentNumber).padStart(3, '0')}`;
    this.currentNumber++;
    return number;
  }

  registerTask(taskNumber, taskData) {
    const task = {
      ...taskData,
      taskNumber,
      created: new Date().toISOString(),
      status: 'pending'
    };
    
    this.taskRegistry.set(taskNumber, task);
    
    // Update phase task count
    if (taskData.phase) {
      const count = this.phaseTaskCounts.get(taskData.phase) || 0;
      this.phaseTaskCounts.set(taskData.phase, count + 1);
    }
    
    return task;
  }

  getTask(taskNumber) {
    return this.taskRegistry.get(taskNumber);
  }

  getTasksByPhase(phase) {
    return Array.from(this.taskRegistry.values())
      .filter(task => task.phase === phase);
  }

  updateTaskStatus(taskNumber, status) {
    const task = this.taskRegistry.get(taskNumber);
    if (task) {
      task.status = status;
      task.lastModified = new Date().toISOString();
      return true;
    }
    return false;
  }

  generateTaskRange(count, phase = null) {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      const taskNumber = this.generateTaskNumber();
      tasks.push({
        taskNumber,
        phase,
        status: 'pending',
        created: new Date().toISOString()
      });
    }
    return tasks;
  }

  getTaskStats() {
    const stats = {
      total: this.taskRegistry.size,
      byStatus: {},
      byPhase: Object.fromEntries(this.phaseTaskCounts),
      nextNumber: this.currentNumber
    };

    this.taskRegistry.forEach(task => {
      const status = task.status || 'pending';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return stats;
  }

  // For integration with template engine
  generateNumberedTaskList(taskDescriptions, phase = null) {
    return taskDescriptions.map(description => {
      const taskNumber = this.generateTaskNumber();
      const task = this.registerTask(taskNumber, {
        description,
        phase,
        complexity: 'medium', // default
        priority: 'normal'     // default
      });
      return `- [ ] **${taskNumber}**: ${description}`;
    }).join('\n');
  }
}

// Global task manager instance
const globalTaskManager = new TaskNumberManager();

module.exports = {
  TaskNumberManager,
  globalTaskManager
};

console.log('🔢 Task Number Manager: T### numbering system ready');