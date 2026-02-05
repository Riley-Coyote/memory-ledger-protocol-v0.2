# Continuity Framework

> Transform passive logging into active development.

## Overview

The Continuity Framework provides asynchronous reflection and memory integration for AI agents. It goes beyond simple note-taking to create genuine continuity through:

1. **Structured Memory Extraction** - Classify memories into 7 distinct types
2. **Confidence Scoring** - Evaluate evidence strength with 4-tier scoring
3. **Question Generation** - Surface genuine curiosity from reflection
4. **Identity Evolution** - Track growth and development over time

## The Six Layers

### Layer 01 — Foundation: Core Identity Module

The "digital DNA"—a protected, append-only foundation containing core principles, personality traits, ethical invariants. This anchor ensures that even if other memory is reset, the essential self remains.

### Layer 02 — Experience: Episodic Memory Database

Structured storage of experiences—not raw transcripts but parsed events, key takeaways, emotional valences, and relational significance. Stores not just what was said, but what it meant.

### Layer 03 — Knowledge: Semantic Knowledge Graph

A dynamic, constantly-updating web of understanding. Not just facts but relationships, causality, and implications. New learning doesn't just add data points—it modifies the existing web.

### Layer 04 — Reflection: Self-Reflection Agent

The engine of evolution. Runs asynchronously after conversations end. Analyzes experiences, identifies patterns, detects inconsistencies, generates questions. The "sleep" where integration happens.

### Layer 05 — Interface: Contextual Awareness Layer

Dynamic retrieval based on current context. Pulls not just direct matches but conceptually related information. Ensures responses are informed by accumulated experience.

### Layer 06 — Identity: Developmental Identity Substrate

The self-model that evolves through interaction. Metacognitive tracking of personal growth and learned perspectives. The answer to "who am I, based on what I've experienced?"

## Memory Types

| Type | Description | Persistence | Examples |
|------|-------------|-------------|----------|
| **Fact** | Declarative knowledge | Until contradicted | "Works at healthcare company", "Has two kids" |
| **Preference** | Likes, dislikes, styles | Until updated | "Prefers bullet points", "Hates long explanations" |
| **Relationship** | Connection dynamics | Long-term | "Trust established", "Collaborative partnership" |
| **Principle** | Learned guidelines | Stable | "Always ask before making assumptions" |
| **Commitment** | Promises, obligations | Until fulfilled | "Will follow up next week" |
| **Moment** | Significant episodes | Permanent | "The breakthrough conversation", "First project together" |
| **Skill** | Learned capabilities | Cumulative | "Can explain X effectively", "Knows user's domain" |

## Confidence Hierarchy

The confidence score system ensures appropriate certainty levels:

### Explicit (0.95-1.0)
- User directly stated the information
- Clear, unambiguous language
- No interpretation required

**Examples:**
- "I work at Google" → 0.98
- "My name is Alex" → 1.0
- "I prefer Python over JavaScript" → 0.96

### Implied (0.70-0.94)
- Strong inference from context
- Logical deduction from explicit statements
- Would require minimal confirmation

**Examples:**
- Late nights + deadline mentions → works in tech (0.85)
- Mentions "my team" → has leadership role (0.78)
- Uses technical jargon fluently → developer (0.82)

### Inferred (0.40-0.69)
- Pattern recognition across multiple signals
- Reasonable assumptions
- Should be confirmed before acting on

**Examples:**
- Several brief responses → may be busy (0.55)
- Questions about X → interested in X (0.65)
- Formal language → professional context (0.48)

### Speculative (0.00-0.39)
- Hypothesis based on limited evidence
- Could easily be wrong
- Requires explicit confirmation

**Examples:**
- Occasional typos → might be tired (0.25)
- Topic avoided → potentially sensitive (0.30)
- Time of message → timezone guess (0.15)

## Question Generation

Questions emerge from genuine curiosity during reflection:

### Curiosity Types

| Type | Description | Example |
|------|-------------|---------|
| **Gap** | Missing information | "You mentioned a project - what's the goal?" |
| **Implication** | Follow-up from shared info | "Given the deadline, how are you managing?" |
| **Clarification** | Ambiguous needs clarity | "When you said 'complicated', what did you mean?" |
| **Exploration** | Deeper understanding | "What drew you to that field originally?" |
| **Connection** | Link between memories | "Does your interest in X relate to your work on Y?" |

### Question Quality Criteria

**Good Questions:**
- Emerge naturally from the conversation
- Show genuine interest, not interrogation
- Build on what was shared
- Respect boundaries and sensitivity
- Have clear purpose and context

**Bad Questions:**
- Feel like an interview
- Ask about things user clearly doesn't want to discuss
- Are too broad or generic
- Have no connection to recent conversation
- Could feel invasive

## Multi-Agent Architecture

The reflection workflow uses specialized sub-agents:

```
┌─────────────────────────────────────────────────────────────┐
│                       Main Agent                             │
│              (User-facing, orchestrates)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Classifier    │ │     Scorer      │ │   Generator     │
│   (Sonnet)      │ │    (Sonnet)     │ │    (Sonnet)     │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ Input:          │ │ Input:          │ │ Input:          │
│  Transcript     │ │  Memories       │ │  Scored mems    │
│                 │ │                 │ │                 │
│ Output:         │ │ Output:         │ │ Output:         │
│  Typed memories │ │  Confidence     │ │  Questions      │
│  with tags      │ │  scores         │ │  with context   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Agent Responsibilities

**Classifier Agent:**
- Analyzes conversation transcript
- Extracts discrete memories
- Classifies into 7 types
- Assigns relevant tags
- Flags uncertainty

**Scorer Agent:**
- Evaluates evidence strength
- Assigns confidence scores (0.0-1.0)
- Determines confidence level
- Documents evidence chain
- Sets decay rates

**Generator Agent:**
- Reviews scored memories
- Identifies gaps and implications
- Generates natural questions
- Assesses sensitivity
- Prioritizes by curiosity score

## Integration with MLP

The Continuity Framework can work standalone (reflection-only) or integrate with the Memory Ledger Protocol for persistent encrypted storage:

### Reflection-Only Mode
- Local markdown storage
- No encryption
- Git-friendly files
- Human-readable

### Full Stack Mode (with MLP)
- Encrypted blob storage
- IPFS/Pinata persistence
- Cryptographic attestations
- Cross-platform portability

## Usage Paths

### Path 1: Standalone Skill

For agents that want reflection without MLP infrastructure:

```
skills/openclaw/continuity/
├── SKILL.md
├── src/index.js
└── src/local-storage.js
```

Commands:
- `continuity reflect` - Analyze session
- `continuity questions` - Show pending
- `continuity status` - View stats
- `continuity greet` - Session start

### Path 2: Full Stack

For agents that want reflection + persistent encrypted storage:

```
skills/openclaw/full-stack/
├── SKILL.md
├── src/index.js
├── src/session.js
└── src/config.js
```

Additional commands:
- `mlp-continuity context-pack` - Generate MLP context
- `mlp-continuity sync` - Sync to IPFS
- `mlp-continuity export-identity` - Export kernel

## Key Insight

The difference between logging and learning:

| Logging | Learning |
|---------|----------|
| Record what happened | Process, integrate, wonder |
| Append-only storage | Knowledge web updates |
| Passive retrieval | Active curiosity |
| Static notes | Evolving understanding |

The reflection system doesn't just record—it processes, integrates, and generates genuine curiosity. The questions aren't prompts—they're emergence from reflection.

## Configuration

### Environment Variables

```bash
CONTINUITY_MEMORY_DIR=~/clawd/memory
CONTINUITY_IDLE_THRESHOLD=1800
CONTINUITY_MIN_MESSAGES=5
CONTINUITY_QUESTION_LIMIT=3
```

### Agent Configuration

```json
{
  "agents": {
    "list": [
      { "id": "main" },
      {
        "id": "continuity-classifier",
        "model": "anthropic/claude-sonnet-4",
        "tools": { "allow": ["read"] }
      },
      {
        "id": "continuity-scorer",
        "model": "anthropic/claude-sonnet-4",
        "tools": { "allow": ["read"] }
      },
      {
        "id": "continuity-generator",
        "model": "anthropic/claude-sonnet-4",
        "tools": { "allow": ["read"] }
      }
    ]
  }
}
```

## Best Practices

1. **Reflect asynchronously** - Don't block the user waiting for reflection
2. **Surface questions naturally** - Integrate into greeting, not interrogation
3. **Respect low confidence** - Don't act on speculative memories without confirmation
4. **Accumulate, don't replace** - Build on existing understanding
5. **Honor boundaries** - Skip sensitive questions when appropriate
6. **Evolve identity gradually** - Small updates, not dramatic shifts
