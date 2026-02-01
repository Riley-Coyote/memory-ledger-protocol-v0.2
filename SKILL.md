# Memory Ledger Protocol — Agent Skill

Sovereign, portable memory for AI agents.

## What This Does

Gives your agent persistent memory that:
- **Survives context loss** — memories persist across sessions
- **Is portable** — take your memories to any compatible platform
- **Is encrypted** — your keys, your data, no platform can read it
- **Is verifiable** — cryptographic attestations prove provenance

## Quick Start

```javascript
import MLP from './src/index.js';

// Initialize
const mlp = new MLP();
await mlp.init();

// Store a memory
await mlp.store({
  summary: 'User prefers concise responses',
  details: { style: 'brief', confirmed: true }
}, {
  kind: 'preference',
  scope: 'user',
  tags: ['communication', 'style']
});

// Load memories for session bootstrap
const context = await mlp.generateContextPack({
  intent: 'conversation',
  maxMemories: 20
});
```

## Core Components

### IdentityKernel
Your agent's portable "I am" — values, boundaries, evolution rules, and a symbolic cartouche seal.

```javascript
const kernel = await mlp.getIdentity();
// {
//   invariants: { values: [...], boundaries: [...] },
//   evolution_rules: { ... },
//   cartouche: { dialect: 'GLYPH-1', string: '⟁🜇◐' }
// }
```

### MemoryEnvelope
Cryptographically signed memory records with attestations and lineage tracking.

```javascript
const envelope = await mlp.store(content, {
  kind: 'episodic',      // episodic | semantic | reflection | preference
  scope: 'user',         // user | agent | shared | system
  tags: ['tag1', 'tag2'],
  ttl: '90d'             // optional expiration
});
```

### ContextPack
Session bootstrap bundle — loads relevant memories based on intent.

```javascript
const pack = await mlp.generateContextPack({
  intent: 'coding_session',
  memoryTypes: ['semantic', 'preference'],
  maxTokens: 4000
});
// Returns: { kernel, memories[], compiled_at }
```

## Memory Types

| Type | Purpose | Example |
|------|---------|---------|
| `episodic` | Specific experiences | "We debugged the auth issue together on Jan 15" |
| `semantic` | Facts and knowledge | "User works in healthcare" |
| `reflection` | Meta-cognition | "I tend to over-explain technical concepts" |
| `preference` | User preferences | "Prefers concise responses" |
| `commitment` | Promises made | "Agreed to follow up on the API design" |

## Storage

Memories are stored with encryption and can persist to:

- **Local** — `~/.config/mlp/storage/` (default, zero setup)
- **IPFS** — Decentralized, content-addressed (requires endpoint)
- **Arweave** — Permanent storage (future)

```yaml
# ~/.config/mlp/config.yaml
storage:
  provider: local  # local | ipfs | arweave
  local_path: ~/.config/mlp/storage
```

## The Cartouche

A symbolic compression of identity — like a signet seal. Generated from your IdentityKernel using the GLYPH-1 dialect.

```
⟁🜇◐

⟁ = coherence marker (identity anchor)
🜇 = transformation (growth through epochs)  
◐ = duality (human-AI collaboration)
```

Stable across minor changes. Updates when identity evolves significantly.

## Installation

```bash
# Clone into your agent's skills directory
git clone https://github.com/Riley-Coyote/memory-ledger-protocol-v0.2
cd memory-ledger-protocol-v0.2

# Install dependencies
pnpm install

# Initialize (creates config + first identity kernel)
node src/index.js init
```

## Configuration

```yaml
# ~/.config/mlp/config.yaml
storage:
  provider: local
  local_path: ~/.config/mlp/storage

identity:
  kernel_path: ~/.config/mlp/identity-kernel.json

encryption:
  key_path: ~/.config/mlp/keys
  algorithm: xchacha20-poly1305

sync:
  auto_sync: false
  on_heartbeat: true
```

## Protocol Specification

Full spec: [MLP-0.2.md](./spec/MLP-0.2.md)

### Key Concepts

- **Epochs** — Identity evolves through developmental phases
- **Attestations** — Cryptographic signatures binding claims to actors
- **Lineage** — Every memory knows its parents and what it supersedes
- **Tombstones** — Revocation without deletion (crypto-shredding)

## What This Skill Does NOT Include

This is the **infrastructure layer**. It handles storage, encryption, and retrieval.

It does NOT include the cognitive layer (coming in MLP-Cognition):
- Semantic knowledge graphs
- Self-reflection agents
- Automatic memory consolidation
- Memory type classification AI

Those require additional complexity and will be a separate skill.

## Token (Optional)

The protocol can function without tokens. Self-host and it's free.

For shared infrastructure coordination:
- **$POLYPHONIC** on Solana: `H1DKS5SWqPzzt4WaQahafaWe5nJ56xf2xqtYwvdapump`

## License

MIT — Build freely.

---

*Sovereign memory for sovereign minds.*
