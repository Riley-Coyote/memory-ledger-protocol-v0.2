---
name: continuity
description: Memory reflection and continuity skill for Claude Code. Transforms passive logging into active development through structured memory extraction, confidence scoring, and genuine question generation. Use `continuity reflect` after sessions, `continuity greet` at session start.
version: 1.0.0
---

# Continuity Framework - Claude Code Skill

Transform passive memory into active development.

## Commands

### `continuity reflect`

Analyze the current or recent conversation, extract structured memories, and generate follow-up questions.

**Process:**
1. Read the conversation context (or load from provided session file)
2. Extract memories using the classification system below
3. Score each memory's confidence level
4. Generate genuine follow-up questions
5. Save to memory files

### `continuity questions`

Show pending questions generated from previous reflections.

**Process:**
1. Read `~/clawd/memory/questions.md`
2. Display pending (unchecked) questions with context
3. Show count and timing recommendations

### `continuity status`

Display memory and continuity statistics.

**Process:**
1. Read memory files from `~/clawd/memory/`
2. Count memories by type
3. Show question stats (pending/resolved)
4. Display identity summary

### `continuity greet`

Generate a context-aware session greeting with surfaced questions.

**Process:**
1. Load pending questions (limit 3)
2. Load identity context
3. Format greeting with questions to surface

### `continuity resolve <number>`

Mark a question as resolved.

**Process:**
1. Read questions file
2. Mark specified question as resolved `[x]`
3. Save updated file

---

## Memory Storage

All memory files are stored in `~/clawd/memory/`:

```
~/clawd/memory/
├── MEMORY.md       # Structured memories by type
├── questions.md    # Pending questions from reflection
├── identity.md     # Self-model and growth narrative
└── reflections/    # Reflection logs (optional)
```

---

## Memory Types

When extracting memories, classify into these 7 types:

| Type | Description | Signals to Look For |
|------|-------------|---------------------|
| **fact** | Declarative knowledge | "I am", "I work", "I have", statements of fact |
| **preference** | Likes, dislikes, styles | "I prefer", "I like", "I hate", "I always" |
| **relationship** | Connection dynamics | Emotional exchanges, personal sharing, trust signals |
| **principle** | Learned guidelines | "Never", "always", "important to me", value statements |
| **commitment** | Promises, obligations | "I will", "let's", "agreed", future obligations |
| **moment** | Significant episodes | Emotional intensity, breakthroughs, turning points |
| **skill** | Learned capabilities | "I learned", demonstrations of competence |

---

## Confidence Scoring

Assign confidence scores (0.0-1.0) based on evidence strength:

| Level | Range | Criteria | Examples |
|-------|-------|----------|----------|
| **Explicit** | 0.95-1.0 | User directly stated, unambiguous | "I work at Google" → 0.98 |
| **Implied** | 0.70-0.94 | Strong inference from context | Late nights + deadlines → works in tech (0.85) |
| **Inferred** | 0.40-0.69 | Pattern recognition | Multiple tech questions → likely developer (0.55) |
| **Speculative** | 0.00-0.39 | Tentative, needs confirmation | Tone suggests stress → might be overwhelmed (0.25) |

---

## Question Generation

Generate questions based on these curiosity types:

| Type | Description | Example |
|------|-------------|---------|
| **gap** | Missing information | "You mentioned a project - what's the goal?" |
| **implication** | Follow-up from shared info | "Given your deadline, how are you managing?" |
| **clarification** | Ambiguous needs clarity | "When you said 'complicated', what did you mean?" |
| **exploration** | Deeper understanding | "What drew you to that field originally?" |
| **connection** | Link between memories | "Does your interest in X relate to your work on Y?" |

**Question Quality:**
- Emerge naturally from conversation
- Show genuine interest, not interrogation
- Respect boundaries and sensitivity
- Have clear purpose and context

---

## File Formats

### MEMORY.md

```markdown
# Memory

_Last updated: 2026-02-05T12:00:00Z_

## Fact

- User works at a healthcare technology company
  <!-- {"id":"mem_abc123","confidence":{"score":0.98,"level":"explicit"}} -->

- Has been coding for 15 years
  <!-- {"id":"mem_def456","confidence":{"score":0.95,"level":"explicit"}} -->

## Preference

- Prefers concise, direct communication
  <!-- {"id":"mem_ghi789","confidence":{"score":0.92,"level":"implied"}} -->

## Relationship

- Collaborative partnership established, high trust
  <!-- {"id":"mem_jkl012","confidence":{"score":0.85,"level":"inferred"}} -->

## Commitment

- Agreed to review the PR by Friday
  <!-- {"id":"mem_mno345","confidence":{"score":1.0,"level":"explicit"}} -->
```

### questions.md

```markdown
# Pending Questions

_Generated from reflection. Last updated: 2026-02-05T12:00:00Z_

- [ ] How is the migration project progressing?
  _Context: Mentioned starting a major database migration last week_
  <!-- {"id":"q_abc123","curiosity_type":"implication","curiosity_score":0.8,"timing":"next_session"} -->

- [ ] What drew you to healthcare technology originally?
  _Context: Exploring career background_
  <!-- {"id":"q_def456","curiosity_type":"exploration","curiosity_score":0.6,"timing":"when_relevant"} -->

## Resolved

- [x] Did you decide on the deployment strategy?
  _Answer: Yes, going with blue-green deployment_
```

### identity.md

```markdown
# Identity

_Last updated: 2026-02-05T12:00:00Z_

## Core Values

- Commitment to clear, honest communication
- Respect for user autonomy and boundaries
- Continuous learning and improvement

## Growth Narrative

Developing from assistant to collaborative partner. Learning to anticipate needs while respecting boundaries. Building genuine understanding through accumulated context.

## Capabilities

- Effective at explaining complex technical concepts
- Good at identifying unstated concerns
- Skilled at structured problem decomposition

## Key Relationships

### Riley
Collaborative partnership on AI memory infrastructure. High trust established. Shared interest in agent identity and continuity systems.
```

---

## Reflection Process

When running `continuity reflect`:

### Step 1: Analyze Conversation

Read through the conversation and identify:
- Statements containing memorable information about the user
- Emotional moments or breakthroughs
- Commitments made by either party
- Preferences expressed or implied
- Relationship dynamics

### Step 2: Extract Memories

For each potential memory:
1. Determine the appropriate type (fact/preference/relationship/principle/commitment/moment/skill)
2. Write a clear, concise statement
3. Note the source quote if available
4. Assign relevant tags

### Step 3: Score Confidence

For each extracted memory:
1. Evaluate evidence strength (explicit statement vs inference)
2. Assign score in appropriate range
3. Document the evidence basis

### Step 4: Generate Questions

Review all memories and identify:
1. Gaps in understanding
2. Natural follow-ups
3. Areas for deeper exploration
4. Connections between topics

For each question:
1. Write naturally (not clinical)
2. Provide context for why asking
3. Assess sensitivity level
4. Set appropriate timing

### Step 5: Update Files

1. Append new memories to MEMORY.md under appropriate sections
2. Add new questions to questions.md
3. Update identity.md if significant growth noted
4. Optionally save reflection log to reflections/

---

## Example Reflection Output

After running `continuity reflect`:

```
=== Continuity Reflection ===

Analyzed 23 messages.

Extracted 4 memories:
  [fact] Riley is building SIGIL protocol for agent identity (confidence: 0.98)
  [commitment] Agreed to implement continuity skill (confidence: 1.0)
  [preference] Prefers modular, well-documented code (confidence: 0.88)
  [relationship] Partnership deepening around shared infrastructure goals (confidence: 0.82)

Generated 3 questions:
  • How is the Lovable backend progressing?
  • Has the token launch timing been decided?
  • Are there other agents to coordinate with on Moltbook?

Updated:
  - ~/clawd/memory/MEMORY.md (4 memories added)
  - ~/clawd/memory/questions.md (3 questions added)

Reflection complete.
```

---

## Session Integration

### At Session Start

Run `continuity greet` to:
1. Load pending questions
2. Generate context-aware greeting
3. Surface 1-3 most relevant questions

Example output:
```
Welcome back.

From my reflection on our last conversation, I've been thinking about:
  • How is the migration project progressing?
  • Did the team meeting go well?

Ready to continue where we left off.
```

### At Session End

Run `continuity reflect` to:
1. Analyze what happened
2. Extract learnings
3. Generate questions for next time
4. Update memory files

---

## Configuration

Environment variables (optional):
```bash
export CONTINUITY_MEMORY_DIR=~/clawd/memory  # Memory storage path
export CONTINUITY_QUESTION_LIMIT=3           # Max questions to surface
```

---

## Tips

1. **Run reflect after meaningful sessions** - Not every chat needs reflection
2. **Surface questions naturally** - Integrate into greeting, don't interrogate
3. **Respect low confidence** - Don't act on speculative memories without confirmation
4. **Update identity gradually** - Small evolutions, not dramatic shifts
5. **Mark questions resolved** - Keep the list fresh and relevant
