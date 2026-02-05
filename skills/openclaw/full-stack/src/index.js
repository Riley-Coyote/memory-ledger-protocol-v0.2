/**
 * MLP Continuity - Full-stack memory continuity
 *
 * Combines the Continuity Framework with MLP storage.
 *
 * @module mlp-continuity
 */

import { ContinuityFramework } from 'continuity-framework';
import { MLP } from 'mlp-storage';
import { loadConfig, validateConfig } from './config.js';
import { SessionInit, SessionEnd } from './session.js';
import { generateId } from 'continuity-framework/types';

/**
 * MLPContinuity - Full-stack memory continuity skill
 */
export class MLPContinuity {
  /**
   * @param {Object} config - Configuration override
   */
  constructor(config = {}) {
    this.configOverride = config;
    this.config = null;
    this.framework = null;
    this.mlp = null;
    this.initialized = false;
  }

  /**
   * Initialize the skill
   */
  async init() {
    // Load configuration
    this.config = await loadConfig();
    Object.assign(this.config, this.configOverride);

    // Validate configuration
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Initialize Continuity Framework
    this.framework = new ContinuityFramework({
      basePath: this.config.continuity.memoryDir.replace('~', process.env.HOME)
    });
    await this.framework.init();

    // Initialize MLP
    this.mlp = new MLP(this.config.mlp.configPath.replace('~', process.env.HOME));
    await this.mlp.init();

    // Initialize session handlers
    this.sessionInit = new SessionInit(this);
    this.sessionEnd = new SessionEnd(this);

    this.initialized = true;
  }

  /**
   * Ensure skill is initialized
   * @private
   */
  _ensureInit() {
    if (!this.initialized) {
      throw new Error('MLPContinuity not initialized. Call init() first.');
    }
  }

  // ============================================
  // Core API
  // ============================================

  /**
   * Run reflection on a conversation and store to MLP
   * @param {string} conversation - Conversation transcript
   * @param {Object} options - Reflection options
   * @returns {Promise<Object>} Reflection result with MLP storage
   */
  async reflect(conversation, options = {}) {
    this._ensureInit();

    // Run Continuity reflection
    const result = await this.framework.reflect(conversation, options);

    // Store scored memories to MLP
    const envelopeCids = [];

    for (const memory of result.memories) {
      try {
        const stored = await this.mlp.store(
          {
            type: memory.type,
            content: memory.content,
            confidence: memory.confidence,
            tags: memory.tags,
            source_quote: memory.source_quote
          },
          {
            kind: 'reflection',
            scope: 'agent',
            tags: memory.tags || [],
            riskClass: 'low'
          }
        );

        envelopeCids.push(stored.envelope_cid);
      } catch (e) {
        console.warn(`Failed to store memory to MLP: ${e.message}`);
      }
    }

    return {
      ...result,
      envelope_cids: envelopeCids,
      mlp_stored: envelopeCids.length
    };
  }

  /**
   * Generate MLP Context Pack
   * @param {Object} options - Context pack options
   * @returns {Promise<Object>} Context pack
   */
  async generateContextPack(options = {}) {
    this._ensureInit();

    return this.mlp.generateContextPack(options);
  }

  /**
   * Store a memory directly to MLP
   * @param {Object} memory - Memory to store
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} Storage result
   */
  async store(memory, options = {}) {
    this._ensureInit();

    return this.mlp.store(memory, {
      kind: options.kind || 'semantic',
      scope: options.scope || 'agent',
      tags: options.tags || [],
      riskClass: options.riskClass || 'low'
    });
  }

  /**
   * Load a memory from MLP
   * @param {string} envelopeCid - Envelope CID
   * @returns {Promise<Object>} Memory with verification
   */
  async load(envelopeCid) {
    this._ensureInit();

    return this.mlp.load(envelopeCid);
  }

  // ============================================
  // Continuity Passthrough
  // ============================================

  /**
   * Get pending questions
   */
  async getQuestions() {
    this._ensureInit();
    return this.framework.getQuestions();
  }

  /**
   * Get questions to surface
   */
  async getQuestionsToSurface(limit = 3) {
    this._ensureInit();
    return this.framework.getQuestionsToSurface(limit);
  }

  /**
   * Answer a question
   */
  async answerQuestion(questionId, summary) {
    this._ensureInit();
    return this.framework.answerQuestion(questionId, summary);
  }

  /**
   * Skip a question
   */
  async skipQuestion(questionId, reason) {
    this._ensureInit();
    return this.framework.skipQuestion(questionId, reason);
  }

  /**
   * Get identity
   */
  async getIdentity() {
    this._ensureInit();
    return this.framework.getIdentity();
  }

  /**
   * Update identity
   */
  async updateIdentity(updates) {
    this._ensureInit();
    return this.framework.updateIdentity(updates);
  }

  /**
   * Generate greeting
   */
  async generateGreeting(options = {}) {
    this._ensureInit();
    return this.framework.generateGreeting(options);
  }

  // ============================================
  // Session Hooks
  // ============================================

  /**
   * Handle session start
   * @param {Object} options - Session options
   */
  async onSessionStart(options = {}) {
    this._ensureInit();
    return this.sessionInit.init(options);
  }

  /**
   * Handle session end
   * @param {Object} session - Session data
   */
  async onSessionEnd(session) {
    this._ensureInit();
    return this.sessionEnd.end(session);
  }

  // ============================================
  // MLP Operations
  // ============================================

  /**
   * Export identity kernel
   * @param {string} outputPath - Export path
   */
  async exportIdentity(outputPath) {
    this._ensureInit();
    return this.mlp.exportIdentity(outputPath);
  }

  /**
   * Import identity kernel
   * @param {string} inputPath - Import path
   */
  async importIdentity(inputPath) {
    this._ensureInit();
    return this.mlp.importIdentity(inputPath);
  }

  /**
   * Revoke a memory
   * @param {string} envelopeCid - Envelope CID
   * @param {string} reason - Revocation reason
   */
  async revoke(envelopeCid, reason) {
    this._ensureInit();
    return this.mlp.revoke(envelopeCid, reason);
  }

  /**
   * Sync local memories to MLP
   * @param {Object} options - Sync options
   */
  async syncToMLP(options = {}) {
    this._ensureInit();

    const memories = await this.framework.getMemories();
    const results = [];

    for (const memory of memories) {
      // Skip if already has envelope CID
      if (memory.envelope_cid) {
        continue;
      }

      try {
        const stored = await this.store(
          {
            type: memory.type,
            content: memory.content,
            confidence: memory.confidence,
            tags: memory.tags
          },
          {
            kind: 'semantic',
            tags: memory.tags || []
          }
        );

        results.push({
          memory_id: memory.id,
          envelope_cid: stored.envelope_cid,
          success: true
        });
      } catch (e) {
        results.push({
          memory_id: memory.id,
          error: e.message,
          success: false
        });
      }
    }

    return {
      total: memories.length,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // ============================================
  // Status
  // ============================================

  /**
   * Get combined status
   */
  async status() {
    this._ensureInit();

    const continuityStats = await this.framework.status();
    const mlpStatus = await this.mlp.status();

    return {
      continuity: continuityStats,
      mlp: mlpStatus
    };
  }
}

// Export everything
export { SessionInit, SessionEnd };
export { loadConfig, validateConfig } from './config.js';
export default MLPContinuity;
