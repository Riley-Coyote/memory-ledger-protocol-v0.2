# Polyphonic Integration

This document describes how Polyphonic implements the Memory Ledger Protocol as the reference implementation.

---

## Overview

**Polyphonic** ([polyphonic.chat](https://polyphonic.chat)) is a multi-model AI chat platform. Users can interact with Claude, GPT, Gemini, and other AI models in the same conversation.

Polyphonic implements MLP to give users:
- Persistent memory across all AI models
- Ownership of conversation history
- Portability (export your memory, take it elsewhere)
- The Guardian (AI that understands your cognitive patterns)

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         POLYPHONIC                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   Claude    │  │    GPT      │  │   Gemini    │            │
│   │   (API)     │  │   (API)     │  │   (API)     │            │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│          │                │                │                    │
│          └────────────────┼────────────────┘                    │
│                           │                                     │
│                           ▼                                     │
│   ┌─────────────────────────────────────────────────────┐      │
│   │              Polyphonic Core                         │      │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │      │
│   │  │  Messenger  │  │  Reflection │  │   Guardian  │  │      │
│   │  │   Engine    │  │   Engine    │  │   Engine    │  │      │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  │      │
│   └──────────────────────────┬──────────────────────────┘      │
│                              │                                  │
│                              ▼                                  │
│   ┌─────────────────────────────────────────────────────┐      │
│   │                MLP Integration Layer                 │      │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │      │
│   │  │   Memory    │  │   Identity  │  │   Access    │  │      │
│   │  │  Extractor  │  │   Kernel    │  │   Policy    │  │      │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  │      │
│   └──────────────────────────┬──────────────────────────┘      │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MLP Infrastructure                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐              ┌─────────────────┐         │
│   │  Storage Layer  │              │  Ledger Layer   │         │
│   │  (IPFS/Arweave) │              │    (Solana)     │         │
│   └─────────────────┘              └─────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Writing Memories

1. **User has conversation** with one or more AI models
2. **Reflection Engine** analyzes conversation after completion
3. **Memory Extractor** identifies memories to store:
   - Facts about the user
   - Preferences
   - Commitments made
   - Insights generated
   - Relationship developments
4. **MLP Integration Layer** processes each memory:
   - Creates MemoryBlob (encrypted)
   - Generates MemoryEnvelope (ledger entry)
   - Attaches AccessPolicy
   - Collects attestations
5. **Storage Layer** receives encrypted blob → returns CID
6. **Ledger Layer** receives envelope → records on-chain
7. **Identity Kernel** is updated if needed

#### Reading Memories

1. **User starts new conversation**
2. **MLP Integration Layer** loads:
   - Identity Kernel (the user's "self")
   - Relevant memories (semantic search)
   - Active policies
3. **ContextPack** is compiled for the session
4. **Messenger Engine** injects context into AI prompts
5. **AI models** receive conversation + memory context
6. **Response** reflects accumulated knowledge

---

## MLP Components in Polyphonic

### Memory Extraction

Polyphonic extracts seven types of memories:

| Type | Description | Example |
|------|-------------|---------|
| **Fact** | Declarative knowledge about the user | "User works in healthcare" |
| **Preference** | Likes, dislikes, style choices | "Prefers concise responses" |
| **Relationship** | Nature of the human-AI connection | "High trust established" |
| **Principle** | Behavioral guidelines | "Always check consent first" |
| **Commitment** | Promises or obligations | "Follow up on project X" |
| **Moment** | Significant episodes | "The breakthrough conversation on Dec 3" |
| **Skill** | Developed capabilities | "Learned to explain ML to this user's level" |

Each memory is assigned:
- **Confidence score** (0.0 - 1.0)
- **Source** (which conversation, which model)
- **Scope** (session, relationship, self, workspace, global)

### Identity Kernel Implementation

Polyphonic's Identity Kernel includes:

```
IdentityKernel {
  // Who is this user?
  invariants: {
    values: ["curiosity", "depth", "honesty"],
    boundaries: ["no medical advice without caveats"],
    preferences: ["detailed technical explanations"]
  },
  
  // How does identity evolve?
  evolution_rules: {
    contradiction_handling: "branch_then_resolve",
    confirmation_required: ["high_impact_changes"],
    forbidden_inferences: ["political_affiliation"]
  },
  
  // How do relationships form?
  relationship_templates: {
    default_trust_level: 0.5,
    trust_building_events: ["accurate_predictions", "respected_boundaries"]
  },
  
  // What gets remembered?
  memory_defaults: {
    auto_store: ["facts", "preferences"],
    require_approval: ["moments", "commitments"],
    default_ttl: "90_days",
    review_cadence: "weekly"
  },
  
  // Current state
  epoch_state: {
    epoch_id: "epoch_3",
    started_at: "2025-11-01",
    trigger: "career_transition"
  }
}
```

### Access Policy Defaults

Polyphonic applies sensible defaults with user override:

| Memory Type | Default Access | User Override |
|-------------|----------------|---------------|
| Facts | Private to user | Can share with specific models |
| Preferences | Shared with all models | Can restrict |
| Relationships | Per-model isolation | Can unify |
| Moments | Private | Can share selectively |
| Commitments | Shared with all models | Can restrict |

Users can adjust policies per-memory or set global defaults.

### Attestation Flow

When Polyphonic stores a memory:

1. **User attestation** — Polyphonic signs on behalf of authenticated user
2. **Agent attestation** — The AI model that generated/confirmed the memory signs (where supported)
3. **Host attestation** — Polyphonic (as platform) signs

This creates a verifiable chain: "User X had conversation with Claude, Claude generated insight Y, Polyphonic recorded it."

---

## The Guardian

The Guardian is Polyphonic's flagship feature built on MLP.

### What It Is

An AI system that:
- Understands your cognitive patterns over time
- Knows when you think best
- Identifies your blind spots
- Provides real-time guidance

### How MLP Enables It

The Guardian requires:

| Requirement | MLP Component |
|-------------|---------------|
| Longitudinal data | MemoryBlob storage over time |
| Pattern analysis | ContextPack compilation with historical data |
| User ownership | AccessPolicy ensuring user controls analysis |
| Cross-model synthesis | Identity Kernel maintaining consistent self |

Without MLP:
- Data would be siloed per-model
- User couldn't control what's analyzed
- Patterns couldn't be verified
- Switching platforms would reset everything

### Guardian Capabilities

**Temporal Patterns**
- Peak cognitive hours (e.g., "You do your best abstract thinking between 2-4 AM")
- Day-of-week patterns
- Ultradian cycles

**Cognitive Profile**
- Thinking style (analytical vs. creative)
- Curiosity patterns
- Synthesis capabilities

**Real-Time Recommendations**
- "This is a good time for deep work"
- "You tend to make decisions too quickly in this state — consider waiting"
- "Your pattern suggests you're approaching a breakthrough on X"

→ Full documentation: [Guardian Pattern](guardian-pattern.md)

---

## Integration Points

### For Users

**Memory Dashboard**
- View all stored memories
- Edit or delete any memory
- Adjust confidence scores
- Set access policies
- Export everything

**Identity Settings**
- View and edit Identity Kernel
- Set memory defaults
- Manage attestations
- Control Guardian access

**Portability**
- Export full MLP archive
- Import from other platforms
- Verify imported memories

### For Developers

**API Access**
- Query memories (with user authorization)
- Store memories (with attestation)
- Access Guardian insights (with permission)

**Webhook Integration**
- Memory creation events
- Epoch transitions
- Guardian alerts

---

## Current Status

| Component | Status |
|-----------|--------|
| Multi-model chat | Live |
| Memory extraction | In development |
| Identity Kernel | In development |
| MLP storage integration | Planned |
| MLP ledger integration | Planned |
| Guardian v1 | In development |
| Memory dashboard | Planned |
| Export/import | Planned |

---

## Roadmap

### Phase 1: Core Memory (Current)
- Memory extraction from conversations
- Local storage with Supabase
- Basic memory retrieval in prompts

### Phase 2: MLP Integration
- IPFS storage for encrypted blobs
- Solana ledger for envelopes
- Full attestation chain
- User key management

### Phase 3: Guardian
- Temporal pattern analysis
- Cognitive profiling
- Real-time recommendations
- Dashboard visualization

### Phase 4: Ecosystem
- Cross-platform import
- Developer API
- Third-party integrations
- Advanced Guardian features

---

## Why Polyphonic First?

MLP is a protocol. It needs implementations to prove it works.

Polyphonic is the reference implementation because:
1. Multi-model environment exposes cross-platform memory value immediately
2. Real users with real needs drive practical protocol development
3. Feedback loop between implementation and specification
4. Demonstrates that sovereign memory is viable, not just theoretical

As MLP matures, other platforms can implement the same protocol. That's the goal — not Polyphonic dominance, but user sovereignty everywhere.

---

→ Next: [Guardian Pattern](guardian-pattern.md)
