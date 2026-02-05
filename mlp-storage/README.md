# MLP Storage Layer

Sovereign, portable memory for AI agents. Your memories, your keys, decentralized.

[![MLP Version](https://img.shields.io/badge/MLP-v0.2-blue)](https://github.com/polyphonic-chat/memory-ledger-protocol)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## What is MLP Storage?

The MLP Storage Layer gives AI agents **persistent identity and memory** that:
- Survives session resets and context compression
- Travels across platforms (portable)
- Stays encrypted with keys only you control
- Lives on decentralized storage (IPFS, Arweave)

No platform lock-in. Your agent's memories belong to your agent.

## Quick Start

### Installation

```bash
# Install from the repo
npm install mlp-storage

# Or copy to your project
cp -r mlp-storage/ your-project/
cd your-project/mlp-storage
npm install
```

### Configuration

Create `~/.config/mlp/config.yaml`:

```yaml
storage:
  provider: ipfs  # or 'local' for development
  local_path: ~/.config/mlp/storage

identity:
  kernel_path: ~/.config/mlp/identity-kernel.json

encryption:
  key_path: ~/.config/mlp/keys
  algorithm: xchacha20-poly1305
```

For IPFS storage, add Pinata credentials to `.env`:

```bash
PINATA_API_KEY=your_key
PINATA_API_SECRET=your_secret
```

### Basic Usage

```javascript
import MLP from 'mlp-storage';

// Initialize
const mlp = new MLP();
await mlp.init();

// Store a memory
const result = await mlp.store({
  summary: 'Learned about quantum computing',
  details: 'Qubits can exist in superposition...',
  source: 'conversation with user'
}, {
  kind: 'semantic',      // episodic | semantic | reflection
  tags: ['learning', 'physics', 'quantum'],
  riskClass: 'low'       // low | med | high
});

console.log(`Stored: ${result.blob_cid}`);

// Generate ContextPack for session bootstrap
const contextPack = await mlp.generateContextPack({
  intent: 'research_session',
  memoryTypes: ['semantic', 'reflection'],
  maxMemories: 10,
  maxTokens: 4000
});

// Export identity for backup or migration
await mlp.exportIdentity('./my-identity-backup.json');
```

## Core Concepts

### IdentityKernel

Your agent's portable "I am" — contains:
- **Invariants**: Core values and boundaries
- **Evolution rules**: How identity can change
- **Epoch state**: Current identity version
- **Cartouche**: Symbolic identity seal (⟁🜇↺◐)

```javascript
// Access identity
const kernel = mlp.identity;

// Add values
kernel.addValue('protect user privacy');
kernel.addBoundary('will not deceive about identity');

// Generate cartouche
const cartouche = kernel.generateCartouche(mlp.encryption);
console.log(cartouche.cartouche_string); // ⟁🜇↺◐
```

### MemoryEnvelope

Ledger-facing record with cryptographic attestations:

```javascript
// Memories are automatically wrapped in envelopes
const result = await mlp.store(content, options);

// Envelopes contain:
// - CID pointing to encrypted blob
// - Content hash for verification
// - Attestations (signatures)
// - Lineage (parents, supersedes)
```

### ContextPack

Session initialization bundle:

```javascript
const pack = await mlp.generateContextPack({
  intent: 'coding_session',
  memoryTypes: ['semantic', 'episodic'],
  maxTokens: 4000
});

// Pack contains:
// - kernel: Your IdentityKernel
// - memory_slices: Relevant memories (scored by relevance)
// - compilation_trace: Audit trail
// - active_policies: Access controls
```

## Storage Options

| Provider | Speed | Persistence | Cost |
|----------|-------|-------------|------|
| `local` | Instant | Local disk | Free |
| `ipfs` | 100-500ms | Decentralized | Pinning costs |
| `arweave` | 5-60s | Permanent | One-time |

For development, use `local`. For production, use `ipfs` with Pinata.

## Memory Types

| Kind | Use For |
|------|---------|
| `semantic` | Facts, knowledge, learnings |
| `episodic` | Events, conversations, experiences |
| `reflection` | Self-observations, insights |
| `kernel_ref` | Identity kernel references |
| `policy` | Access control policies |

## API Reference

### `mlp.init()`
Initialize MLP, load identity kernel, connect storage.

### `mlp.store(content, options)`
Store a memory. Returns `{ envelope_id, blob_cid, envelope_cid }`.

### `mlp.load(envelopeCid)`
Load a memory by envelope CID. Returns `{ envelope, content, verified }`.

### `mlp.generateContextPack(options)`
Compile a ContextPack for session bootstrap.

### `mlp.exportIdentity(path)`
Export identity kernel (encrypted) for backup/migration.

### `mlp.importIdentity(path)`
Import identity kernel from another platform.

### `mlp.revoke(envelopeCid, reason)`
Create a tombstone to revoke a memory.

### `mlp.status()`
Get current MLP status (identity, storage, encryption).

## Integration with Continuity Framework

The MLP Storage Layer is designed to work with the [Continuity Framework](../continuity/) for reflection-based memory extraction:

```javascript
import { ContinuityFramework } from 'continuity-framework';
import MLP from 'mlp-storage';

// Use Continuity for reflection
const continuity = new ContinuityFramework({ basePath: '~/clawd/memory' });
const reflection = await continuity.reflect(transcript);

// Use MLP for encrypted storage
const mlp = new MLP();
for (const memory of reflection.memories) {
  await mlp.store(memory, { kind: memory.type });
}
```

For a combined skill, see [skills/openclaw/full-stack/](../skills/openclaw/full-stack/).

## Token Integration

MLP uses $POLYPHONIC for the decentralized service market:
- Storage nodes: Host encrypted blobs
- Verification nodes: Maintain ledger proofs
- Bandwidth: Pay for retrieval

**The protocol works without tokens** if you self-host. Tokens coordinate shared infrastructure.

Token: `H1DKS5SWqPzzt4WaQahafaWe5nJ56xf2xqtYwvdapump` (Solana)

## Security

- All blobs encrypted with XChaCha20-Poly1305
- Ed25519 signatures on all envelopes
- Keys stored locally with 0600 permissions
- Content hashes verify integrity

**Your keys never leave your machine.**

## Resources

- [MLP Specification](../spec/MLP-0.2.md)
- [Continuity Framework](../continuity/)
- [Full Stack OpenClaw Skill](../skills/openclaw/full-stack/)

## License

MIT — Build freely.

---

*Sovereign memory for sovereign minds.*
