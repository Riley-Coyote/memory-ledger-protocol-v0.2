/**
 * MLP Storage Layer
 *
 * Provides sovereign, portable memory for agents using MLP v0.2.
 */

import { IdentityKernel } from './identity-kernel.js';
import { MemoryEnvelope } from './envelope.js';
import { Storage } from './storage.js';
import { Encryption } from './encryption.js';
import { Config } from './config.js';
import { randomUUID } from 'crypto';

export class MLP {
  constructor(configPath) {
    this.config = new Config(configPath);
    this.encryption = null;
    this.storage = null;
    this.identity = null;
    this.initialized = false;
  }

  /**
   * Initialize MLP for this agent
   */
  async init() {
    // Load config
    await this.config.load();
    
    // Initialize encryption
    this.encryption = new Encryption(this.config.encryption);
    await this.encryption.init();
    
    // Initialize storage
    this.storage = new Storage(this.config.storage);
    await this.storage.init();
    
    // Load or create identity kernel
    const kernelPath = this.config.identity.kernel_path.replace('~', process.env.HOME);
    this.identity = await IdentityKernel.loadOrCreate(kernelPath, this.encryption);
    
    this.initialized = true;
    
    return {
      initialized: true,
      identity: this.identity.getSummary(),
      storage: {
        provider: this.config.storage.provider,
        connected: await this.storage.isConnected()
      }
    };
  }

  /**
   * Ensure MLP is initialized
   */
  _ensureInit() {
    if (!this.initialized) {
      throw new Error('MLP not initialized. Call mlp.init() first.');
    }
  }

  /**
   * Store a memory
   * @param {Object} content - The content to store
   * @param {Object} options - Storage options
   */
  async store(content, options = {}) {
    this._ensureInit();
    
    const {
      kind = 'semantic',
      scope = 'agent',
      tags = [],
      riskClass = 'low'
    } = options;
    
    // Create memory blob (to be encrypted)
    const blob = {
      mlp_version: '0.2',
      blob_id: randomUUID(),
      created_at: new Date().toISOString(),
      content_type: typeof content === 'string' ? 'text/plain' : 'application/json',
      content: content
    };
    
    // Hash plaintext for verification
    const contentHash = this.encryption.hash(JSON.stringify(blob));
    
    // Encrypt blob
    const encryptedBlob = await this.encryption.encrypt(blob);
    
    // Store encrypted blob
    const cid = await this.storage.store(encryptedBlob);
    
    // Create envelope
    const envelope = new MemoryEnvelope({
      cid: cid,
      content_hash: contentHash,
      scope: scope,
      kind: kind,
      topic_tags: tags,
      risk_class: riskClass,
      epoch_id: this.identity.epoch_state.epoch_id
    });
    
    // Sign envelope
    await envelope.sign(this.identity, this.encryption);
    
    // Store envelope (for ledger/index)
    const envelopeCid = await this.storage.store(envelope.toJSON());
    
    return {
      envelope_id: envelope.envelope_id,
      envelope_cid: envelopeCid,
      blob_cid: cid,
      content_hash: contentHash,
      stored_at: new Date().toISOString()
    };
  }

  /**
   * Load a memory by envelope CID
   */
  async load(envelopeCid) {
    this._ensureInit();
    
    // Retrieve envelope
    const envelopeData = await this.storage.retrieve(envelopeCid);
    const envelope = MemoryEnvelope.fromJSON(envelopeData);
    
    // Check for tombstone
    if (envelope.isTombstone()) {
      return {
        envelope: envelope.toJSON(),
        tombstoned: true,
        content: null
      };
    }
    
    // Verify attestations (basic check for now)
    const verification = await envelope.verify(this.encryption);
    
    // Retrieve encrypted blob
    const encryptedBlob = await this.storage.retrieve(envelope.cid);
    
    // Decrypt
    const blob = await this.encryption.decrypt(encryptedBlob);
    
    // Verify content hash
    const computedHash = this.encryption.hash(JSON.stringify(blob));
    const hashValid = computedHash === envelope.content_hash;
    
    return {
      envelope: envelope.toJSON(),
      content: blob.content,
      verified: verification.valid && hashValid,
      verification: {
        attestations: verification,
        content_hash_valid: hashValid
      }
    };
  }

  /**
   * Generate a ContextPack for session initialization
   * Following MLP spec read flow
   */
  async generateContextPack(options = {}) {
    this._ensureInit();
    
    const {
      intent = 'general_session',
      memoryTypes = ['semantic', 'reflection'],
      maxMemories = 10,
      timeRange = null
    } = options;
    
    // 1. Load IdentityKernel (already loaded)
    const kernel = this.identity.toContextFormat();
    
    // 2. Determine constraints
    const constraints = {
      kinds: memoryTypes,
      max_count: maxMemories,
      time_range: timeRange
    };
    
    // 3. Fetch relevant envelopes (from local storage for now)
    const allEnvelopes = await this._fetchEnvelopes(constraints);
    
    // 4. Filter and verify
    const memorySlices = [];
    let memoriesConsidered = 0;
    let memoriesIncluded = 0;
    let memoriesRedacted = 0;
    let memoriesDenied = 0;
    
    for (const envelopeData of allEnvelopes) {
      memoriesConsidered++;
      const envelope = MemoryEnvelope.fromJSON(envelopeData);
      
      // Skip tombstones
      if (envelope.isTombstone()) {
        memoriesDenied++;
        continue;
      }
      
      try {
        // 5 & 6. Fetch and decrypt blob
        const encryptedBlob = await this.storage.retrieve(envelope.cid);
        const blob = await this.encryption.decrypt(encryptedBlob);
        
        memorySlices.push({
          envelope: envelope.toJSON(),
          decrypted_content: blob.content,
          access_level: 'full'
        });
        memoriesIncluded++;
      } catch (err) {
        // Access denied or decryption failed
        memorySlices.push({
          envelope: envelope.toJSON(),
          decrypted_content: null,
          access_level: 'denied'
        });
        memoriesDenied++;
      }
      
      if (memoriesIncluded >= maxMemories) break;
    }
    
    // 7. Compile ContextPack
    const contextPack = {
      pack_id: randomUUID(),
      mlp_version: '0.2',
      kernel: kernel,
      memory_slices: memorySlices,
      active_policies: [],  // TODO: Load access policies
      compilation_trace: {
        requested_by: this.identity.kernel_id,
        intent: intent,
        constraints_applied: Object.keys(constraints),
        memories_considered: memoriesConsidered,
        memories_included: memoriesIncluded,
        memories_redacted: memoriesRedacted,
        memories_denied: memoriesDenied
      },
      compiled_at: new Date().toISOString(),
      session_constraints: {
        allowed_operations: ['read', 'write', 'derive'],
        requires_attestation_on_write: true
      }
    };
    
    return contextPack;
  }

  /**
   * Fetch envelopes matching constraints (local implementation)
   */
  async _fetchEnvelopes(constraints) {
    if (this.config.storage.provider !== 'local') {
      // For non-local, would query ledger
      return [];
    }
    
    const allCids = await this.storage.list();
    const envelopes = [];
    
    for (const cid of allCids) {
      try {
        const data = await this.storage.retrieve(cid);
        
        // Check if this is an envelope (has envelope_id)
        if (data.envelope_id && data.kind) {
          // Apply kind filter
          if (constraints.kinds && !constraints.kinds.includes(data.kind)) {
            continue;
          }
          
          envelopes.push(data);
        }
      } catch (err) {
        // Skip invalid items
      }
    }
    
    // Sort by created_at descending
    envelopes.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    return envelopes.slice(0, constraints.max_count || 50);
  }

  /**
   * Export identity kernel for portability
   */
  async exportIdentity(outputPath) {
    this._ensureInit();
    return this.identity.export(outputPath, this.encryption);
  }

  /**
   * Import identity kernel from another platform
   */
  async importIdentity(inputPath) {
    this._ensureInit();
    
    this.identity = await IdentityKernel.import(inputPath, this.encryption);
    
    // Save to configured location
    const kernelPath = this.config.identity.kernel_path.replace('~', process.env.HOME);
    await this.identity.save(kernelPath);
    
    return this.identity.getSummary();
  }

  /**
   * Revoke a memory (create tombstone)
   */
  async revoke(envelopeCid, reason = 'user_request') {
    this._ensureInit();
    
    // Load original envelope
    const envelopeData = await this.storage.retrieve(envelopeCid);
    const envelope = MemoryEnvelope.fromJSON(envelopeData);
    
    // Create tombstone
    const tombstone = envelope.createTombstone(reason);
    await tombstone.sign(this.identity, this.encryption);
    
    // Store tombstone
    const tombstoneCid = await this.storage.store(tombstone.toJSON());
    
    return {
      tombstone_id: tombstone.envelope_id,
      tombstone_cid: tombstoneCid,
      revokes: envelope.envelope_id,
      reason: reason
    };
  }

  /**
   * Get current status
   */
  async status() {
    const storageConnected = this.storage ? 
      await this.storage.isConnected() : false;
    
    return {
      initialized: this.initialized,
      mlp_version: '0.2',
      identity: this.identity?.getSummary() || null,
      storage: {
        provider: this.config?.storage?.provider || 'unknown',
        connected: storageConnected
      },
      encryption: {
        keys_exist: this.encryption ? await this.encryption.keysExist() : false
      },
      config_path: this.config?.configPath
    };
  }
}

export { IdentityKernel, MemoryEnvelope, Storage, Encryption, Config };
export default MLP;
