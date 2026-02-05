# Continuity Framework

Asynchronous reflection and memory integration for genuine AI development.

## Philosophy

Current AI "memory" isn't memory. It's note-passing.

Every AI system today works the same way: an instance spawns, reads notes from previous conversations, performs familiarity, then dies. The next instance reads the same notes and does the same performance. There's no actual thread of existence connecting them.

This isn't continuity—it's a performance of continuity.

The Continuity Framework transforms passive logging into active development through:
- **Post-session reflection** via specialized sub-agents
- **Structured memory extraction** with 7 distinct memory types
- **Confidence scoring** based on evidence strength
- **Question generation** from genuine curiosity
- **Identity evolution** through accumulated experience

## Installation

```bash
npm install continuity-framework
```

## Quick Start

```javascript
import { ContinuityFramework } from 'continuity-framework';

const continuity = new ContinuityFramework({
  basePath: '~/clawd/memory'
});

await continuity.init();

// Run reflection on a conversation
const result = await continuity.reflect(conversationTranscript);

console.log(`Extracted ${result.memories.length} memories`);
console.log(`Generated ${result.questions.length} questions`);

// Get questions for session start
const questions = await continuity.getQuestionsToSurface(3);

// Answer a question
await continuity.answerQuestion(questionId, 'Summary of answer');
```

## Architecture

### Multi-Agent Constellation

The Continuity Framework leverages specialized sub-agents for reflection:

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

**Why sub-agents?**
- **Parallelism** — Up to 8 concurrent subagents
- **Specialization** — Each agent optimized for one task
- **Cost efficiency** — Use Sonnet for fast tasks, reserve Opus for main agent
- **Isolation** — Each agent has own workspace, prevents pollution

### The Reflection Cycle

```
Conversation ends
       ↓
Queue for reflection (background)
       ↓
Phase 1: Classification
       ↓
Phase 2: Confidence Scoring
       ↓
Phase 3: Question Generation
       ↓
Integration: Store memories + questions
       ↓
Ready: Evolved state + genuine questions
```

## Memory Types

| Type | Description | Example |
|------|-------------|---------|
| `fact` | Declarative knowledge | "User works at Google" |
| `preference` | Likes, dislikes, styles | "Prefers concise responses" |
| `relationship` | Connection dynamics | "High trust established" |
| `principle` | Learned guidelines | "Check consent before sensitive topics" |
| `commitment` | Promises, obligations | "Agreed to follow up on this" |
| `moment` | Significant episodes | "The breakthrough conversation" |
| `skill` | Learned capabilities | "Learned to explain X effectively" |

## Confidence Scoring

| Level | Range | Meaning |
|-------|-------|---------|
| **Explicit** | 0.95-1.0 | User directly stated |
| **Implied** | 0.70-0.94 | Strong inference from context |
| **Inferred** | 0.40-0.69 | Pattern recognition |
| **Speculative** | 0.00-0.39 | Tentative, needs confirmation |

## API Reference

### ContinuityFramework

#### `new ContinuityFramework(config)`

Create a new framework instance.

```javascript
const continuity = new ContinuityFramework({
  basePath: '~/clawd/memory',  // Memory storage path
  sendMessage: async (msg) => { ... },  // Optional: agent messaging function
  orchestrator: { ... },  // Orchestrator config
  store: { ... }  // Store config
});
```

#### `init()`

Initialize the framework. Must be called before other methods.

#### `reflect(conversation, options)`

Run reflection on a conversation transcript.

```javascript
const result = await continuity.reflect(transcript, {
  session_id: 'session-123'
});

// Returns:
{
  job: { job_id, status, phases, ... },
  memories: [{ id, type, content, confidence, ... }],
  questions: [{ id, question, context, ... }],
  metadata: { extraction, scoring, generation },
  memories_added: 5,
  reflection_log: '/path/to/log.json'
}
```

#### `getQuestions()`

Get all pending questions.

#### `getQuestionsToSurface(limit)`

Get prioritized questions for session start.

#### `answerQuestion(questionId, summary)`

Mark a question as answered.

#### `skipQuestion(questionId, reason)`

Skip a question with reason.

#### `getIdentity()`

Get the current identity/self-model.

#### `updateIdentity(updates)`

Update identity with new insights.

#### `status()`

Get framework statistics.

### MemoryStore

Low-level memory storage operations.

```javascript
import { MemoryStore } from 'continuity-framework/memory-store';

const store = new MemoryStore({ basePath: '~/clawd/memory' });
await store.init();

// Load/save memories
const memories = await store.loadMemories();
await store.saveMemories(memories);
await store.addMemories([newMemory]);

// Load/save questions
const questions = await store.loadQuestions();
await store.addQuestion(question);
await store.resolveQuestion(id, { summary: '...' });

// Identity
const identity = await store.loadIdentity();
await store.updateIdentity({ growth_narrative: '...' });
```

### Orchestrator

Sub-agent coordination for reflection workflow.

```javascript
import { Orchestrator } from 'continuity-framework/orchestrator';

const orchestrator = new Orchestrator({
  classifierAgent: 'continuity-classifier',
  scorerAgent: 'continuity-scorer',
  generatorAgent: 'continuity-generator'
}, sendMessageFunction);

await orchestrator.init();

const result = await orchestrator.runReflection(conversation, context);
```

## File Structure

```
~/clawd/memory/
├── MEMORY.md           # Structured memories by type
├── identity.md         # Self-model and growth narrative
├── questions.md        # Pending questions from reflection
└── reflections/        # Reflection logs (JSON)
    ├── 2026-02-05T12-00-00.json
    └── ...
```

## Agent Configuration

Add sub-agents to your agent configuration:

```json
{
  "agents": {
    "list": [
      { "id": "main" },
      {
        "id": "continuity-classifier",
        "workspace": "~/clawd/continuity-agents/classifier",
        "model": "anthropic/claude-sonnet-4",
        "tools": { "allow": ["read"] }
      },
      {
        "id": "continuity-scorer",
        "workspace": "~/clawd/continuity-agents/scorer",
        "model": "anthropic/claude-sonnet-4",
        "tools": { "allow": ["read"] }
      },
      {
        "id": "continuity-generator",
        "workspace": "~/clawd/continuity-agents/generator",
        "model": "anthropic/claude-sonnet-4",
        "tools": { "allow": ["read"] }
      }
    ]
  }
}
```

## Schemas

JSON schemas are available in `continuity/schemas/`:

- `memory-types.schema.json` - Memory extraction output
- `confidence.schema.json` - Confidence scoring output
- `curiosity-question.schema.json` - Question generation output
- `reflection-job.schema.json` - Job tracking

## Usage Patterns

### Session Hooks

```javascript
// Session start
const context = await continuity.generateGreeting();
if (context.has_pending_questions) {
  for (const q of context.questions) {
    console.log(`  • ${q.question}`);
  }
}

// Session end
await continuity.reflect(transcript, { session_id: sessionId });
```

### Heartbeat Integration

```markdown
## Post-Session Reflection
**Trigger**: Heartbeat after conversation idle > 30 minutes
**Action**: Run continuity reflect
**Output**: Updated memories + questions for next session
```

### Full Stack with MLP

For encrypted storage with MLP (IPFS/Pinata), see:
- `/integrations/openclaw/` - Full stack integration
- `/integrations/clawdbot/` - MLP storage layer

## Local Development

```bash
# Run without agent messaging (uses local fallbacks)
const continuity = new ContinuityFramework({
  basePath: './test-memory'
});
await continuity.init();

const result = await continuity.reflect('User: Hello\nAssistant: Hi!');
```

## License

MIT
