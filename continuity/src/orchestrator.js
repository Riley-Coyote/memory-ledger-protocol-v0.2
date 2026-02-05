/**
 * Orchestrator - Coordinates sub-agents for reflection workflow
 * @module continuity/orchestrator
 */

import { generateId, getConfidenceLevel, MEMORY_TYPES } from './types.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Default orchestrator configuration
 */
const DEFAULT_CONFIG = {
  classifierAgent: 'continuity-classifier',
  scorerAgent: 'continuity-scorer',
  generatorAgent: 'continuity-generator',
  timeout: 30000,
  maxRetries: 2,
  model: 'anthropic/claude-sonnet-4'
};

/**
 * Orchestrator - Coordinates the reflection workflow across sub-agents
 */
export class Orchestrator {
  /**
   * @param {Object} config - Orchestrator configuration
   * @param {Function} sendMessage - Function to send messages to agents
   */
  constructor(config = {}, sendMessage = null) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sendMessage = sendMessage;
    this.agentPrompts = {};
  }

  /**
   * Initialize orchestrator (load agent prompts)
   */
  async init() {
    const agentsDir = join(__dirname, '..', 'agents');

    // Load classifier prompt
    this.agentPrompts.classifier = {
      soul: await this._loadPrompt(join(agentsDir, 'classifier', 'SOUL.md')),
      prompt: await this._loadPrompt(join(agentsDir, 'classifier', 'prompts', 'classify.md'))
    };

    // Load scorer prompt
    this.agentPrompts.scorer = {
      soul: await this._loadPrompt(join(agentsDir, 'scorer', 'SOUL.md')),
      prompt: await this._loadPrompt(join(agentsDir, 'scorer', 'prompts', 'score.md'))
    };

    // Load generator prompt
    this.agentPrompts.generator = {
      soul: await this._loadPrompt(join(agentsDir, 'generator', 'SOUL.md')),
      prompt: await this._loadPrompt(join(agentsDir, 'generator', 'prompts', 'generate.md'))
    };
  }

  /**
   * Load a prompt file
   * @private
   */
  async _loadPrompt(path) {
    try {
      return await readFile(path, 'utf-8');
    } catch (e) {
      console.warn(`Failed to load prompt: ${path}`);
      return '';
    }
  }

  /**
   * Run the full reflection workflow
   * @param {string} conversation - Conversation transcript
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Reflection result
   */
  async runReflection(conversation, context = {}) {
    const jobId = generateId('job');
    const startTime = Date.now();

    const job = {
      job_id: jobId,
      status: 'queued',
      session_id: context.session_id || generateId('session'),
      created_at: new Date().toISOString(),
      phases: {},
      output: {}
    };

    try {
      // Phase 1: Classification
      job.status = 'classifying';
      job.phases.classification = { started_at: new Date().toISOString() };

      const classified = await this._runClassifier(conversation, context);

      job.phases.classification.completed_at = new Date().toISOString();
      job.phases.classification.items_processed = classified.memories.length;

      // Phase 2: Scoring
      job.status = 'scoring';
      job.phases.scoring = { started_at: new Date().toISOString() };

      const scored = await this._runScorer(classified.memories, conversation);

      job.phases.scoring.completed_at = new Date().toISOString();
      job.phases.scoring.items_processed = scored.scored_memories.length;

      // Phase 3: Question Generation
      job.status = 'generating';
      job.phases.generation = { started_at: new Date().toISOString() };

      const questions = await this._runGenerator(scored.scored_memories, context);

      job.phases.generation.completed_at = new Date().toISOString();
      job.phases.generation.items_processed = questions.questions.length;

      // Complete
      job.status = 'complete';
      job.completed_at = new Date().toISOString();
      job.output = {
        memories_extracted: classified.extraction_metadata.memories_extracted,
        memories_integrated: scored.scored_memories.length,
        questions_generated: questions.questions.length,
        average_confidence: scored.scoring_metadata.average_confidence
      };

      return {
        job,
        memories: scored.scored_memories,
        questions: questions.questions,
        metadata: {
          extraction: classified.extraction_metadata,
          scoring: scored.scoring_metadata,
          generation: questions.generation_metadata,
          total_time_ms: Date.now() - startTime
        }
      };

    } catch (error) {
      job.status = 'failed';
      job.error = {
        phase: job.status,
        message: error.message,
        stack: error.stack
      };
      job.completed_at = new Date().toISOString();

      throw error;
    }
  }

  /**
   * Run the classifier agent
   * @private
   */
  async _runClassifier(conversation, context) {
    // Build the prompt
    const prompt = this._buildClassifierPrompt(conversation, context);

    // If we have a sendMessage function, use it
    if (this.sendMessage) {
      const response = await this.sendMessage({
        agent: this.config.classifierAgent,
        message: prompt,
        systemPrompt: this.agentPrompts.classifier.soul
      });
      return this._parseJSON(response);
    }

    // Otherwise, run locally (for testing or non-agent mode)
    return this._localClassify(conversation, context);
  }

  /**
   * Run the scorer agent
   * @private
   */
  async _runScorer(memories, conversation) {
    const prompt = this._buildScorerPrompt(memories, conversation);

    if (this.sendMessage) {
      const response = await this.sendMessage({
        agent: this.config.scorerAgent,
        message: prompt,
        systemPrompt: this.agentPrompts.scorer.soul
      });
      return this._parseJSON(response);
    }

    return this._localScore(memories);
  }

  /**
   * Run the generator agent
   * @private
   */
  async _runGenerator(scoredMemories, context) {
    const prompt = this._buildGeneratorPrompt(scoredMemories, context);

    if (this.sendMessage) {
      const response = await this.sendMessage({
        agent: this.config.generatorAgent,
        message: prompt,
        systemPrompt: this.agentPrompts.generator.soul
      });
      return this._parseJSON(response);
    }

    return this._localGenerate(scoredMemories, context);
  }

  /**
   * Build classifier prompt with conversation data
   * @private
   */
  _buildClassifierPrompt(conversation, context) {
    let prompt = this.agentPrompts.classifier.prompt || '';

    prompt = prompt.replace('{{conversation}}', conversation);
    prompt = prompt.replace('{{#if existing_memories}}', context.existing_memories ? '' : '<!--');
    prompt = prompt.replace('{{/if}}', context.existing_memories ? '' : '-->');
    prompt = prompt.replace('{{existing_memories}}', JSON.stringify(context.existing_memories || [], null, 2));

    return prompt;
  }

  /**
   * Build scorer prompt with memories
   * @private
   */
  _buildScorerPrompt(memories, conversation) {
    let prompt = this.agentPrompts.scorer.prompt || '';

    prompt = prompt.replace('{{memories}}', JSON.stringify(memories, null, 2));
    prompt = prompt.replace('{{#if conversation_context}}', conversation ? '' : '<!--');
    prompt = prompt.replace('{{/if}}', conversation ? '' : '-->');
    prompt = prompt.replace('{{conversation_context}}', conversation || '');

    return prompt;
  }

  /**
   * Build generator prompt with scored memories
   * @private
   */
  _buildGeneratorPrompt(scoredMemories, context) {
    let prompt = this.agentPrompts.generator.prompt || '';

    prompt = prompt.replace('{{memories}}', JSON.stringify(scoredMemories, null, 2));
    prompt = prompt.replace('{{#if existing_context}}', context.existing_memories ? '' : '<!--');
    prompt = prompt.replace('{{/if}}', context.existing_memories ? '' : '-->');
    prompt = prompt.replace('{{existing_context}}', JSON.stringify(context.existing_memories || [], null, 2));

    return prompt;
  }

  /**
   * Parse JSON response from agent
   * @private
   */
  _parseJSON(response) {
    // Try to extract JSON from response
    let json = response;

    // If it's a string, try to find JSON in it
    if (typeof response === 'string') {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        json = jsonMatch[1];
      }

      try {
        return JSON.parse(json);
      } catch (e) {
        throw new Error(`Failed to parse agent response as JSON: ${e.message}`);
      }
    }

    return response;
  }

  // ============================================
  // Local Implementations (fallback/testing)
  // ============================================

  /**
   * Local classification (basic implementation)
   * @private
   */
  _localClassify(conversation, context) {
    const memories = [];
    const lines = conversation.split('\n');

    // Simple heuristic extraction
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and AI responses
      if (!trimmed || trimmed.startsWith('Assistant:') || trimmed.startsWith('Claude:')) {
        continue;
      }

      // Look for user statements
      if (trimmed.startsWith('User:') || trimmed.startsWith('Human:')) {
        const content = trimmed.replace(/^(User|Human):/, '').trim();

        // Skip short responses
        if (content.length < 10) continue;

        // Basic type detection
        let type = 'fact';
        if (/\b(like|love|prefer|hate|enjoy)\b/i.test(content)) {
          type = 'preference';
        } else if (/\b(will|promise|commit|agree)\b/i.test(content)) {
          type = 'commitment';
        } else if (/\b(always|never|must|should)\b/i.test(content)) {
          type = 'principle';
        }

        memories.push({
          id: generateId('mem'),
          type,
          content: content.slice(0, 200),
          tags: [],
          source_quote: content.slice(0, 100)
        });
      }
    }

    return {
      memories,
      extraction_metadata: {
        messages_analyzed: lines.length,
        memories_extracted: memories.length,
        skipped_reasons: []
      }
    };
  }

  /**
   * Local scoring (basic implementation)
   * @private
   */
  _localScore(memories) {
    const scoredMemories = memories.map(m => ({
      ...m,
      confidence: {
        score: 0.7,
        level: 'implied',
        source: 'context_implied',
        evidence: ['Local classification'],
        decay_rate: 0.0
      }
    }));

    const total = scoredMemories.reduce((sum, m) => sum + m.confidence.score, 0);

    return {
      scored_memories: scoredMemories,
      scoring_metadata: {
        memories_scored: scoredMemories.length,
        average_confidence: scoredMemories.length > 0 ? total / scoredMemories.length : 0,
        confidence_distribution: {
          explicit: 0,
          implied: scoredMemories.length,
          inferred: 0,
          speculative: 0
        }
      }
    };
  }

  /**
   * Local question generation (basic implementation)
   * @private
   */
  _localGenerate(scoredMemories, context) {
    const questions = [];

    // Generate one question per memory type found
    const types = new Set(scoredMemories.map(m => m.type));

    if (types.has('commitment')) {
      questions.push({
        id: generateId('q'),
        question: 'How is that project you mentioned progressing?',
        context: 'Following up on commitments',
        source_memory_ids: scoredMemories.filter(m => m.type === 'commitment').map(m => m.id),
        curiosity_type: 'implication',
        curiosity_score: 0.8,
        timing: 'next_session',
        sensitivity: 'low'
      });
    }

    if (types.has('preference')) {
      questions.push({
        id: generateId('q'),
        question: 'Tell me more about what draws you to that?',
        context: 'Exploring preferences',
        source_memory_ids: scoredMemories.filter(m => m.type === 'preference').map(m => m.id),
        curiosity_type: 'exploration',
        curiosity_score: 0.6,
        timing: 'when_relevant',
        sensitivity: 'low'
      });
    }

    return {
      questions,
      generation_metadata: {
        memories_analyzed: scoredMemories.length,
        questions_generated: questions.length,
        curiosity_types_distribution: {
          gap: 0,
          implication: questions.filter(q => q.curiosity_type === 'implication').length,
          clarification: 0,
          exploration: questions.filter(q => q.curiosity_type === 'exploration').length,
          connection: 0
        }
      }
    };
  }

  /**
   * Run a single phase manually (for testing)
   * @param {string} phase - Phase name (classify, score, generate)
   * @param {*} input - Phase input
   * @param {Object} context - Additional context
   */
  async runPhase(phase, input, context = {}) {
    switch (phase) {
      case 'classify':
        return this._runClassifier(input, context);
      case 'score':
        return this._runScorer(input, context);
      case 'generate':
        return this._runGenerator(input, context);
      default:
        throw new Error(`Unknown phase: ${phase}`);
    }
  }
}

export default Orchestrator;
