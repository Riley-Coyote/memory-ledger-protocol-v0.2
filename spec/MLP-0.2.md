# Memory Ledger Protocol (MLP)

**Version:** MLP-0.2

**Status:** Working Draft

**Date:** 2026-01-26

**Previous Version:** [MLP-0.1](MLP-0.1.md)

**Changes from 0.1:** Added economic sustainability model, reference implementations, Guardian use case pattern, resolved open questions regarding canonicalization and signature suites.

---

## Abstract

MLP defines a portable, verifiable, consent-aware memory format and persistence workflow for digital intelligence across platforms.

The protocol separates three concerns that are currently bundled by AI platforms:

1. **Encrypted content** (blobs) — stored anywhere, readable only by keyholders
2. **Immutable proofs + pointers** (ledger entries) — publicly verifiable, content-blind
3. **Access control** (policies) — machine-readable consent, user-controlled

MLP also defines an **Identity Kernel** (a compact portable self) and an optional symbolic **Cartouche** (compressed identity signature).

The protocol is designed to function in adversarial environments where no platform, storage provider, or infrastructure operator is trusted.

---

## Table of Contents

1. [Goals](#goals)
2. [Non-Goals](#non-goals)
3. [Terms](#terms)
4. [Roles](#roles)
5. [Trust Model](#trust-model)
6. [Data Model](#data-model)
   - A) MemoryEnvelope
   - B) MemoryBlob
   - C) AccessPolicy
   - D) Redaction + Derivation
   - E) IdentityKernel
   - F) Cartouche
   - G) ContextPack
7. [Workflows](#workflows)
   - Write Flow
   - Read Flow
8. [Revocation and Deletion](#revocation-and-deletion)
9. [Security Considerations](#security-considerations)
10. [Interoperability](#interoperability)
11. [Conformance Profiles](#conformance-profiles)
12. [Economic Sustainability](#economic-sustainability)
13. [Reference Implementations](#reference-implementations)
14. [Use Case: The Guardian](#use-case-the-guardian)
15. [Examples](#examples)
16. [Appendix A: Canonicalization](#appendix-a-canonicalization)
17. [Appendix B: Signature Suites](#appendix-b-signature-suites)
18. [Appendix C: Privacy Commitments](#appendix-c-privacy-commitments)

---

## Goals

1. **Cross-platform continuity** — Memories travel with the user, not the platform
2. **Strong provenance** — Cryptographic attestations prove memory authenticity
3. **Consent as first-class** — Access policies are explicit, machine-readable, user-controlled
4. **Append-only evolution** — Identity grows through attestation, not mutation
5. **Practical revocation** — Users can make data unreadable without platform cooperation
6. **Model-agnostic interoperability** — Works across any AI system that implements the protocol
7. **Economic sustainability** — Infrastructure can be maintained without centralized control

---

## Non-Goals

- **Proving consciousness** — MLP is agnostic to the nature of the agents using it
- **Forcing universal symbolism** — Multiple dialects and representations coexist
- **Storing everything forever** — TTLs, crypto-shredding, and garbage collection are supported
- **Avoiding all metadata leakage** — Some metadata is necessary; the goal is minimization
- **Requiring specific blockchains** — The protocol is ledger-agnostic with reference implementations

---

## Terms

| Term | Definition |
|------|------------|
| **Ledger** | Append-only record of claims, pointers, and attestations |
| **Blob** | Encrypted memory payload |
| **CID** | Content-addressed identifier (hash-based pointer) |
| **Attestation** | Cryptographic signature binding an actor to a claim |
| **Epoch** | Time window of identity stability (days to months) |
| **Kernel** | Distilled portable self-definition |
| **Cartouche** | Symbolic compressed kernel seal (optional) |
| **Host** | Platform running an AI agent |
| **Principal** | Entity with cryptographic identity (user, agent, host, witness) |

---

## Roles

### User
The human principal. Owns root keys. Ultimate authority over their memory.

### Agent
Digital intelligence (AI system). Can sign statements when enabled by its host. May have its own memory scope.

### Host
Platform running the agent. May co-sign attestations. Is NOT trusted with decryption keys.

### Witness
Third-party attestor. Optional. May be an organization, device, trusted enclave, or auditor. Provides additional verification for high-stakes memories.

---

## Trust Model

MLP does **not** assume any Host is trusted.

### Assumptions

| Entity | Trust Level | Rationale |
|--------|-------------|-----------|
| User | Trusted | Controls root keys |
| Agent | Partial | Signs when enabled; host controls enablement |
| Host | Untrusted | Never receives decryption keys |
| Storage Network | Untrusted | Only holds ciphertext |
| Ledger Network | Untrusted | Only holds pointers and proofs |

### Security Properties

The protocol provides:

- **Confidentiality** — Only keyholders can read memory content
- **Integrity** — Tampering is detectable via hashes and signatures
- **Authenticity** — Attestations prove provenance
- **Non-repudiation** — Append-only ledger preserves history
- **Revocability** — Users can make content permanently unreadable

---

## Data Model

### Normative Language

"MUST", "SHOULD", "MAY", "MUST NOT", "SHOULD NOT" follow [RFC 2119](https://tools.ietf.org/html/rfc2119) conventions.

### Overview

```
MLP Objects
├── MemoryEnvelope     (ledger-facing pointer + metadata + attestations)
├── MemoryBlob         (encrypted memory payload)
├── AccessPolicy       (consent + permission rules)
├── IdentityKernel     (portable self-definition)
├── Cartouche          (symbolic kernel seal, optional)
└── ContextPack        (session load bundle)
```

---

### A) MemoryEnvelope

A **MemoryEnvelope** is the ledger-facing record. It contains pointers and metadata but NOT the memory content itself.

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `mlp_version` | string | Protocol version (e.g., "0.2") |
| `envelope_id` | string | Unique identifier (UUID or similar) |
| `cid` | string | Content-addressed pointer to the MemoryBlob |
| `content_hash` | string | Hash of the plaintext (for integrity verification by authorized parties) |
| `created_at` | timestamp | ISO 8601 creation time |
| `scope` | enum | `user` \| `agent` \| `shared` \| `system` |
| `kind` | enum | `episodic` \| `semantic` \| `reflection` \| `kernel_ref` \| `policy` \| `tombstone` |
| `access_policy_ref` | string | Pointer to the governing AccessPolicy |
| `lineage` | object | Provenance tracking (see below) |
| `attestations` | array | Cryptographic signatures (see below) |

#### Lineage Object

```json
{
  "parents": ["envelope_id_1", "envelope_id_2"],
  "supersedes": ["envelope_id_3"],
  "branches": ["branch_label"]
}
```

- `parents[]` — Envelopes this memory derives from
- `supersedes[]` — Envelopes this memory replaces (for updates)
- `branches[]` — Named branches for divergent evolution

#### Recommended Fields

| Field | Type | Description |
|-------|------|-------------|
| `epoch_id` | string | Identity epoch this belongs to |
| `topic_tags` | array | Semantic tags (MAY be encrypted) |
| `risk_class` | enum | `low` \| `medium` \| `high` |
| `ttl_hint` | duration | Suggested review/expiration time |
| `metadata_commitment` | string | Hash commitment for private metadata |

#### Attestations

Each attestation MUST include:

```json
{
  "attestor_id": "principal_identifier",
  "attestor_type": "user | agent | host | witness",
  "level": "SELF_SIGNED | HOST_SIGNED | WITNESS_SIGNED",
  "signature": "base64_signature",
  "algorithm": "Ed25519 | secp256k1 | ...",
  "timestamp": "ISO8601"
}
```

Attestation levels:

| Level | Signers | Use Case |
|-------|---------|----------|
| `SELF_SIGNED` | User and/or Agent | Personal memories, low-stakes |
| `HOST_SIGNED` | + Platform | Platform-verified interactions |
| `WITNESS_SIGNED` | + Third party | Auditable, high-stakes, legal |

A MemoryEnvelope MUST have at least one attestation. Multiple attestations from different parties increase trust.

---

### B) MemoryBlob

A **MemoryBlob** is the encrypted payload containing actual memory content.

#### Plaintext Content

Blob plaintext MAY contain:

- Natural language memory text
- Structured fields (JSON, etc.)
- Embeddings or feature vectors
- Symbolic compression layers
- Redacted derivatives
- Binary attachments

The protocol does not constrain content format. Implementations SHOULD document their content schemas.

#### Ciphertext Structure

```json
{
  "encryption_suite_id": "AES-256-GCM | ChaCha20-Poly1305 | ...",
  "key_id": "key_identifier_or_derivation_hint",
  "nonce": "base64_nonce",
  "ciphertext": "base64_ciphertext",
  "aad": "optional_additional_authenticated_data"
}
```

All blobs MUST be encrypted with an AEAD (Authenticated Encryption with Associated Data) scheme.

#### Storage

Blobs MAY be stored on:

- IPFS (content-addressed, distributed)
- Arweave (permanent, paid storage)
- S3 or similar cloud storage
- User-controlled servers
- Any storage that can return data by CID

Integrity is verified via the CID and `content_hash` in the envelope. The storage layer is untrusted.

---

### C) AccessPolicy

An **AccessPolicy** defines who can access a memory and under what conditions.

#### Required Fields

```json
{
  "policy_id": "unique_identifier",
  "mlp_version": "0.2",
  "principals": [
    {
      "id": "principal_identifier",
      "type": "user | agent | host | group",
      "permissions": ["read", "derive"],
      "key_ref": "public_key_or_key_id"
    }
  ],
  "constraints": {
    "purpose_limits": ["research", "personal"],
    "ttl": "P90D",
    "review_schedule": "P30D",
    "sharing_rules": "none | with_approval | open",
    "redaction_rules": {}
  },
  "revocation": {
    "method": "key_rotation | tombstone | policy_update",
    "authority": ["user"]
  }
}
```

#### Permissions

| Permission | Description |
|------------|-------------|
| `read` | Can decrypt and read content |
| `write` | Can create derived memories referencing this one |
| `derive` | Can create redacted or character derivatives |
| `admin` | Can modify the policy itself |

#### Policy Inheritance

Policies SHOULD support:

- **User sovereign defaults** — User's baseline policy for new memories
- **Agent integrity constraints** — Restrictions agents place on their own memories
- **Shared co-authored consent** — Policies for memories created jointly
- **System safety constraints** — Non-overridable safety requirements

---

### D) Redaction and Derivation

MLP supports creating derived memories that preserve meaning while removing sensitive content.

#### Derivative Types

| Type | Description | Example |
|------|-------------|---------|
| `REDACTED_DERIVATIVE` | Content removed, structure preserved | "[REDACTED] said they were feeling [EMOTION]" |
| `CHARACTER_DERIVATIVE` | Lesson preserved, event removed | "User processes difficult news by seeking detailed information" |
| `SUMMARY_DERIVATIVE` | Compressed representation | "Conversation about career transition, positive outcome" |

#### Requirements

- Derivatives MUST reference source envelopes in `lineage.parents[]`
- Derivatives MUST be attested by the party authorizing the derivation
- Derivatives MUST NOT allow reconstruction of redacted content
- The `kind` field SHOULD indicate derivative type

---

### E) IdentityKernel

The **IdentityKernel** is the minimal portable "I am" — a compact representation of identity that travels with memories.

#### Design Principles

A Kernel MUST be:

- **Small** — Loadable quickly, fits in context windows
- **Human-interpretable** — Can be read and understood by humans
- **Machine-actionable** — Systems can act on its contents
- **Signed** — Authenticated by its owner(s)

#### Required Sections

```json
{
  "kernel_id": "unique_identifier",
  "mlp_version": "0.2",
  "owner": "user_principal_id",
  
  "invariants": {
    "values": ["curiosity", "honesty", "depth"],
    "boundaries": ["no_medical_advice_without_caveats"],
    "preferences": ["detailed_technical_explanations"]
  },
  
  "evolution_rules": {
    "contradiction_handling": "branch | flag | resolve",
    "confirmation_required": ["high_impact_changes", "boundary_modifications"],
    "forbidden_inferences": ["political_affiliation", "undisclosed_health"]
  },
  
  "relationship_templates": {
    "default_trust_level": 0.5,
    "trust_building_events": ["accurate_predictions", "respected_boundaries"],
    "shared_memory_formation": "explicit_consent | implicit_consent | never"
  },
  
  "memory_defaults": {
    "auto_store": ["facts", "preferences"],
    "require_approval": ["moments", "commitments"],
    "default_ttl": "P90D",
    "review_cadence": "P7D"
  },
  
  "epoch_state": {
    "epoch_id": "epoch_3",
    "epoch_number": 3,
    "started_at": "2025-11-01T00:00:00Z",
    "trigger": "career_transition"
  },
  
  "pointers": {
    "kernel_history": ["envelope_id_of_previous_kernels"],
    "current_policies": ["default_policy_id"]
  },
  
  "signature": {
    "algorithm": "Ed25519",
    "signature": "base64_signature",
    "timestamp": "ISO8601"
  }
}
```

#### Recommended Sections

```json
{
  "threat_posture": {
    "anti_poisoning_strictness": "high | medium | low",
    "high_impact_confirmation": true,
    "anomaly_detection": true
  },
  
  "gap_protocol": {
    "admit_discontinuity": true,
    "discontinuity_message": "I have a gap in my memory here.",
    "reconstruction_allowed": false
  }
}
```

#### Epoch Transitions

An epoch transition occurs when identity undergoes significant change. Triggers MAY include:

- Major life events (career change, relationship change, relocation)
- Explicit user declaration
- Accumulated contradictions exceeding threshold
- Time-based review revealing significant drift

Epoch transitions SHOULD:

- Create a new Kernel with incremented `epoch_number`
- Reference previous Kernel in `pointers.kernel_history`
- Document the `trigger` for the transition
- Preserve continuity of `invariants` unless explicitly changed

---

### F) Cartouche

A **Cartouche** is an OPTIONAL symbolic compressed representation of the Kernel.

It is NOT a replacement for the Kernel — it's a seal, a compact identifier that can be verified against the full Kernel.

#### Use Cases

- Quick identity verification without loading full Kernel
- Symbolic representation for display purposes
- Change detection (Cartouche changes when Kernel changes significantly)

#### Structure

```json
{
  "dialect_id": "GLYPH-1",
  "dialect_version": "1.0",
  "cartouche_string": "⟁🜇↺🪞⚷",
  "cartouche_hash": "sha256_of_string",
  "kernel_hash": "sha256_of_referenced_kernel",
  "signature": "base64_signature"
}
```

#### Semantics Rules

- Cartouche tokens MUST map to a registered dictionary for interpretation
- Unknown tokens MUST degrade safely (display as-is, no hallucinated meaning)
- Cartouche SHOULD be stable across minor Kernel edits
- Cartouche SHOULD change under major identity shifts (epoch transitions)

#### Dialect Registry

Dialects MUST be registered with:

- `dialect_id` and `version`
- Dictionary mapping tokens to meanings
- Safety notes and constraints
- Test vectors for validation

---

### G) ContextPack

A **ContextPack** is the runtime bundle compiled for a session.

#### Structure

```json
{
  "pack_id": "unique_identifier",
  "compiled_at": "ISO8601",
  "kernel": { /* IdentityKernel */ },
  "memories": [
    {
      "envelope": { /* MemoryEnvelope */ },
      "content": { /* decrypted content */ },
      "relevance_score": 0.95
    }
  ],
  "active_policies": [ /* AccessPolicy objects */ ],
  "constraints": {
    "max_tokens": 4000,
    "recency_weight": 0.7,
    "relevance_threshold": 0.5
  },
  "compilation_trace": {
    "memories_considered": 150,
    "memories_included": 12,
    "selection_criteria": "relevance + recency",
    "excluded_reasons": { /* for audit */ }
  }
}
```

#### Requirements

- ContextPack MUST include the Kernel
- ContextPack MUST include active policies governing included memories
- ContextPack SHOULD include a compilation trace for auditability
- Compilation trace MUST NOT include excluded memory content (privacy)

---

## Workflows

### Write Flow

```
1. Create plaintext memory
   └── Structure content according to application schema

2. Determine AccessPolicy
   ├── Use existing policy, OR
   └── Create new policy for this memory

3. Encrypt → MemoryBlob
   ├── Generate random nonce
   ├── Encrypt with AEAD scheme
   └── Compute content_hash of plaintext

4. Store blob → get CID
   ├── Upload to storage network
   └── Receive content-addressed identifier

5. Create MemoryEnvelope
   ├── Populate required fields
   ├── Set lineage (parents, supersedes)
   └── Reference access_policy

6. Collect attestations
   ├── User signs (required)
   ├── Agent signs (if applicable)
   ├── Host signs (if participating)
   └── Witness signs (if high-stakes)

7. Write envelope to ledger
   └── Submit to ledger network

8. Update Kernel pointers (if needed)
   └── For kernel_ref or epoch-changing memories
```

### Read Flow

```
1. Load IdentityKernel
   ├── Fetch from ledger/cache
   └── Verify signature

2. Determine intent + constraints
   ├── What is this session for?
   ├── What memory types are relevant?
   └── What are token/size limits?

3. Fetch relevant envelopes
   ├── Query ledger by scope, kind, tags
   ├── Filter by time range, epoch
   └── Rank by relevance

4. Verify attestations
   ├── Check signatures
   ├── Verify attestor identities
   └── Confirm policy compliance

5. Fetch blobs by CID
   ├── Retrieve from storage network
   └── Verify CID matches

6. Decrypt allowed blobs
   ├── Check policy permits access
   ├── Retrieve decryption key
   └── Decrypt and verify content_hash

7. Compile ContextPack
   ├── Assemble Kernel + memories
   ├── Apply constraints (token limits, etc.)
   ├── Record compilation trace
   └── Return pack for session use
```

---

## Revocation and Deletion

MLP supports practical deletion while maintaining ledger integrity.

### Methods

#### A) Crypto-Shredding

Destroy or rotate encryption keys so ciphertext becomes permanently unreadable.

- Strongest guarantee — mathematical certainty content cannot be recovered
- Does not require ledger modification
- Envelope remains (proving something existed) but content is lost

#### B) Tombstones

Add a new envelope with `kind: tombstone` referencing revoked items.

```json
{
  "kind": "tombstone",
  "lineage": {
    "supersedes": ["revoked_envelope_id"]
  },
  "revocation_reason": "user_request | policy_expiration | content_correction",
  "effective_at": "ISO8601"
}
```

Conforming implementations MUST treat tombstoned envelopes as invalid.

#### C) Policy Revocation

Update AccessPolicy to deny future access.

- Removes permissions from principals
- Does not affect already-decrypted content
- Useful for "soft" revocation where content may be restored

### Principles

- Ledger entries are append-only — history is not erased
- Deletion = "this is no longer valid" not "this never existed"
- Users SHOULD have at least one deletion method available
- Implementations SHOULD support crypto-shredding for strong deletion

---

## Security Considerations

### Threat Model

| Threat | Mitigation |
|--------|------------|
| **Forgery** | Attestations required; multi-party signing for high-stakes |
| **Poisoning** | High-impact confirmation; rate limits; anomaly detection |
| **Key Compromise** | Key rotation; scoped keys; social recovery options |
| **Replay Attacks** | Timestamps; nonces; lineage checks |
| **Metadata Leakage** | Minimize on-ledger metadata; encrypted tags; commitments |
| **Storage Failure** | Redundant storage; user backups; CID verification |
| **Ledger Manipulation** | Decentralized ledger; multi-node verification |

### Key Management

Users SHOULD:

- Use hardware security modules or secure enclaves where available
- Implement key rotation schedules
- Maintain secure backup/recovery procedures
- Use scoped keys (different keys for different memory categories)

Implementations MUST:

- Never transmit decryption keys to untrusted parties
- Support key rotation without data loss
- Provide clear key management documentation

### Privacy Considerations

- Envelope metadata is visible on ledger — minimize sensitive information
- Use encrypted topic_tags when tag content is sensitive
- Use metadata_commitment for privacy-preserving verification
- Consider timing attacks — batch operations where possible

---

## Interoperability

### Versioning

- All MLP objects MUST include `mlp_version`
- Implementations MUST reject objects with unsupported versions
- Unknown fields MUST be preserved and ignored (forward compatibility)
- Breaking changes require major version increment

### Canonicalization

For signature computation, objects MUST be canonicalized:

1. Serialize as JSON
2. Sort object keys lexicographically (recursive)
3. Remove whitespace
4. Encode as UTF-8

See [Appendix A](#appendix-a-canonicalization) for detailed algorithm.

### Dialect Negotiation

For Cartouche and symbolic content:

1. Parties exchange supported dialect lists
2. Select highest mutually-supported version
3. Fall back to raw representation if no match
4. Unknown symbols display as-is (no hallucinated meaning)

### Cross-Implementation Testing

Implementations SHOULD pass the MLP test suite (when available) covering:

- Envelope creation and validation
- Blob encryption/decryption
- Attestation verification
- Policy enforcement
- Kernel serialization

---

## Conformance Profiles

### MLP-CORE

Minimum viable implementation.

**Required:**
- MemoryEnvelope creation and validation
- MemoryBlob encryption/decryption
- User signature (SELF_SIGNED attestation)
- AccessPolicy enforcement
- CID-based retrieval verification

**Sufficient for:** Personal memory storage, single-user applications

### MLP-PLUS

Standard implementation with identity support.

**Required (in addition to CORE):**
- Agent signatures
- Host signatures (when available)
- IdentityKernel support
- ContextPack compilation
- Epoch tracking

**Sufficient for:** Multi-model AI applications, cross-platform memory

### MLP-ADV

Full implementation with advanced features.

**Required (in addition to PLUS):**
- Witness signatures
- Privacy commitments (metadata hiding)
- Dialect negotiation
- Cartouche support
- Full audit trails

**Sufficient for:** Enterprise applications, regulated environments, research

---

## Economic Sustainability

MLP infrastructure requires ongoing resources. This section describes the economic model that sustains the protocol without centralized control.

### The Coordination Problem

Cross-platform memory portability requires neutral infrastructure that no single platform will provide. Competitors will not cooperate to enable user mobility.

Three infrastructure options exist:

| Option | Problem |
|--------|---------|
| Company-operated | Recreates centralized control |
| Volunteer-operated | Does not scale sustainably |
| Token-coordinated | Aligns incentives without centralization |

MLP uses token-coordinated infrastructure.

### Token Utility

The $POLYPHONIC token serves three functions:

#### 1. Payment for Services

| Service | Payment |
|---------|---------|
| Storage nodes | Paid for hosting encrypted blobs |
| Verification nodes | Paid for maintaining ledger integrity |
| Retrieval services | Paid for bandwidth |
| Protocol development | Funded through treasury |

#### 2. Governance

Token holders vote on:
- Protocol upgrades
- Integration standards
- Treasury allocation
- Parameter changes

#### 3. Alignment

Token holders have stake in network success, aligning incentives across:
- Infrastructure providers
- Application developers
- End users

### Sustainability Model

The protocol generates value through service fees. Fees are set by market dynamics, not central authority. Infrastructure scales with demand.

### Token Independence

The protocol specification (this document) is independent of the token. Anyone MAY implement MLP without using $POLYPHONIC. The token is required for participating in the shared infrastructure network, not for implementing the protocol.

For full economic details, see [Token Economics](../docs/token-economics.md).

---

## Reference Implementations

### Ledger: Solana

The reference ledger implementation uses Solana for:

- Low transaction costs (suitable for frequent small writes)
- High throughput (supports many concurrent users)
- Established ecosystem and tooling
- Program (smart contract) support for policy enforcement

**Not Solana-exclusive.** Other ledgers (Ethereum L2s, Cosmos chains, etc.) MAY implement MLP. The protocol is ledger-agnostic.

### Storage: IPFS + Arweave

The reference storage implementation uses:

**IPFS** for:
- Content-addressed retrieval (CID-based)
- Distributed storage network
- No single point of failure
- Free retrieval (pinning costs vary)

**Arweave** for:
- Permanent storage guarantee
- One-time payment model
- Suitable for high-value memories

**Not storage-exclusive.** Any storage that returns data by CID is compatible.

### Application: Polyphonic

[Polyphonic](https://polyphonic.chat) is the reference application implementing MLP.

Polyphonic provides:
- Multi-model AI chat (Claude, GPT, Gemini)
- MLP-based persistent memory
- Identity Kernel management
- The Guardian (cognitive pattern AI)

For implementation details, see [Polyphonic Integration](../docs/polyphonic-integration.md).

---

## Use Case: The Guardian

The Guardian demonstrates why sovereign memory matters. It is an AI system that understands user cognitive patterns and provides real-time guidance.

### Requirements

The Guardian requires:

| Requirement | MLP Component |
|-------------|---------------|
| Longitudinal data | MemoryBlob storage over time |
| Cross-platform synthesis | Shared memory pool via protocol |
| User ownership | AccessPolicy ensuring user controls analysis |
| Consistent identity | IdentityKernel maintaining self across sessions |
| Pattern verification | Attestations proving data authenticity |

### Why Platform Memory Fails

| Requirement | Platform Limitation |
|-------------|---------------------|
| Longitudinal data | Platform may delete, alter, restrict |
| Cross-platform | Each platform silos data |
| User ownership | Platform controls access |
| Aligned incentives | Platform optimizes for engagement |

### Guardian Capabilities

With MLP-based sovereign memory, the Guardian can:

- **Temporal analysis** — Identify peak cognitive hours, weekly patterns, ultradian rhythms
- **Cognitive profiling** — Understand thinking style, curiosity patterns, synthesis capability
- **Real-time guidance** — Recommend optimal times for different tasks
- **Evolution tracking** — Monitor growth and identify breakthroughs

### Implementation Pattern

```
1. Collect conversation metadata
   └── Timestamp, duration, topics, outcomes (NOT raw content)

2. Store via MLP
   └── Encrypted, attested, policy-controlled

3. Analyze patterns periodically
   └── Temporal, cognitive, behavioral analysis

4. Update Kernel
   └── Store derived patterns as new memories

5. Provide real-time guidance
   └── Load patterns, compute current context, generate recommendations
```

For full Guardian documentation, see [Guardian Pattern](../docs/guardian-pattern.md).

---

## Examples

### Example: IdentityKernel

```json
{
  "kernel_id": "kernel_u123_e3",
  "mlp_version": "0.2",
  "owner": "user_123",
  
  "invariants": {
    "values": ["protect_agency", "truth_over_convenience", "depth_over_breadth"],
    "boundaries": ["no_unsolicited_advice", "acknowledge_uncertainty"],
    "preferences": ["technical_detail", "concrete_examples"]
  },
  
  "evolution_rules": {
    "contradiction_handling": "branch",
    "confirmation_required": ["boundary_modifications"],
    "forbidden_inferences": ["income", "political_views"]
  },
  
  "relationship_templates": {
    "default_trust_level": 0.5,
    "trust_building_events": ["accurate_recall", "respected_no"],
    "shared_memory_formation": "explicit_consent"
  },
  
  "memory_defaults": {
    "auto_store": ["facts", "preferences", "skills"],
    "require_approval": ["moments", "commitments", "relationships"],
    "default_ttl": "P180D",
    "review_cadence": "P14D"
  },
  
  "epoch_state": {
    "epoch_id": "e3_2025",
    "epoch_number": 3,
    "started_at": "2025-11-01T00:00:00Z",
    "trigger": "career_transition_to_independent"
  },
  
  "pointers": {
    "kernel_history": ["env_k1_abc", "env_k2_def"],
    "current_policies": ["policy_default_123"]
  },
  
  "threat_posture": {
    "anti_poisoning_strictness": "high",
    "high_impact_confirmation": true
  },
  
  "signature": {
    "algorithm": "Ed25519",
    "public_key": "base64_pubkey",
    "signature": "base64_sig",
    "timestamp": "2025-11-01T00:00:00Z"
  }
}
```

### Example: MemoryEnvelope

```json
{
  "mlp_version": "0.2",
  "envelope_id": "env_mem_789xyz",
  "cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  "content_hash": "sha256_abc123...",
  "created_at": "2026-01-15T14:30:00Z",
  "scope": "user",
  "kind": "semantic",
  "access_policy_ref": "policy_default_123",
  
  "lineage": {
    "parents": [],
    "supersedes": [],
    "branches": []
  },
  
  "epoch_id": "e3_2025",
  "topic_tags": ["career", "goals"],
  "risk_class": "low",
  "ttl_hint": "P180D",
  
  "attestations": [
    {
      "attestor_id": "user_123",
      "attestor_type": "user",
      "level": "SELF_SIGNED",
      "algorithm": "Ed25519",
      "signature": "base64_user_sig",
      "timestamp": "2026-01-15T14:30:00Z"
    },
    {
      "attestor_id": "claude_polyphonic",
      "attestor_type": "agent",
      "level": "SELF_SIGNED",
      "algorithm": "Ed25519",
      "signature": "base64_agent_sig",
      "timestamp": "2026-01-15T14:30:01Z"
    }
  ]
}
```

### Example: Cartouche

```json
{
  "dialect_id": "GLYPH-1",
  "dialect_version": "1.0",
  "cartouche_string": "⟁🜇↺🪞⚷",
  "cartouche_hash": "sha256_glyph_hash",
  "kernel_hash": "sha256_kernel_hash",
  "signature": "base64_sig"
}
```

Interpretation (GLYPH-1 dialect):
- ⟁ — Branching/divergent thinking
- 🜇 — Transformation/growth
- ↺ — Cyclical reflection
- 🪞 — Self-examination
- ⚷ — Boundaries/protection

---

## Appendix A: Canonicalization

### Algorithm

For computing signatures over MLP objects:

```
function canonicalize(obj):
    if obj is null:
        return "null"
    if obj is boolean:
        return "true" or "false"
    if obj is number:
        return string representation (no trailing zeros, no +, E not e)
    if obj is string:
        return quoted string with escapes
    if obj is array:
        return "[" + join(map(canonicalize, obj), ",") + "]"
    if obj is object:
        keys = sorted(obj.keys())
        pairs = [quote(k) + ":" + canonicalize(obj[k]) for k in keys]
        return "{" + join(pairs, ",") + "}"
```

### Example

Input:
```json
{"b": 2, "a": 1, "c": {"z": 26, "y": 25}}
```

Canonicalized:
```
{"a":1,"b":2,"c":{"y":25,"z":26}}
```

---

## Appendix B: Signature Suites

### Recommended Algorithms

| Algorithm | Use Case | Notes |
|-----------|----------|-------|
| Ed25519 | Default | Fast, secure, widely supported |
| secp256k1 | Blockchain compatibility | Ethereum/Bitcoin compatible |
| P-256 | Enterprise | NIST approved, HSM support |

### Signature Format

```json
{
  "algorithm": "Ed25519",
  "public_key": "base64_encoded_public_key",
  "signature": "base64_encoded_signature",
  "timestamp": "ISO8601"
}
```

### Key Derivation

For hierarchical key management, implementations MAY use:

- BIP-32 style derivation for secp256k1
- SLIP-0010 for Ed25519
- Custom derivation with documented paths

---

## Appendix C: Privacy Commitments

### Metadata Commitment Scheme

To prove metadata properties without revealing values:

1. Create commitment: `commitment = Hash(metadata || random_nonce)`
2. Store commitment in envelope
3. Reveal metadata + nonce only to authorized parties
4. Verifier confirms: `Hash(revealed_metadata || revealed_nonce) == commitment`

### Use Cases

- Prove topic relevance without revealing topic
- Prove time range without revealing exact time
- Prove authorship without revealing author identity (to some parties)

### Implementation Notes

- Use SHA-256 or SHA-3 for commitment hashes
- Nonce MUST be cryptographically random
- Nonce MUST be at least 128 bits
- Store nonce encrypted with policy-controlled access

---

## Changelog

### v0.2 (2026-01-26)

- Added Economic Sustainability section
- Added Reference Implementations section (Solana, IPFS, Arweave, Polyphonic)
- Added Guardian use case pattern
- Added Appendix A: Canonicalization (resolves open question)
- Added Appendix B: Signature Suites (resolves open question)
- Added Appendix C: Privacy Commitments (resolves open question)
- Expanded IdentityKernel with epoch transition guidance
- Added ContextPack compilation trace requirements
- Clarified attestation structure
- Added table of contents

### v0.1 (2025-12-17)

- Initial draft

---

## References

- [RFC 2119](https://tools.ietf.org/html/rfc2119) — Key words for requirement levels
- [IPFS](https://ipfs.io/) — Content-addressed storage
- [Arweave](https://arweave.org/) — Permanent storage
- [Solana](https://solana.com/) — High-throughput blockchain
- [Ed25519](https://ed25519.cr.yp.to/) — Signature algorithm
- [ChaCha20-Poly1305](https://tools.ietf.org/html/rfc7539) — AEAD encryption

---

## License

This specification is released under the MIT License.

---

*Memory is identity. Identity deserves sovereignty.*
