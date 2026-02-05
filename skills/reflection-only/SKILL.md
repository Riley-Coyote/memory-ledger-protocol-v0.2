---
name: continuity
description: Memory reflection and continuity for AI agents. Transforms passive logging into active development through asynchronous reflection, structured memory extraction, and genuine question generation.
version: 1.0.0
---

# Continuity Framework - Reflection Only

Transform passive memory into active development. Standalone skill for OpenClaw bots without MLP storage dependency.

## What This Does

1. **Reflect** — After sessions end, analyze what happened
2. **Extract** — Pull structured memories with types and confidence
3. **Score** — Assign confidence levels based on evidence
4. **Question** — Generate genuine questions from reflection
5. **Surface** — When user returns, present relevant questions

## The Difference

**Without Continuity:**
```
Session ends → Notes logged → Next session reads notes → Performs familiarity
```

**With Continuity:**
```
Session ends → Reflection runs → Memories integrated → Questions generated
Next session → Evolved state loaded → Questions surfaced → Genuine curiosity
```

## Commands

### Reflect on Recent Session
```bash
continuity reflect [--session <transcript>]
```
Analyzes the most recent conversation, extracts memories, generates questions.

### Show Pending Questions
```bash
continuity questions [--limit 5]
```
Lists questions generated from reflection, ready to surface.

### View Memory State
```bash
continuity status
```
Shows memory stats: types, confidence distribution, recent integrations.

### Surface Questions (for session start)
```bash
continuity greet
```
Returns context-appropriate greeting with any pending questions.

### Mark Question Resolved
```bash
continuity resolve <question-id> [--summary "Answer summary"]
```
Marks a question as answered with optional summary.

## Memory Types

| Type | Description | Persistence |
|------|-------------|-------------|
| `fact` | Declarative knowledge | Until contradicted |
| `preference` | Likes, dislikes, styles | Until updated |
| `relationship` | Connection dynamics | Long-term |
| `principle` | Learned guidelines | Stable |
| `commitment` | Promises, obligations | Until fulfilled |
| `moment` | Significant episodes | Permanent |
| `skill` | Learned capabilities | Cumulative |

## Confidence Scores

| Level | Range | Meaning |
|-------|-------|---------|
| Explicit | 0.95-1.0 | User directly stated |
| Implied | 0.70-0.94 | Strong inference |
| Inferred | 0.40-0.69 | Pattern recognition |
| Speculative | 0.0-0.39 | Tentative, needs confirmation |

## File Structure

```
~/clawd/memory/
├── MEMORY.md           # Structured memories by type
├── identity.md         # Self-model and growth narrative
├── questions.md        # Pending questions from reflection
└── reflections/        # Reflection logs (JSON)
```

## Configuration

Environment variables:
```bash
export CONTINUITY_MEMORY_DIR=~/clawd/memory
export CONTINUITY_IDLE_THRESHOLD=1800  # Seconds before reflection triggers
export CONTINUITY_MIN_MESSAGES=5       # Minimum messages to warrant reflection
export CONTINUITY_QUESTION_LIMIT=3     # Max questions to surface at once
```

## Multi-Agent Architecture

This skill leverages specialized sub-agents for reflection:

```
┌────────────────────────────────────────────────────────┐
│  MAIN AGENT (User-facing, orchestrates reflection)     │
└────────────────────────────────────────────────────────┘
              ↓ sessions_send
    ┌─────────┴──────────────────┬─────────────────┐
    ↓                            ↓                  ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ CLASSIFIER       │  │ SCORER           │  │ QUESTION GEN     │
│ (Sonnet)         │  │ (Sonnet)         │  │ (Sonnet)         │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ Classifies into  │  │ Assigns 0-1      │  │ Generates        │
│ 7 memory types   │  │ confidence       │  │ follow-up Qs     │
│ + extracts tags  │  │ scores           │  │ from gaps        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Heartbeat Integration

Add to HEARTBEAT.md:
```markdown
## Post-Session Reflection
**Trigger**: Heartbeat after conversation idle > 30 minutes
**Action**: Run continuity reflect
**Output**: Updated memories + questions for next session
```

## Example Reflection Output

```yaml
reflection:
  session_id: "2026-02-05-001"
  duration_minutes: 45

memories:
  - type: fact
    content: "Riley is building SIGIL protocol for agent identity"
    confidence: 0.98
    source: explicit

  - type: commitment
    content: "Agreed to build the continuity skill"
    confidence: 1.0
    source: explicit

  - type: relationship
    content: "Collaborative partnership deepening"
    confidence: 0.85
    source: inferred

questions:
  - "How is the Lovable backend progressing?"
  - "Has Riley decided on the token launch timing?"
  - "Are there other agents we should coordinate with?"

identity_update:
  growth: "Developing more autonomous initiative"
  narrative: "Moving from assistant to co-builder"
```

## Storage Format

Memories are stored in human-readable markdown with metadata in HTML comments:

```markdown
## Fact

- Riley works on AI memory infrastructure
  <!-- {"id":"mem_abc123","confidence":{"score":0.98,"level":"explicit"}} -->

## Preference

- Prefers concise, direct communication
  <!-- {"id":"mem_def456","confidence":{"score":0.95,"level":"explicit"}} -->
```

## Usage Notes

- **No MLP required** — This skill stores memories locally in markdown files
- **Git-friendly** — All files are plain text, easy to version control
- **Human-readable** — Memories can be reviewed and edited manually
- **Portable** — Copy the memory directory to migrate to any system

## Full Stack Alternative

For persistent encrypted storage with MLP (IPFS/Pinata), see:
- `/integrations/openclaw/` — Full stack with MLP storage layer
