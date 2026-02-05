/**
 * Session management for MLP Continuity
 * @module mlp-continuity/session
 */

/**
 * Session initializer - called at session start
 */
export class SessionInit {
  /**
   * @param {Object} mlpContinuity - MLP Continuity instance
   */
  constructor(mlpContinuity) {
    this.mlp = mlpContinuity;
  }

  /**
   * Initialize session with context
   * @param {Object} options - Session options
   * @returns {Promise<Object>} Session context
   */
  async init(options = {}) {
    // 1. Generate MLP Context Pack
    const contextPack = await this.mlp.generateContextPack({
      intent: options.intent || 'general_session',
      memoryTypes: options.memoryTypes || ['semantic', 'reflection'],
      maxMemories: options.maxMemories || 10
    });

    // 2. Load pending questions
    const greeting = await this.mlp.framework.generateGreeting({
      questionLimit: options.questionLimit || 3
    });

    // 3. Compile session context
    return {
      context_pack: contextPack,
      questions: greeting.questions,
      identity: greeting.identity_summary,
      should_greet: greeting.has_pending_questions,
      session_id: contextPack.pack_id
    };
  }

  /**
   * Generate greeting message with questions
   * @returns {Promise<string>} Greeting message
   */
  async generateGreetingMessage() {
    const greeting = await this.mlp.framework.generateGreeting();

    if (!greeting.has_pending_questions) {
      return null;
    }

    const lines = [
      'From my reflection on our last conversation, I\'ve been thinking about:'
    ];

    for (const q of greeting.questions) {
      lines.push(`  • ${q.question}`);
    }

    return lines.join('\n');
  }
}

/**
 * Session end handler - called at session end
 */
export class SessionEnd {
  /**
   * @param {Object} mlpContinuity - MLP Continuity instance
   */
  constructor(mlpContinuity) {
    this.mlp = mlpContinuity;
  }

  /**
   * Handle session end
   * @param {Object} session - Session data
   * @returns {Promise<Object>} Session end result
   */
  async end(session) {
    // Check if session is worth reflecting on
    const messageCount = session.messageCount ||
      (session.transcript?.match(/^(User|Human):/gm) || []).length;

    if (messageCount < this.mlp.config.continuity.minMessages) {
      return {
        reflected: false,
        reason: `Too few messages (${messageCount})`
      };
    }

    // Run reflection and store to MLP
    const result = await this.mlp.reflect(session.transcript, {
      session_id: session.id
    });

    return {
      reflected: true,
      memories_extracted: result.memories.length,
      memories_stored: result.envelope_cids?.length || 0,
      questions_generated: result.questions.length,
      job_id: result.job.job_id
    };
  }

  /**
   * Save session transcript for future reference
   * @param {Object} session - Session data
   */
  async saveTranscript(session) {
    const storage = this.mlp.framework.store;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `session-${timestamp}.txt`;

    await storage.writeFile(
      `sessions/${filename}`,
      session.transcript
    );

    return filename;
  }
}

export default { SessionInit, SessionEnd };
