/**
 * /orch remember Command Implementation
 * Manual log entries for important user directives and notes
 */

const { LogManager } = require('../core/log-manager');

/**
 * Main remember command function
 */
async function rememberCommand(phase, stateManager, options = {}) {
  try {
    const logManager = new LogManager();
    
    // Extract the text to remember
    const textToRemember = options.text || options.note || options.directive;
    
    if (!textToRemember) {
      return {
        success: false,
        error: 'No text provided to remember. Use: /orch remember "Your important note here"',
        validationErrors: ['Missing text parameter']
      };
    }

    // Add user directive to log
    await logManager.addUserDirective(textToRemember);
    
    // Also log the remember action itself
    await logManager.appendToLog(
      `User added manual directive: "${textToRemember}"`, 
      'info'
    );

    return {
      success: true,
      message: 'User directive added to project log',
      text: textToRemember,
      timestamp: new Date().toISOString(),
      location: 'orch-log.md'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      validationErrors: [error.message]
    };
  }
}

module.exports = {
  rememberCommand
};