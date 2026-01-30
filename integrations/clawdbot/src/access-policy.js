/**
 * AccessPolicy - Consent and permission management
 * 
 * Based on MLP v0.2 access-policy.schema.json
 * Controls who can read, write, derive from memories.
 */

import { randomUUID } from 'crypto';

export class AccessPolicy {
  constructor(data = {}) {
    this.policy_id = data.policy_id || randomUUID();
    this.mlp_version = data.mlp_version || '0.2';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    
    // Owner of this policy
    this.owner_id = data.owner_id || null;
    
    // Principals - who this policy applies to
    this.principals = data.principals || [];
    
    // Permissions
    this.permissions = data.permissions || {
      read: [],      // Principal IDs that can read
      write: [],     // Principal IDs that can write
      derive: [],    // Principal IDs that can create derived memories
      share: [],     // Principal IDs that can share with others
      revoke: []     // Principal IDs that can revoke access
    };
    
    // Constraints
    this.constraints = data.constraints || {
      valid_from: null,
      valid_until: null,
      max_retrievals: null,
      allowed_intents: [],  // Empty = all intents allowed
      denied_intents: []
    };
    
    // Redaction rules
    this.redaction = data.redaction || {
      enabled: false,
      fields_to_redact: [],
      redaction_pattern: '[REDACTED]'
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new AccessPolicy(data);
  }

  /**
   * Create a default policy (owner has full access)
   */
  static createDefault(ownerId) {
    return new AccessPolicy({
      owner_id: ownerId,
      principals: [ownerId],
      permissions: {
        read: [ownerId],
        write: [ownerId],
        derive: [ownerId],
        share: [ownerId],
        revoke: [ownerId]
      }
    });
  }

  /**
   * Create a shared policy
   */
  static createShared(ownerId, sharedWith, permissions = ['read']) {
    const policy = AccessPolicy.createDefault(ownerId);
    
    policy.principals.push(...sharedWith);
    
    for (const perm of permissions) {
      if (policy.permissions[perm]) {
        policy.permissions[perm].push(...sharedWith);
      }
    }
    
    return policy;
  }

  /**
   * Check if principal has permission
   */
  hasPermission(principalId, permission) {
    // Owner always has all permissions
    if (principalId === this.owner_id) return true;
    
    // Check specific permission
    const allowed = this.permissions[permission] || [];
    return allowed.includes(principalId) || allowed.includes('*');
  }

  /**
   * Check if policy is currently valid
   */
  isValid() {
    const now = new Date();
    
    if (this.constraints.valid_from) {
      if (now < new Date(this.constraints.valid_from)) {
        return { valid: false, reason: 'Policy not yet active' };
      }
    }
    
    if (this.constraints.valid_until) {
      if (now > new Date(this.constraints.valid_until)) {
        return { valid: false, reason: 'Policy expired' };
      }
    }
    
    return { valid: true };
  }

  /**
   * Check if intent is allowed
   */
  isIntentAllowed(intent) {
    // Check denied intents first
    if (this.constraints.denied_intents.length > 0) {
      const intentLower = intent.toLowerCase();
      for (const denied of this.constraints.denied_intents) {
        if (intentLower.includes(denied.toLowerCase())) {
          return false;
        }
      }
    }
    
    // Check allowed intents (empty = all allowed)
    if (this.constraints.allowed_intents.length === 0) {
      return true;
    }
    
    const intentLower = intent.toLowerCase();
    return this.constraints.allowed_intents.some(
      allowed => intentLower.includes(allowed.toLowerCase())
    );
  }

  /**
   * Grant permission to principal
   */
  grant(principalId, permission) {
    if (!this.permissions[permission]) {
      throw new Error(`Unknown permission: ${permission}`);
    }
    
    if (!this.principals.includes(principalId)) {
      this.principals.push(principalId);
    }
    
    if (!this.permissions[permission].includes(principalId)) {
      this.permissions[permission].push(principalId);
    }
    
    this.updated_at = new Date().toISOString();
    return this;
  }

  /**
   * Revoke permission from principal
   */
  revoke(principalId, permission) {
    if (!this.permissions[permission]) {
      throw new Error(`Unknown permission: ${permission}`);
    }
    
    this.permissions[permission] = this.permissions[permission]
      .filter(id => id !== principalId);
    
    this.updated_at = new Date().toISOString();
    return this;
  }

  /**
   * Revoke all permissions from principal
   */
  revokeAll(principalId) {
    for (const perm of Object.keys(this.permissions)) {
      this.permissions[perm] = this.permissions[perm]
        .filter(id => id !== principalId);
    }
    
    this.principals = this.principals.filter(id => id !== principalId);
    this.updated_at = new Date().toISOString();
    return this;
  }

  /**
   * Set time constraints
   */
  setTimeConstraints(validFrom, validUntil) {
    this.constraints.valid_from = validFrom;
    this.constraints.valid_until = validUntil;
    this.updated_at = new Date().toISOString();
    return this;
  }

  /**
   * Enable redaction with specified fields
   */
  enableRedaction(fields, pattern = '[REDACTED]') {
    this.redaction = {
      enabled: true,
      fields_to_redact: fields,
      redaction_pattern: pattern
    };
    this.updated_at = new Date().toISOString();
    return this;
  }

  /**
   * Apply redaction to content
   */
  applyRedaction(content) {
    if (!this.redaction.enabled) return content;
    
    const redacted = { ...content };
    
    for (const field of this.redaction.fields_to_redact) {
      if (redacted[field] !== undefined) {
        redacted[field] = this.redaction.redaction_pattern;
      }
    }
    
    return redacted;
  }

  /**
   * Determine access level for principal and intent
   */
  getAccessLevel(principalId, intent) {
    // Check validity
    const validity = this.isValid();
    if (!validity.valid) return 'denied';
    
    // Check intent
    if (!this.isIntentAllowed(intent)) return 'denied';
    
    // Check read permission
    if (!this.hasPermission(principalId, 'read')) return 'denied';
    
    // Check if redaction applies
    if (this.redaction.enabled && principalId !== this.owner_id) {
      return 'redacted';
    }
    
    return 'full';
  }

  toJSON() {
    return {
      policy_id: this.policy_id,
      mlp_version: this.mlp_version,
      created_at: this.created_at,
      updated_at: this.updated_at,
      owner_id: this.owner_id,
      principals: this.principals,
      permissions: this.permissions,
      constraints: this.constraints,
      redaction: this.redaction
    };
  }
}

/**
 * Gather active policies for a set of memory slices
 */
export async function gatherPolicies(memorySlices, storage) {
  const policies = [];
  const seenPolicyIds = new Set();
  
  for (const slice of memorySlices) {
    const policyRef = slice.envelope?.access_policy_ref;
    
    if (policyRef && !seenPolicyIds.has(policyRef)) {
      try {
        const policyData = await storage.retrieve(policyRef);
        policies.push(AccessPolicy.fromJSON(policyData));
        seenPolicyIds.add(policyRef);
      } catch (err) {
        // Policy not found or inaccessible
        console.warn(`Could not load policy ${policyRef}: ${err.message}`);
      }
    }
  }
  
  return policies;
}

export default AccessPolicy;
