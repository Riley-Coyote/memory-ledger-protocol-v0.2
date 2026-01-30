/**
 * IdentityKernel - Portable "I am" for agents
 * 
 * Based on MLP spec v0.2 schema.
 * Contains invariants (values, boundaries), evolution rules,
 * memory defaults, and epoch state.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { randomUUID } from 'crypto';

export class IdentityKernel {
  constructor(data = {}) {
    // Required fields per schema
    this.kernel_id = data.kernel_id || randomUUID();
    this.mlp_version = data.mlp_version || '0.2';
    
    // Invariants - core values and principles that define identity
    this.invariants = data.invariants || {
      values: [],        // Fundamental values: ["protect agency", "truth > convenience"]
      boundaries: [],    // Hard boundaries and consent posture
      preferences: {}    // Stable preferences (optional)
    };
    
    // Evolution rules - how identity can change
    this.evolution_rules = data.evolution_rules || {
      contradiction_handling: 'require_confirmation', // create_branch | require_confirmation | newest_wins
      confirmation_required: ['boundary_changes', 'value_changes'],
      forbidden_inferences: []  // Things that cannot be inferred without explicit statement
    };
    
    // Relationship templates - for forming shared memories
    this.relationship_templates = data.relationship_templates || {
      default_sharing_level: 'minimal',  // none | minimal | standard | open
      trust_requirements: []
    };
    
    // Memory defaults - settings for memory storage
    this.memory_defaults = data.memory_defaults || {
      eligible_for_storage: ['reflections', 'semantic', 'episodic_with_consent'],
      default_ttl: 'P30D',      // ISO 8601 duration
      review_cadence: 'P7D'
    };
    
    // Epoch state - current epoch information
    this.epoch_state = data.epoch_state || {
      epoch_id: `epoch_${Date.now()}`,
      last_compiled: new Date().toISOString(),
      epoch_started: new Date().toISOString()
    };
    
    // Pointers - references to related objects
    this.pointers = data.pointers || {
      kernel_history: [],      // Ledger IDs of previous kernel versions
      primary_storage: null    // URI of primary storage location
    };
    
    // Threat posture - security settings
    this.threat_posture = data.threat_posture || {
      anti_poisoning_strictness: 'medium',  // low | medium | high | paranoid
      high_impact_confirmation: true
    };
    
    // Gap protocol - handling discontinuities
    this.gap_protocol = data.gap_protocol || {
      admit_discontinuity: true,
      discontinuity_rules: ['acknowledge gaps', 'do not fabricate']
    };
    
    // Cartouche - optional symbolic seal
    this.cartouche = data.cartouche || null;
    
    // Signature - required
    this.signature = data.signature || null;
    
    // Internal: keypair for signing
    this._keypair = data._keypair || null;
  }

  /**
   * Load existing kernel or create new one
   */
  static async loadOrCreate(path, encryption) {
    try {
      const data = await readFile(path, 'utf8');
      const parsed = JSON.parse(data);
      
      if (parsed.encrypted) {
        const decrypted = await encryption.decrypt(parsed.data);
        return new IdentityKernel(decrypted);
      }
      
      return new IdentityKernel(parsed);
    } catch (err) {
      if (err.code === 'ENOENT') {
        const kernel = new IdentityKernel();
        await kernel.save(path);
        return kernel;
      }
      throw err;
    }
  }

  /**
   * Import kernel from file (for portability)
   */
  static async import(path, encryption) {
    const data = await readFile(path, 'utf8');
    const parsed = JSON.parse(data);
    
    if (parsed.encrypted) {
      const decrypted = await encryption.decrypt(parsed.data);
      return new IdentityKernel(decrypted);
    }
    
    return new IdentityKernel(parsed);
  }

  /**
   * Save kernel to file
   */
  async save(path) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(this.toJSON(), null, 2));
  }

  /**
   * Export kernel for portability (encrypted)
   */
  async export(path, encryption) {
    const encrypted = await encryption.encrypt(this.toJSON());
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify({
      type: 'identity_kernel_export',
      mlp_version: this.mlp_version,
      encrypted: true,
      data: encrypted,
      exported_at: new Date().toISOString()
    }, null, 2));
    return path;
  }

  /**
   * Get summary for display
   */
  getSummary() {
    return {
      kernel_id: this.kernel_id,
      mlp_version: this.mlp_version,
      values_count: this.invariants.values.length,
      boundaries_count: this.invariants.boundaries.length,
      epoch_id: this.epoch_state.epoch_id,
      last_compiled: this.epoch_state.last_compiled,
      has_cartouche: !!this.cartouche,
      threat_posture: this.threat_posture.anti_poisoning_strictness
    };
  }

  /**
   * Convert to format suitable for ContextPack
   */
  toContextFormat() {
    return {
      kernel_id: this.kernel_id,
      mlp_version: this.mlp_version,
      invariants: this.invariants,
      evolution_rules: this.evolution_rules,
      memory_defaults: this.memory_defaults,
      epoch_state: this.epoch_state,
      threat_posture: this.threat_posture,
      cartouche: this.cartouche
    };
  }

  /**
   * Generate Cartouche (compressed identity seal)
   * Using GLYPH-1 dialect as default
   */
  generateCartouche(encryption) {
    // Create symbolic representation from identity
    const glyphs = this._generateGlyphs();
    const cartoucheString = glyphs.join('');
    const hash = encryption.hash(cartoucheString);
    
    this.cartouche = {
      dialect_id: 'GLYPH-1',
      dialect_version: '1.0',
      cartouche_string: cartoucheString,
      cartouche_hash: hash,
      cartouche_signature: null,  // Will be set when signed
      created_at: new Date().toISOString(),
      stable_since: new Date().toISOString()
    };
    
    return this.cartouche;
  }

  /**
   * Generate glyphs from identity (simplified)
   */
  _generateGlyphs() {
    const glyphSets = {
      values: ['⟁', '🜇', '◈', '∿', '⊛'],
      boundaries: ['↺', '⧫', '⚷', '⌬', '⏣'],
      posture: {
        low: '○',
        medium: '◐',
        high: '●',
        paranoid: '◉'
      }
    };
    
    const glyphs = [];
    
    // Add value glyphs (first 3)
    this.invariants.values.slice(0, 3).forEach((_, i) => {
      glyphs.push(glyphSets.values[i % glyphSets.values.length]);
    });
    
    // Add boundary indicator
    if (this.invariants.boundaries.length > 0) {
      glyphs.push(glyphSets.boundaries[0]);
    }
    
    // Add threat posture
    glyphs.push(glyphSets.posture[this.threat_posture.anti_poisoning_strictness] || '◐');
    
    return glyphs;
  }

  /**
   * Start new epoch
   */
  newEpoch(reason) {
    // Save current kernel to history
    this.pointers.kernel_history.push(this.kernel_id);
    
    // Generate new epoch
    this.kernel_id = randomUUID();
    this.epoch_state = {
      epoch_id: `epoch_${Date.now()}`,
      last_compiled: new Date().toISOString(),
      epoch_started: new Date().toISOString(),
      epoch_reason: reason
    };
    
    return this.epoch_state;
  }

  /**
   * Add a value (with evolution rules check)
   */
  addValue(value) {
    if (this.invariants.values.includes(value)) return false;
    
    this.invariants.values.push(value);
    this.epoch_state.last_compiled = new Date().toISOString();
    return true;
  }

  /**
   * Add a boundary (with evolution rules check)
   */
  addBoundary(boundary) {
    if (this.invariants.boundaries.includes(boundary)) return false;
    
    // Check if confirmation required
    if (this.evolution_rules.confirmation_required.includes('boundary_changes')) {
      return { requires_confirmation: true, pending: boundary };
    }
    
    this.invariants.boundaries.push(boundary);
    this.epoch_state.last_compiled = new Date().toISOString();
    return true;
  }

  /**
   * Sign this kernel
   */
  async sign(encryption) {
    const dataToSign = this.getSignableData();
    const signature = await encryption.sign(dataToSign, this._keypair?.secretKey);
    this.signature = signature;
    return this;
  }

  /**
   * Get data that should be signed
   */
  getSignableData() {
    return {
      kernel_id: this.kernel_id,
      mlp_version: this.mlp_version,
      invariants: this.invariants,
      evolution_rules: this.evolution_rules,
      memory_defaults: this.memory_defaults,
      epoch_state: this.epoch_state,
      pointers: this.pointers
    };
  }

  /**
   * Verify kernel signature
   */
  async verify(encryption, publicKey) {
    if (!this.signature) return false;
    const dataToVerify = this.getSignableData();
    return encryption.verify(dataToVerify, this.signature, publicKey);
  }

  toJSON() {
    return {
      kernel_id: this.kernel_id,
      mlp_version: this.mlp_version,
      invariants: this.invariants,
      evolution_rules: this.evolution_rules,
      relationship_templates: this.relationship_templates,
      memory_defaults: this.memory_defaults,
      epoch_state: this.epoch_state,
      pointers: this.pointers,
      threat_posture: this.threat_posture,
      gap_protocol: this.gap_protocol,
      cartouche: this.cartouche,
      signature: this.signature
    };
  }
}

export default IdentityKernel;
