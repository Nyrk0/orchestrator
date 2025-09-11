/**
 * Log Manager - Context Memory System for Orchestrator
 * Manages orch-log.md with smart filtering and token management
 */

const fs = require('fs').promises;
const path = require('path');

class LogManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.logPath = path.join(projectRoot, 'orch-log.md');
    this.configPath = path.join(projectRoot, '.orchestrator', 'orch-config.json');
    
    // Token limits for different logging levels
    this.tokenLimits = {
      0: 0,      // No logs
      1: 2000,   // Critical Only (1-2K tokens)
      2: 5000,   // Errors & Warnings (3-5K tokens)  
      3: 12000,  // Standard Development (8-12K tokens)
      4: 20000   // Maximum (20K tokens)
    };
  }

  /**
   * Initialize log system with user configuration
   */
  async initialize() {
    const config = await this.loadConfig();
    
    // Check if log file exists
    const logExists = await this.fileExists(this.logPath);
    
    if (!logExists) {
      await this.createInitialLog();
    }
    
    return config;
  }

  /**
   * Load user configuration or create default
   */
  async loadConfig() {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      // Create default config
      const defaultConfig = {
        logLevel: 3, // Standard Development
        userStyle: null, // Will be set during first interaction
        maxTokens: 12000,
        enableChatLogs: true,
        enableAutoRotation: true,
        rotationThreshold: 0.8, // Rotate when 80% of max tokens reached
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await this.saveConfig(defaultConfig);
      return defaultConfig;
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(config) {
    // Ensure .orchestrator directory exists
    const orchDir = path.dirname(this.configPath);
    await fs.mkdir(orchDir, { recursive: true });
    
    config.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Create initial log file
   */
  async createInitialLog() {
    const initialContent = `# Orchestrator Project Log

**Project Context Memory** - Automatically maintained by orch subagent

---

## Recent Sessions (Full Detail)

*Latest development activities with complete context*

---

## Historical Context (Critical Scope Only)

*Key decisions, approvals, and major changes*

---

## Project Milestones

*Major architectural decisions and project evolution*

---

*Generated: ${new Date().toISOString()}*
*Log Level: Will be configured on first interaction*
`;

    await fs.writeFile(this.logPath, initialContent);
  }

  /**
   * Append entry to log with smart filtering
   */
  async appendToLog(entry, level = 'info') {
    const config = await this.loadConfig();
    
    // Check if logging is enabled and level qualifies
    if (config.logLevel === 0 || !this.shouldLog(level, config.logLevel)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedEntry = this.formatLogEntry(entry, level, timestamp);
    
    // Read current log
    let currentLog = '';
    try {
      currentLog = await fs.readFile(this.logPath, 'utf8');
    } catch (error) {
      await this.createInitialLog();
      currentLog = await fs.readFile(this.logPath, 'utf8');
    }

    // Insert into Recent Sessions section
    const recentSectionIndex = currentLog.indexOf('## Recent Sessions (Full Detail)');
    if (recentSectionIndex !== -1) {
      const insertIndex = currentLog.indexOf('\n\n---', recentSectionIndex) + 1;
      const newLog = currentLog.slice(0, insertIndex) + 
                    `\n${formattedEntry}\n` + 
                    currentLog.slice(insertIndex);
      
      await fs.writeFile(this.logPath, newLog);
      
      // Check if rotation is needed
      await this.checkAndRotateLog(config);
    }
  }

  /**
   * Format log entry based on type and level
   */
  formatLogEntry(entry, level, timestamp) {
    const date = new Date(timestamp).toLocaleDateString();
    const time = new Date(timestamp).toLocaleTimeString();
    
    const levelEmoji = {
      'critical': '🚨',
      'error': '❌', 
      'warning': '⚠️',
      'info': 'ℹ️',
      'success': '✅',
      'approval': '👍',
      'phase': '🎯',
      'user': '👤',
      'chat': '💬'
    };

    const emoji = levelEmoji[level] || 'ℹ️';
    
    return `### ${emoji} ${date} ${time}\n${entry}`;
  }

  /**
   * Determine if entry should be logged based on level
   */
  shouldLog(entryLevel, configLevel) {
    const levelPriority = {
      'critical': 4,
      'error': 3,
      'warning': 3,
      'approval': 2,
      'phase': 2,
      'success': 1,
      'info': 1,
      'user': 1,
      'chat': 0
    };

    const entryPriority = levelPriority[entryLevel] || 0;
    
    // Map config level to minimum priority
    const minPriority = {
      1: 4, // Critical only
      2: 3, // Errors & warnings  
      3: 1, // Standard development
      4: 0  // Everything including chat
    };

    return entryPriority >= (minPriority[configLevel] || 1);
  }

  /**
   * Check if log rotation is needed and perform it
   */
  async checkAndRotateLog(config) {
    if (!config.enableAutoRotation) return;

    const logContent = await fs.readFile(this.logPath, 'utf8');
    const estimatedTokens = this.estimateTokens(logContent);
    
    if (estimatedTokens > config.maxTokens * config.rotationThreshold) {
      await this.rotateLog(config);
    }
  }

  /**
   * Rotate log by moving old entries to historical context
   */
  async rotateLog(config) {
    const logContent = await fs.readFile(this.logPath, 'utf8');
    
    // Extract recent sessions
    const recentStart = logContent.indexOf('## Recent Sessions (Full Detail)');
    const recentEnd = logContent.indexOf('## Historical Context (Critical Scope Only)');
    
    if (recentStart === -1 || recentEnd === -1) return;
    
    const recentSessions = logContent.slice(recentStart, recentEnd);
    
    // Extract critical entries from recent sessions
    const criticalEntries = this.extractCriticalEntries(recentSessions);
    
    // Update historical context
    let historicalStart = logContent.indexOf('## Historical Context (Critical Scope Only)');
    let historicalEnd = logContent.indexOf('## Project Milestones');
    
    const newHistoricalContent = `## Historical Context (Critical Scope Only)\n\n${criticalEntries}\n\n`;
    
    // Clear recent sessions and update historical
    const newLog = logContent.slice(0, recentStart) +
                  '## Recent Sessions (Full Detail)\n\n*Latest development activities with complete context*\n\n---\n\n' +
                  newHistoricalContent +
                  logContent.slice(historicalEnd);
                  
    await fs.writeFile(this.logPath, newLog);
    
    // Log the rotation event
    await this.appendToLog(`Log rotated - moved ${criticalEntries.split('###').length - 1} critical entries to historical context`, 'info');
  }

  /**
   * Extract critical entries for historical context
   */
  extractCriticalEntries(content) {
    const entries = content.split('###').slice(1); // Remove first empty element
    
    const criticalKeywords = [
      'approved', 'rejected', 'completed', 'failed', 'critical', 'error', 
      'milestone', 'decision', 'architecture', 'breaking change', 'deployment'
    ];
    
    const criticalEntries = entries.filter(entry => {
      const lowerEntry = entry.toLowerCase();
      return criticalKeywords.some(keyword => lowerEntry.includes(keyword));
    });
    
    return criticalEntries.map(entry => `###${entry}`).join('\n');
  }

  /**
   * Add user directive or important note
   */
  async addUserDirective(text) {
    const directive = `[USER DIRECTIVE] ${text}`;
    await this.appendToLog(directive, 'critical');
  }

  /**
   * Add chat log entry (user prompt and response)
   */
  async addChatLog(userPrompt, orchResponse) {
    const config = await this.loadConfig();
    
    if (!config.enableChatLogs || config.logLevel === 0) return;
    
    const chatEntry = `**User:** ${userPrompt}\n\n**Orch:** ${orchResponse.substring(0, 500)}${orchResponse.length > 500 ? '...' : ''}`;
    await this.appendToLog(chatEntry, 'chat');
  }

  /**
   * Log phase events (spec, research, plan, prd, tasks)
   */
  async logPhaseEvent(phase, command, result) {
    const level = result.success ? 'success' : 'error';
    const status = result.success ? 'completed' : 'failed';
    
    let entry = `Phase "${phase}" ${command} ${status}`;
    
    if (result.success && result.data) {
      if (command === 'prd' && result.data.estimatedTimeline) {
        entry += `. MVP timeline: ${result.data.estimatedTimeline}`;
      }
      if (result.document) {
        entry += `. Document: ${result.document}`;
      }
    } else if (!result.success) {
      entry += `. Error: ${result.error}`;
    }
    
    await this.appendToLog(entry, 'phase');
  }

  /**
   * Log approval events
   */
  async logApproval(phase, type, approved, comments) {
    const status = approved ? 'approved' : 'rejected';
    const entry = `Phase "${phase}" ${type} ${status}${comments ? `. Comments: ${comments}` : ''}`;
    await this.appendToLog(entry, 'approval');
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get log content for AI context
   */
  async getLogForContext() {
    try {
      const logContent = await fs.readFile(this.logPath, 'utf8');
      const config = await this.loadConfig();
      
      // Truncate if needed to respect token limits
      const maxTokens = this.tokenLimits[config.logLevel] || 12000;
      const estimatedTokens = this.estimateTokens(logContent);
      
      if (estimatedTokens > maxTokens) {
        // Return truncated version focusing on recent sessions
        const recentStart = logContent.indexOf('## Recent Sessions (Full Detail)');
        const recentEnd = logContent.indexOf('## Historical Context (Critical Scope Only)');
        
        if (recentStart !== -1 && recentEnd !== -1) {
          const recentSections = logContent.slice(0, recentEnd);
          return this.truncateToTokenLimit(recentSections, maxTokens);
        }
      }
      
      return logContent;
    } catch (error) {
      return '# No project log available\n\nThis is a new project session.';
    }
  }

  /**
   * Truncate content to token limit
   */
  truncateToTokenLimit(content, maxTokens) {
    const estimatedTokens = this.estimateTokens(content);
    if (estimatedTokens <= maxTokens) return content;
    
    const ratio = maxTokens / estimatedTokens * 0.9; // 90% to be safe
    const targetLength = Math.floor(content.length * ratio);
    
    return content.substring(0, targetLength) + '\n\n*[Log truncated to respect token limits]*';
  }
}

module.exports = { LogManager };