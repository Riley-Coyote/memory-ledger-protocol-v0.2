/**
 * Type definitions for the Continuity Framework
 * @module continuity/types
 */

/**
 * Memory type classifications
 * @typedef {'fact' | 'preference' | 'relationship' | 'principle' | 'commitment' | 'moment' | 'skill'} MemoryType
 */

/**
 * Confidence levels
 * @typedef {'explicit' | 'implied' | 'inferred' | 'speculative'} ConfidenceLevel
 */

/**
 * Confidence source types
 * @typedef {'user_stated' | 'user_confirmed' | 'context_implied' | 'pattern_inferred' | 'behavioral_signal' | 'hypothesis'} SourceType
 */

/**
 * Curiosity types for questions
 * @typedef {'gap' | 'implication' | 'clarification' | 'exploration' | 'connection'} CuriosityType
 */

/**
 * Question timing
 * @typedef {'next_session' | 'when_relevant' | 'low_priority'} QuestionTiming
 */

/**
 * Question sensitivity levels
 * @typedef {'low' | 'medium' | 'high'} Sensitivity
 */

/**
 * Question status
 * @typedef {'pending' | 'asked' | 'answered' | 'skipped' | 'expired'} QuestionStatus
 */

/**
 * Reflection job status
 * @typedef {'queued' | 'classifying' | 'scoring' | 'generating' | 'integrating' | 'complete' | 'failed'} JobStatus
 */

/**
 * @typedef {Object} Memory
 * @property {string} id - Unique memory identifier (mem_uuid format)
 * @property {MemoryType} type - Memory classification
 * @property {string} content - The extracted memory content
 * @property {string} [source_quote] - Direct quote from conversation
 * @property {string[]} tags - Tags for categorization
 * @property {string} [context] - Context about when/why this was stated
 * @property {boolean} [uncertain] - Flag for classification uncertainty
 * @property {string} [uncertainty_reason] - Reason for uncertainty
 * @property {string} [created_at] - ISO 8601 timestamp
 * @property {string} [session_id] - Session this memory came from
 */

/**
 * @typedef {Object} Confidence
 * @property {number} score - Confidence score 0.0-1.0
 * @property {ConfidenceLevel} level - Confidence tier
 * @property {SourceType} source - How information was obtained
 * @property {string[]} evidence - Evidence supporting the score
 * @property {number} [decay_rate] - Rate of confidence decay over time
 */

/**
 * @typedef {Object} ScoredMemory
 * @property {string} id - Memory identifier
 * @property {MemoryType} type - Memory type
 * @property {string} content - Memory content
 * @property {Confidence} confidence - Confidence scoring
 * @property {string[]} [tags] - Memory tags
 * @property {string} [source_quote] - Source quote
 */

/**
 * @typedef {Object} CuriosityQuestion
 * @property {string} id - Question identifier (q_uuid format)
 * @property {string} question - The actual question
 * @property {string} context - Why this question emerged
 * @property {string[]} [source_memory_ids] - Source memory IDs
 * @property {CuriosityType} curiosity_type - Category of curiosity
 * @property {number} curiosity_score - Priority score 0.0-1.0
 * @property {QuestionTiming} timing - When to surface
 * @property {Sensitivity} sensitivity - Sensitivity level
 * @property {QuestionStatus} [status] - Current status
 * @property {string} [created_at] - Creation timestamp
 * @property {string} [asked_at] - When surfaced
 * @property {string} [answered_at] - When answered
 * @property {string} [answer_summary] - Summary of answer
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {Memory[]} memories - Extracted memories
 * @property {Object} extraction_metadata - Extraction statistics
 * @property {number} extraction_metadata.messages_analyzed
 * @property {number} extraction_metadata.memories_extracted
 * @property {string[]} [extraction_metadata.skipped_reasons]
 */

/**
 * @typedef {Object} ScoringResult
 * @property {ScoredMemory[]} scored_memories - Scored memories
 * @property {Object} scoring_metadata - Scoring statistics
 * @property {number} scoring_metadata.memories_scored
 * @property {number} scoring_metadata.average_confidence
 * @property {Object} scoring_metadata.confidence_distribution
 */

/**
 * @typedef {Object} GenerationResult
 * @property {CuriosityQuestion[]} questions - Generated questions
 * @property {Object} generation_metadata - Generation statistics
 * @property {number} generation_metadata.memories_analyzed
 * @property {number} generation_metadata.questions_generated
 * @property {Object} [generation_metadata.curiosity_types_distribution]
 */

/**
 * @typedef {Object} ReflectionResult
 * @property {ScoredMemory[]} memories - All scored memories
 * @property {CuriosityQuestion[]} questions - Generated questions
 * @property {Object} metadata - Combined metadata
 * @property {string} job_id - Reflection job ID
 */

/**
 * @typedef {Object} ReflectionJob
 * @property {string} job_id - Unique job identifier
 * @property {JobStatus} status - Current status
 * @property {string} session_id - Session being reflected on
 * @property {string} created_at - Creation timestamp
 * @property {string} [updated_at] - Last update timestamp
 * @property {string} [completed_at] - Completion timestamp
 * @property {Object} [input] - Input statistics
 * @property {Object} [phases] - Phase metrics
 * @property {Object} [output] - Output statistics
 * @property {Object} [error] - Error information if failed
 */

/**
 * @typedef {Object} MemoryStoreConfig
 * @property {string} basePath - Base path for memory storage
 * @property {string} [memoryFile] - Name of main memory file
 * @property {string} [questionsFile] - Name of questions file
 * @property {string} [identityFile] - Name of identity file
 * @property {string} [reflectionsDir] - Name of reflections directory
 */

/**
 * @typedef {Object} OrchestratorConfig
 * @property {string} [classifierAgent] - Classifier agent ID
 * @property {string} [scorerAgent] - Scorer agent ID
 * @property {string} [generatorAgent] - Generator agent ID
 * @property {number} [timeout] - Timeout per agent in ms
 * @property {number} [maxRetries] - Max retries per agent
 */

/**
 * Confidence level ranges
 * @readonly
 * @enum {[number, number]}
 */
export const CONFIDENCE_RANGES = {
  explicit: [0.95, 1.0],
  implied: [0.70, 0.94],
  inferred: [0.40, 0.69],
  speculative: [0.0, 0.39]
};

/**
 * Memory type decay rates
 * @readonly
 * @enum {number}
 */
export const DEFAULT_DECAY_RATES = {
  fact: 0.0,
  preference: 0.1,
  relationship: 0.05,
  principle: 0.0,
  commitment: 0.2,
  moment: 0.0,
  skill: 0.0
};

/**
 * Memory types array
 * @readonly
 */
export const MEMORY_TYPES = [
  'fact',
  'preference',
  'relationship',
  'principle',
  'commitment',
  'moment',
  'skill'
];

/**
 * Curiosity types array
 * @readonly
 */
export const CURIOSITY_TYPES = [
  'gap',
  'implication',
  'clarification',
  'exploration',
  'connection'
];

/**
 * Get confidence level from score
 * @param {number} score - Confidence score 0.0-1.0
 * @returns {ConfidenceLevel} The confidence level
 */
export function getConfidenceLevel(score) {
  if (score >= 0.95) return 'explicit';
  if (score >= 0.70) return 'implied';
  if (score >= 0.40) return 'inferred';
  return 'speculative';
}

/**
 * Validate a memory object
 * @param {Memory} memory - Memory to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateMemory(memory) {
  const errors = [];

  if (!memory.id || !memory.id.startsWith('mem_')) {
    errors.push('Invalid memory ID format');
  }

  if (!MEMORY_TYPES.includes(memory.type)) {
    errors.push(`Invalid memory type: ${memory.type}`);
  }

  if (!memory.content || memory.content.length === 0) {
    errors.push('Memory content is required');
  }

  if (!Array.isArray(memory.tags)) {
    errors.push('Tags must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate a unique ID with prefix
 * @param {string} prefix - ID prefix (mem, q, job)
 * @returns {string} Generated ID
 */
export function generateId(prefix) {
  const uuid = crypto.randomUUID ?
    crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  return `${prefix}_${uuid}`;
}
