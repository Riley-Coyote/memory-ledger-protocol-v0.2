/**
 * ContextPack - Session initialization bundle builder
 * 
 * Based on MLP v0.2 spec (lines 577-613)
 * Compiles kernel + memories into a runtime bundle.
 */

import { randomUUID } from 'crypto';
import { computeRelevance, estimateTokens, scoreEnvelopes } from './relevance.js';
import { gatherPolicies } from './access-policy.js';
import { MemoryEnvelope } from './envelope.js';

/**
 * Compile a ContextPack following MLP spec flow
 * 
 * @param {Object} options
 * @param {Object} options.kernel - IdentityKernel
 * @param {string} options.intent - Session purpose
 * @param {Object} options.constraints - Compilation constraints
 * @param {Function} options.queryEnvelopes - Function to query envelopes
 * @param {Function} options.fetchAndDecrypt - Function to fetch and decrypt blobs
 * @param {Object} options.storage - Storage instance for policies
 */
export async function compileContextPack({
  kernel,
  intent,
  constraints = {},
  queryEnvelopes,
  fetchAndDecrypt,
  storage
}) {
  const {
    scope = ['user', 'agent'],
    kinds = ['episodic', 'semantic', 'reflection'],
    since = null,
    maxCandidates = 200,
    maxTokens = 4000,
    maxMemories = 20
  } = constraints;

  // 1. Kernel already loaded and verified (passed in)
  
  // 2. Fetch candidate envelopes
  const candidates = await queryEnvelopes({
    scope,
    kinds,
    since,
    limit: maxCandidates
  });

  // 3. Score and rank by relevance
  const scored = scoreEnvelopes(candidates, intent, kernel);

  // 4. Apply token budget and build memory slices
  let tokenCount = 0;
  const included = [];
  const redacted = [];
  const denied = [];

  for (const item of scored) {
    // Skip tombstones
    if (item.envelope.kind === 'tombstone') {
      denied.push(item.envelope.envelope_id);
      continue;
    }

    try {
      // 5. Fetch and decrypt blob
      const blob = await fetchAndDecrypt(item.envelope.cid);
      
      // Estimate tokens
      const tokens = estimateTokens(blob);
      
      // Check token budget
      if (tokenCount + tokens > maxTokens) {
        // Try to include metadata only
        included.push({
          envelope: item.envelope,
          decrypted_content: null,
          access_level: 'metadata_only',
          relevance_score: item.score
        });
        continue;
      }
      
      // Check memory count limit
      if (included.filter(m => m.access_level === 'full').length >= maxMemories) {
        break;
      }

      included.push({
        envelope: item.envelope,
        decrypted_content: blob,
        access_level: 'full',
        relevance_score: item.score
      });
      
      tokenCount += tokens;
      
    } catch (err) {
      // Access denied or decryption failed
      denied.push(item.envelope.envelope_id);
    }
  }

  // 6. Gather active policies
  const activePolicies = storage 
    ? await gatherPolicies(included, storage)
    : [];

  // 7. Build pack with trace
  const pack = {
    pack_id: randomUUID(),
    mlp_version: '0.2',
    kernel: kernel,
    memory_slices: included,
    active_policies: activePolicies.map(p => p.toJSON()),
    compilation_trace: {
      requested_by: kernel.kernel_id,
      intent: intent,
      constraints_applied: [
        `scope: ${scope.join(',')}`,
        `kinds: ${kinds.join(',')}`,
        `maxTokens: ${maxTokens}`,
        `maxMemories: ${maxMemories}`
      ],
      memories_considered: candidates.length,
      memories_included: included.filter(m => m.access_level === 'full').length,
      memories_redacted: included.filter(m => m.access_level === 'redacted').length,
      memories_metadata_only: included.filter(m => m.access_level === 'metadata_only').length,
      memories_denied: denied.length,
      total_tokens: tokenCount
    },
    compiled_at: new Date().toISOString(),
    session_constraints: {
      max_duration: constraints.maxDuration || null,
      allowed_operations: ['read', 'write', 'derive'],
      requires_attestation_on_write: true
    }
  };

  // Set expiration if specified
  if (constraints.expiresIn) {
    const expiresAt = new Date(Date.now() + constraints.expiresIn);
    pack.expires_at = expiresAt.toISOString();
  }

  return pack;
}

/**
 * Validate a ContextPack
 */
export function validateContextPack(pack) {
  const errors = [];

  if (!pack.pack_id) errors.push('Missing pack_id');
  if (!pack.mlp_version) errors.push('Missing mlp_version');
  if (!pack.kernel) errors.push('Missing kernel');
  if (!pack.memory_slices) errors.push('Missing memory_slices');
  if (!pack.compilation_trace) errors.push('Missing compilation_trace');
  if (!pack.compiled_at) errors.push('Missing compiled_at');

  // Check expiration
  if (pack.expires_at && new Date(pack.expires_at) < new Date()) {
    errors.push('ContextPack has expired');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract summary from ContextPack for logging
 */
export function summarizeContextPack(pack) {
  return {
    pack_id: pack.pack_id,
    kernel_id: pack.kernel?.kernel_id,
    intent: pack.compilation_trace?.intent,
    memories_included: pack.compilation_trace?.memories_included,
    total_tokens: pack.compilation_trace?.total_tokens,
    compiled_at: pack.compiled_at,
    expires_at: pack.expires_at
  };
}

/**
 * Create a minimal ContextPack (kernel only, no memories)
 */
export function createMinimalPack(kernel, intent = 'bootstrap') {
  return {
    pack_id: randomUUID(),
    mlp_version: '0.2',
    kernel: kernel,
    memory_slices: [],
    active_policies: [],
    compilation_trace: {
      requested_by: kernel.kernel_id,
      intent: intent,
      constraints_applied: ['minimal'],
      memories_considered: 0,
      memories_included: 0,
      memories_redacted: 0,
      memories_denied: 0
    },
    compiled_at: new Date().toISOString(),
    session_constraints: {
      allowed_operations: ['read', 'write'],
      requires_attestation_on_write: true
    }
  };
}

export default {
  compileContextPack,
  validateContextPack,
  summarizeContextPack,
  createMinimalPack
};
