/**
 * MemoryEnvelope - Ledger-facing record
 * 
 * Based on MLP spec v0.2 schema.
 * Contains attestations, pointers to encrypted blobs, and lineage.
 */

import { randomUUID } from 'crypto';

export class MemoryEnvelope {
  constructor(data = {}) {
    // Required fields per schema
    this.mlp_version = data.mlp_version || '0.2';
    this.envelope_id = data.envelope_id || randomUUID();
    this.cid = data.cid || null;  // Content-addressed ID pointing to encrypted blob
    this.content_hash = data.content_hash || null;  // Hash of plaintext
    this.created_at = data.created_at || new Date().toISOString();
    
    // Scope - ownership of the memory
    this.scope = data.scope || 'agent';  // user | agent | shared | system
    
    // Kind - type of memory content
    this.kind = data.kind || 'semantic';  // episodic | semantic | reflection | kernel_ref | policy | tombstone
    
    // Access policy reference
    this.access_policy_ref = data.access_policy_ref || null;
    
    // Lineage - provenance and relationships
    this.lineage = data.lineage || {
      parents: [],      // Envelope IDs this memory derives from
      supersedes: [],   // Envelope IDs this memory replaces
      branches: []      // Alternative interpretations
    };
    
    // Attestations - cryptographic signatures
    this.attestations = data.attestations || [];
    
    // Optional fields
    this.epoch_id = data.epoch_id || null;
    this.topic_tags = data.topic_tags || [];
    this.risk_class = data.risk_class || 'low';  // low | med | high
    this.ttl_hint = data.ttl_hint || 'P30D';  // ISO 8601 duration
    this.metadata_commitment = data.metadata_commitment || null;
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new MemoryEnvelope(data);
  }

  /**
   * Create a tombstone for this envelope
   */
  createTombstone(reason = 'user_request') {
    return new MemoryEnvelope({
      mlp_version: this.mlp_version,
      kind: 'tombstone',
      scope: this.scope,
      lineage: {
        parents: [],
        supersedes: [this.envelope_id],
        branches: []
      },
      revocation_reason: reason,  // user_request | policy_expiration | content_correction
      effective_at: new Date().toISOString()
    });
  }

  /**
   * Add attestation to this envelope
   */
  addAttestation(attestation) {
    const fullAttestation = {
      attestation_id: attestation.attestation_id || randomUUID(),
      attester_id: attestation.attester_id,
      attester_type: attestation.attester_type || 'agent',  // user | agent | host | witness
      level: attestation.level || 'SELF_SIGNED',  // SELF_SIGNED | HOST_SIGNED | WITNESS_SIGNED
      signature: attestation.signature,
      signature_algorithm: attestation.signature_algorithm || 'Ed25519',
      signed_at: attestation.signed_at || new Date().toISOString(),
      public_key: attestation.public_key || null,
      claims: attestation.claims || [
        { claim_type: 'integrity', claim_value: 'valid' }
      ]
    };
    
    this.attestations.push(fullAttestation);
    return this;
  }

  /**
   * Sign this envelope with an identity
   */
  async sign(identity, encryption) {
    const dataToSign = this.getSignableData();
    const signature = await encryption.sign(dataToSign, identity._keypair?.secretKey);
    
    this.addAttestation({
      attester_id: identity.kernel_id,
      attester_type: 'agent',
      level: 'SELF_SIGNED',
      signature: signature,
      claims: [
        { claim_type: 'authorship', claim_value: identity.kernel_id },
        { claim_type: 'integrity', claim_value: this.content_hash }
      ]
    });
    
    return this;
  }

  /**
   * Add witness signature
   */
  async addWitness(witnessIdentity, encryption) {
    const dataToSign = this.getSignableData();
    const signature = await encryption.sign(dataToSign, witnessIdentity._keypair?.secretKey);
    
    this.addAttestation({
      attester_id: witnessIdentity.kernel_id,
      attester_type: 'witness',
      level: 'WITNESS_SIGNED',
      signature: signature,
      claims: [
        { claim_type: 'validity', claim_value: 'witnessed' }
      ]
    });
    
    return this;
  }

  /**
   * Get data that should be signed (excludes attestations)
   */
  getSignableData() {
    return {
      mlp_version: this.mlp_version,
      envelope_id: this.envelope_id,
      cid: this.cid,
      content_hash: this.content_hash,
      created_at: this.created_at,
      scope: this.scope,
      kind: this.kind,
      access_policy_ref: this.access_policy_ref,
      lineage: this.lineage,
      epoch_id: this.epoch_id,
      topic_tags: this.topic_tags,
      risk_class: this.risk_class
    };
  }

  /**
   * Verify all attestations
   */
  async verify(encryption, trustedKeys = {}) {
    if (this.attestations.length === 0) {
      return { valid: false, reason: 'No attestations' };
    }
    
    const results = [];
    for (const attestation of this.attestations) {
      const publicKey = trustedKeys[attestation.attester_id] || attestation.public_key;
      
      if (!publicKey) {
        results.push({
          attester: attestation.attester_id,
          valid: false,
          reason: 'No public key available'
        });
        continue;
      }
      
      try {
        const valid = await encryption.verify(
          this.getSignableData(),
          attestation.signature,
          publicKey
        );
        results.push({
          attester: attestation.attester_id,
          valid,
          level: attestation.level
        });
      } catch (err) {
        results.push({
          attester: attestation.attester_id,
          valid: false,
          reason: err.message
        });
      }
    }
    
    const allValid = results.every(r => r.valid);
    return { valid: allValid, attestations: results };
  }

  /**
   * Check if this envelope is a tombstone
   */
  isTombstone() {
    return this.kind === 'tombstone';
  }

  /**
   * Check if this envelope supersedes another
   */
  supersedes(envelopeId) {
    return this.lineage.supersedes.includes(envelopeId);
  }

  /**
   * Create a child envelope (for updates)
   */
  createChild(updates = {}) {
    return new MemoryEnvelope({
      mlp_version: this.mlp_version,
      scope: this.scope,
      kind: this.kind,
      epoch_id: this.epoch_id,
      topic_tags: [...this.topic_tags],
      ...updates,
      lineage: {
        parents: [this.envelope_id],
        supersedes: updates.supersedes_parent ? [this.envelope_id] : [],
        branches: []
      },
      attestations: []  // New envelope needs new attestations
    });
  }

  /**
   * Get envelope metadata for indexing
   */
  getIndexData() {
    return {
      envelope_id: this.envelope_id,
      created_at: this.created_at,
      scope: this.scope,
      kind: this.kind,
      topic_tags: this.topic_tags,
      risk_class: this.risk_class,
      has_parents: this.lineage.parents.length > 0,
      attestation_count: this.attestations.length,
      attestation_levels: this.attestations.map(a => a.level)
    };
  }

  toJSON() {
    return {
      mlp_version: this.mlp_version,
      envelope_id: this.envelope_id,
      cid: this.cid,
      content_hash: this.content_hash,
      created_at: this.created_at,
      scope: this.scope,
      kind: this.kind,
      access_policy_ref: this.access_policy_ref,
      lineage: this.lineage,
      attestations: this.attestations,
      epoch_id: this.epoch_id,
      topic_tags: this.topic_tags,
      risk_class: this.risk_class,
      ttl_hint: this.ttl_hint,
      metadata_commitment: this.metadata_commitment
    };
  }
}

export default MemoryEnvelope;
