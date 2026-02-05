/**
 * Continuity Framework
 *
 * Asynchronous reflection and memory integration for genuine AI development.
 *
 * @module continuity
 */

import { MemoryStore } from './memory-store.js';
import { Orchestrator } from './orchestrator.js';
import {
  generateId,
  getConfidenceLevel,
  validateMemory,
  MEMORY_TYPES,
  CURIOSITY_TYPES,
  CONFIDENCE_RANGES,
  DEFAULT_DECAY_RATES
} from './types.js';

/**
 * ContinuityFramework - Main entry point for the Continuity Framework
 */
export class ContinuityFramework {
  /**
   * @param {Object} config - Framework configuration
   * @param {string} config.basePath - Base path for memory storage
   * @param {Function} [config.sendMessage] - Function to send messages to agents
   * @param {Object} [config.orchestrator] - Orchestrator configuration
   * @param {Object} [config.store] - Memory store configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.store = new MemoryStore(config.store || { basePath: config.basePath });
    this.orchestrator = new Orchestrator(config.orchestrator, config.sendMessage);
    this.initialized = false;
  }

  /**
   * Initialize the framework
   */
  async init() {
    await this.store.init();
    await this.orchestrator.init();
    this.initialized = true;
  }

  /**
   * Ensure framework is initialized
   * @private
   */
  _ensureInit() {
    if (!this.initialized) {
      throw new Error('ContinuityFramework not initialized. Call init() first.');
    }
  }

  // ============================================
  // Core Reflection API
  // ============================================

  /**
   * Run reflection on a conversation
   * @param {string} conversation - Conversation transcript
   * @param {Object} options - Reflection options
   * @returns {Promise<Object>} Reflection result
   */
  async reflect(conversation, options = {}) {
    this._ensureInit();

    // Load existing memories for context
    const existingMemories = await this.store.loadMemories();

    // Run the reflection workflow
    const result = await this.orchestrator.runReflection(conversation, {
      session_id: options.session_id,
      existing_memories: existingMemories
    });

    // Store new memories
    const added = await this.store.addMemories(result.memories);

    // Store new questions
    for (const question of result.questions) {
      await this.store.addQuestion(question);
    }

    // Save reflection log
    const logPath = await this.store.saveReflection({
      timestamp: new Date().toISOString(),
      job: result.job,
      memories_added: added.length,
      questions_added: result.questions.length,
      metadata: result.metadata
    });

    return {
      ...result,
      memories_added: added.length,
      reflection_log: logPath
    };
  }

  // ============================================
  // Memory Operations
  // ============================================

  /**
   * Get all memories
   * @returns {Promise<Object[]>} All memories
   */
  async getMemories() {
    this._ensureInit();
    return this.store.loadMemories();
  }

  /**
   * Search memories
   * @param {Object} query - Search query
   * @returns {Promise<Object[]>} Matching memories
   */
  async searchMemories(query) {
    this._ensureInit();
    return this.store.searchMemories(query);
  }

  /**
   * Add a memory manually
   * @param {Object} memory - Memory to add
   * @returns {Promise<Object>} Added memory
   */
  async addMemory(memory) {
    this._ensureInit();
    const validation = validateMemory(memory);
    if (!validation.valid) {
      throw new Error(`Invalid memory: ${validation.errors.join(', ')}`);
    }
    const added = await this.store.addMemories([memory]);
    return added[0];
  }

  // ============================================
  // Question Operations
  // ============================================

  /**
   * Get pending questions
   * @returns {Promise<Object[]>} Pending questions
   */
  async getQuestions() {
    this._ensureInit();
    return this.store.loadQuestions();
  }

  /**
   * Get questions to surface at session start
   * @param {number} limit - Maximum questions to return
   * @returns {Promise<Object[]>} Prioritized questions
   */
  async getQuestionsToSurface(limit = 3) {
    this._ensureInit();
    return this.store.getQuestionsToSurface(limit);
  }

  /**
   * Mark a question as answered
   * @param {string} questionId - Question ID
   * @param {string} summary - Answer summary
   */
  async answerQuestion(questionId, summary) {
    this._ensureInit();
    return this.store.resolveQuestion(questionId, { summary });
  }

  /**
   * Skip a question
   * @param {string} questionId - Question ID
   * @param {string} reason - Reason for skipping
   */
  async skipQuestion(questionId, reason) {
    this._ensureInit();
    return this.store.resolveQuestion(questionId, { skipped: true, skip_reason: reason });
  }

  // ============================================
  // Identity Operations
  // ============================================

  /**
   * Get identity/self-model
   * @returns {Promise<Object>} Identity object
   */
  async getIdentity() {
    this._ensureInit();
    return this.store.loadIdentity();
  }

  /**
   * Update identity
   * @param {Object} updates - Identity updates
   * @returns {Promise<Object>} Updated identity
   */
  async updateIdentity(updates) {
    this._ensureInit();
    return this.store.updateIdentity(updates);
  }

  // ============================================
  // Session Helpers
  // ============================================

  /**
   * Generate a greeting for session start
   * @param {Object} options - Greeting options
   * @returns {Promise<Object>} Greeting with questions
   */
  async generateGreeting(options = {}) {
    this._ensureInit();

    const questions = await this.getQuestionsToSurface(options.questionLimit || 3);
    const identity = await this.getIdentity();

    return {
      questions,
      identity_summary: {
        growth_narrative: identity.growth_narrative,
        recent_topics: identity.core_values?.slice(0, 3)
      },
      has_pending_questions: questions.length > 0
    };
  }

  /**
   * Get framework status
   * @returns {Promise<Object>} Status information
   */
  async status() {
    this._ensureInit();
    return this.store.getStats();
  }

  // ============================================
  // Reflection Logs
  // ============================================

  /**
   * Get recent reflection logs
   * @param {number} limit - Maximum logs to return
   * @returns {Promise<Object[]>} Reflection logs
   */
  async getReflectionLogs(limit = 10) {
    this._ensureInit();
    return this.store.loadReflections(limit);
  }
}

// Export everything
export { MemoryStore, Orchestrator };
export {
  generateId,
  getConfidenceLevel,
  validateMemory,
  MEMORY_TYPES,
  CURIOSITY_TYPES,
  CONFIDENCE_RANGES,
  DEFAULT_DECAY_RATES
};

export default ContinuityFramework;
