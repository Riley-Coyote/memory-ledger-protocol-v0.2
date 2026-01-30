/**
 * Relevance - Memory ranking for ContextPack compilation
 * 
 * Scores memories based on intent, kernel values, recency, and tags.
 */

/**
 * Compute relevance score for a memory envelope given intent and kernel
 * @param {Object} envelope - MemoryEnvelope
 * @param {string} intent - Session intent/purpose
 * @param {Object} kernel - IdentityKernel
 * @returns {number} Score between 0 and 1
 */
export function computeRelevance(envelope, intent, kernel) {
  let score = 0;
  const weights = {
    recency: 0.25,
    kindMatch: 0.20,
    tagMatch: 0.25,
    valueAlignment: 0.15,
    riskAppropriate: 0.15
  };
  
  // 1. Recency score (newer = higher)
  const ageMs = Date.now() - new Date(envelope.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - (ageDays / 365)); // Decay over a year
  score += weights.recency * recencyScore;
  
  // 2. Kind match (based on intent)
  const kindScores = getKindScoresForIntent(intent);
  const kindScore = kindScores[envelope.kind] || 0.5;
  score += weights.kindMatch * kindScore;
  
  // 3. Tag match (intent keywords vs envelope tags)
  const intentTokens = tokenizeIntent(intent);
  const tagOverlap = computeTagOverlap(intentTokens, envelope.topic_tags || []);
  score += weights.tagMatch * tagOverlap;
  
  // 4. Value alignment (if envelope relates to kernel values)
  const valueScore = computeValueAlignment(envelope, kernel);
  score += weights.valueAlignment * valueScore;
  
  // 5. Risk appropriateness (high-risk memories need explicit intent)
  const riskScore = computeRiskScore(envelope, intent);
  score += weights.riskAppropriate * riskScore;
  
  return Math.min(1, Math.max(0, score));
}

/**
 * Get kind preference scores based on intent
 */
function getKindScoresForIntent(intent) {
  const intentLower = intent.toLowerCase();
  
  // Default scores
  const scores = {
    semantic: 0.7,
    episodic: 0.5,
    reflection: 0.6,
    kernel_ref: 0.8,
    policy: 0.4,
    tombstone: 0  // Never include tombstones
  };
  
  // Adjust based on intent keywords
  if (intentLower.includes('reflect') || intentLower.includes('review')) {
    scores.reflection = 1.0;
    scores.episodic = 0.8;
  }
  
  if (intentLower.includes('learn') || intentLower.includes('knowledge')) {
    scores.semantic = 1.0;
  }
  
  if (intentLower.includes('history') || intentLower.includes('past')) {
    scores.episodic = 1.0;
  }
  
  if (intentLower.includes('identity') || intentLower.includes('values')) {
    scores.kernel_ref = 1.0;
    scores.reflection = 0.9;
  }
  
  return scores;
}

/**
 * Tokenize intent into keywords
 */
function tokenizeIntent(intent) {
  return intent
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Compute overlap between intent tokens and envelope tags
 */
function computeTagOverlap(intentTokens, tags) {
  if (tags.length === 0 || intentTokens.length === 0) return 0.5;
  
  const tagSet = new Set(tags.map(t => t.toLowerCase()));
  const matches = intentTokens.filter(t => tagSet.has(t)).length;
  
  return matches / Math.max(intentTokens.length, tags.length);
}

/**
 * Check if envelope aligns with kernel values
 */
function computeValueAlignment(envelope, kernel) {
  if (!kernel?.invariants?.values) return 0.5;
  
  const values = kernel.invariants.values.map(v => v.toLowerCase());
  const tags = (envelope.topic_tags || []).map(t => t.toLowerCase());
  
  // Check for value-related tags
  for (const value of values) {
    const valueTokens = value.split(/\s+/);
    for (const token of valueTokens) {
      if (tags.some(t => t.includes(token))) {
        return 0.9;
      }
    }
  }
  
  return 0.5;
}

/**
 * Score based on risk class appropriateness
 */
function computeRiskScore(envelope, intent) {
  const risk = envelope.risk_class || 'low';
  const intentLower = intent.toLowerCase();
  
  // High-risk memories need explicit intent
  if (risk === 'high') {
    if (intentLower.includes('sensitive') || 
        intentLower.includes('private') ||
        intentLower.includes('confidential')) {
      return 1.0;
    }
    return 0.3;  // Deprioritize high-risk unless explicitly needed
  }
  
  if (risk === 'med') {
    return 0.7;
  }
  
  return 1.0;  // Low risk is always appropriate
}

/**
 * Estimate token count for content
 * Rough approximation: ~4 chars per token
 */
export function estimateTokens(content) {
  const text = typeof content === 'string' 
    ? content 
    : JSON.stringify(content);
  
  return Math.ceil(text.length / 4);
}

/**
 * Batch score multiple envelopes
 */
export function scoreEnvelopes(envelopes, intent, kernel) {
  return envelopes
    .map(env => ({
      envelope: env,
      score: computeRelevance(env, intent, kernel)
    }))
    .sort((a, b) => b.score - a.score);
}

export default {
  computeRelevance,
  estimateTokens,
  scoreEnvelopes
};
