const fs = require('fs').promises;
const path = require('path');

class DashboardCommand {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.devDir = './dev'; // Assuming dev directory is at the root
  }

  async execute() {
    try {
      const phases = await this.getPhases();
      const dashboardContent = this.generateMarkdown(phases);
      const dashboardPath = path.join(this.devDir, 'dashboard.md');
      await fs.writeFile(dashboardPath, dashboardContent);
      console.log(`✅ Dashboard generated successfully at ${dashboardPath}`);

      this.runAdvisor(phases);
    } catch (error) {
      console.error(`❌ Error generating dashboard: ${error.message}`);
    }
  }

  async getPhases() {
    const phaseDirs = await fs.readdir(this.devDir, { withFileTypes: true });
    const phases = [];
    for (const dirent of phaseDirs) {
      if (dirent.isDirectory() && dirent.name.startsWith('st')) {
        const phaseName = dirent.name;
        const statePath = path.join(this.devDir, phaseName, '.orch-state.json');
        const tasksPath = path.join(this.devDir, phaseName, 'tasks.md');
        let state = {};
        let progress = { completed: 0, total: 0 };

        try {
          const stateData = await fs.readFile(statePath, 'utf8');
          state = JSON.parse(stateData);
        } catch (e) { /* state file might not exist */ }

        try {
          const tasksData = await fs.readFile(tasksPath, 'utf8');
          const total = (tasksData.match(/\- \[ \]/g) || []).length;
          const completed = (tasksData.match(/\- \[x\]/g) || []).length;
          progress = { completed, total: total + completed };
        } catch (e) { /* tasks.md might not exist */ }

        phases.push({ name: phaseName, state, progress });
      }
    }
    return phases.sort((a, b) => a.name.localeCompare(b.name));
  }

  generateMarkdown(phases) {
    let table = `| Phase | Title | Spec | Research | Plan | PRD | Tasks | Progress |\n| :---- | :---- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    const legend = `*Legend: ✅ Approved, 🚧 In Progress, ⚪️ Not Started, 🔄 Needs Revision, 🐞 Debugging, 🛑 Blocked*`;

    for (const phase of phases) {
      const title = phase.name.split('-').slice(1).join(' ').replace(/\b\w/g, l => l.toUpperCase());
      const specStatus = this.getStatusIcon(phase.state.spec);
      const researchStatus = this.getStatusIcon(phase.state.research);
      const planStatus = this.getStatusIcon(phase.state.plan);
      const prdStatus = this.getStatusIcon(phase.state.prd);
      const tasksStatus = this.getStatusIcon(phase.state.tasks);

      const prog = phase.progress;
      const percentage = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
      const progressBar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
      const progressText = prog.total > 0 ? `${progressBar} ${percentage}% (${prog.completed}/${prog.total})` : 'N/A';

      table += `| `${phase.name}` | **${title}** | ${specStatus} | ${researchStatus} | ${planStatus} | ${prdStatus} | ${tasksStatus} | ${progressText} |
`;
    }

    return `# Project Dashboard\n\n*Last updated: ${new Date().toLocaleString()}*\n\n${table}\n${legend}`;
  }

  getStatusIcon(status) {
    switch (status) {
      case 'approved': return '✅';
      case 'in_progress': return '🚧';
      case 'rejected': return '🔄';
      case 'blocked': return '🛑';
      case 'debugging': return '🐞';
      default: return '⚪️';
    }
  }

  runAdvisor(phases) {
    console.log('\n\n--- 🤖 Orchestrator Advisor ---');
    const suggestions = [];

    for (const phase of phases) {
        // Simplified advisor logic
        if (phase.state.spec === 'approved' && phase.state.research !== 'approved') {
            suggestions.push(`**[Advance]** The `spec` for **${phase.name}** is approved. You can now begin research with `/orch research ${phase.name}`.`);
        }
        if (phase.state.plan === 'rejected') {
            suggestions.push(`**[Fix]** The `plan` for **${phase.name}** was rejected. Review feedback and run `/orch plan ${phase.name}` again.`);
        }
    }

    if (suggestions.length > 0) {
      console.log('Here are the most logical next steps for the project:\n');
      suggestions.slice(0, 3).forEach((s, i) => console.log(`${i + 1}. ${s}`));
    } else {
      console.log('✅ Project is on track. No immediate actions required.');
    }
    console.log('-----------------------------');
  }
}

module.exports = { DashboardCommand };