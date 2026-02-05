/**
 * Continuity Skill - Standalone reflection for OpenClaw bots
 *
 * Uses the Continuity Framework with local markdown storage.
 * No MLP/IPFS dependency required.
 *
 * @module continuity-skill
 */

import { ContinuityFramework } from 'continuity-framework';
import { LocalStorage } from './local-storage.js';
import { join } from 'path';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  memoryDir: process.env.CONTINUITY_MEMORY_DIR ||
    join(process.env.HOME || '~', 'clawd', 'memory'),
  idleThreshold: parseInt(process.env.CONTINUITY_IDLE_THRESHOLD || '1800'),
  minMessages: parseInt(process.env.CONTINUITY_MIN_MESSAGES || '5'),
  questionLimit: parseInt(process.env.CONTINUITY_QUESTION_LIMIT || '3')
};

/**
 * ContinuitySkill - Main entry point for the standalone skill
 */
export class ContinuitySkill {
  /**
   * @param {Object} config - Skill configuration
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.framework = new ContinuityFramework({
      basePath: this.config.memoryDir
    });
    this.storage = new LocalStorage(this.config.memoryDir);
    this.initialized = false;
  }

  /**
   * Initialize the skill
   */
  async init() {
    await this.framework.init();
    await this.storage.init();
    this.initialized = true;
  }

  /**
   * Ensure skill is initialized
   * @private
   */
  _ensureInit() {
    if (!this.initialized) {
      throw new Error('ContinuitySkill not initialized. Call init() first.');
    }
  }

  // ============================================
  // Command Handlers
  // ============================================

  /**
   * Reflect on a session
   * @param {Object} options - Reflection options
   * @returns {Promise<Object>} Reflection result
   */
  async reflect(options = {}) {
    this._ensureInit();

    let conversation;

    // Load conversation from file if provided
    if (options.session) {
      conversation = await this.storage.readFile(options.session);
    }
    // Otherwise try to load from session logs
    else if (options.sessionId) {
      conversation = await this.storage.loadSessionLog(options.sessionId);
    }
    // Manual mode - require conversation content
    else if (options.content) {
      conversation = options.content;
    }
    else {
      return {
        success: false,
        message: 'No session content provided. Use --session <file> or provide content.'
      };
    }

    // Check minimum message threshold
    const messageCount = (conversation.match(/^(User|Human):/gm) || []).length;
    if (messageCount < this.config.minMessages) {
      return {
        success: false,
        message: `Session has ${messageCount} messages, minimum is ${this.config.minMessages}.`
      };
    }

    // Run reflection
    const result = await this.framework.reflect(conversation, {
      session_id: options.sessionId
    });

    return {
      success: true,
      memories_extracted: result.memories.length,
      memories_added: result.memories_added,
      questions_generated: result.questions.length,
      job_id: result.job.job_id,
      reflection_log: result.reflection_log
    };
  }

  /**
   * Get pending questions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Questions result
   */
  async questions(options = {}) {
    this._ensureInit();

    const questions = await this.framework.getQuestions();
    const pending = questions.filter(q => q.status === 'pending');

    const limit = options.limit || 10;

    return {
      total: pending.length,
      questions: pending.slice(0, limit).map(q => ({
        id: q.id,
        question: q.question,
        context: q.context,
        curiosity_type: q.curiosity_type,
        curiosity_score: q.curiosity_score,
        timing: q.timing
      }))
    };
  }

  /**
   * Get memory status
   * @returns {Promise<Object>} Status result
   */
  async status() {
    this._ensureInit();

    const stats = await this.framework.status();
    const identity = await this.framework.getIdentity();

    return {
      memories: stats.memories,
      questions: stats.questions,
      identity: {
        core_values: identity.core_values?.length || 0,
        capabilities: identity.capabilities?.length || 0,
        growth_narrative: identity.growth_narrative ? 'Set' : 'Not set'
      },
      reflections: stats.reflections
    };
  }

  /**
   * Generate greeting with questions
   * @param {Object} options - Greeting options
   * @returns {Promise<Object>} Greeting result
   */
  async greet(options = {}) {
    this._ensureInit();

    const greeting = await this.framework.generateGreeting({
      questionLimit: options.limit || this.config.questionLimit
    });

    return {
      has_questions: greeting.has_pending_questions,
      questions: greeting.questions.map(q => ({
        question: q.question,
        context: q.context
      })),
      identity: greeting.identity_summary
    };
  }

  /**
   * Mark a question as resolved
   * @param {string} questionId - Question ID
   * @param {Object} options - Resolution options
   * @returns {Promise<Object>} Resolution result
   */
  async resolve(questionId, options = {}) {
    this._ensureInit();

    if (options.skip) {
      await this.framework.skipQuestion(questionId, options.reason || 'User skipped');
      return { success: true, action: 'skipped', questionId };
    }

    await this.framework.answerQuestion(questionId, options.summary || '');
    return { success: true, action: 'answered', questionId };
  }

  // ============================================
  // Session Hooks
  // ============================================

  /**
   * Handle session start
   * Called when a new session begins
   * @returns {Promise<Object>} Session start context
   */
  async onSessionStart() {
    this._ensureInit();

    const greeting = await this.greet();

    return {
      questions_to_surface: greeting.questions,
      identity_context: greeting.identity,
      should_greet: greeting.has_questions
    };
  }

  /**
   * Handle session end
   * Called when a session ends (triggered by idle timeout or explicit end)
   * @param {Object} session - Session data
   * @returns {Promise<Object>} Session end result
   */
  async onSessionEnd(session) {
    this._ensureInit();

    // Check if session is worth reflecting on
    if (session.messageCount < this.config.minMessages) {
      return { reflected: false, reason: 'Too few messages' };
    }

    // Queue reflection (or run immediately)
    const result = await this.reflect({
      content: session.transcript,
      sessionId: session.id
    });

    return {
      reflected: true,
      result
    };
  }
}

export default ContinuitySkill;
