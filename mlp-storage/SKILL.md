# MLP Storage Layer

Sovereign, portable memory storage using the Memory Ledger Protocol.

## Status

🚧 **In Development** — Core implementation complete, needs testing

## What This Does

The MLP Storage Layer provides AI agents with:

- **Persistent memory** that survives session resets and context compression
- **Portable identity** that travels across platforms (IdentityKernel)
- **Sovereign storage** — your memories encrypted, stored where you choose
- **Verifiable provenance** — cryptographic attestations on every memory

## Schema Conformance

Based on official MLP v0.2 schemas:

| Schema | Status |
|--------|--------|
| identity-kernel.schema.json | ✅ Implemented |
| memory-envelope.schema.json | ✅ Implemented |
| memory-blob.schema.json | ✅ Implemented |
| context-pack.schema.json | ✅ Implemented |
| attestation.schema.json | ✅ Implemented |
| cartouche.schema.json | ✅ Implemented |
| access-policy.schema.json | 🚧 Partial |

## Core Components

| MLP Component | Implementation |
|---------------|----------------|
| **IdentityKernel** | `src/identity-kernel.js` — invariants, evolution rules, epoch state, cartouche |
| **MemoryEnvelope** | `src/envelope.js` — attestations, lineage, tombstones |
| **ContextPack** | `src/index.js` — session initialization bundle |
| **Storage** | `src/storage.js` — IPFS/Arweave/local abstraction |
| **Encryption** | `src/encryption.js` — NaCl-based encryption |

## Usage

```javascript
import MLP from 'mlp-storage';

// Initialize
const mlp = new MLP();
await mlp.init();

// Store a memory
const result = await mlp.store({
  summary: 'Completed MLP integration',
  details: { task: 'implementation', status: 'done' }
}, {
  kind: 'semantic',
  tags: ['mlp', 'development'],
  riskClass: 'low'
});

// Generate ContextPack for session bootstrap
const contextPack = await mlp.generateContextPack({
  intent: 'development_session',
  memoryTypes: ['semantic', 'reflection'],
  maxMemories: 10
});

// Export identity for platform migration
await mlp.exportIdentity('./my-identity-backup.json');
```

## ContextPack Flow (per MLP spec)

```
1. Load IdentityKernel
   ├── Fetch from ledger/cache
   └── Verify signature

2. Determine intent + constraints
   ├── What is this session for?
   ├── What memory types are relevant?
   └── What are token/size limits?

3. Fetch relevant envelopes
   ├── Query by scope, kind, tags
   └── Filter by time range, epoch

4. Verify attestations
   └── Check signatures

5. Fetch blobs by CID
   └── Retrieve from storage network

6. Decrypt allowed blobs
   └── Verify content_hash matches

7. Compile ContextPack
   └── Assemble Kernel + memories
```

## Configuration

```yaml
# ~/.config/mlp/config.yaml
storage:
  provider: local  # ipfs | arweave | local
  endpoint: null
  local_path: ~/.config/mlp/storage

identity:
  kernel_path: ~/.config/mlp/identity-kernel.json

encryption:
  key_path: ~/.config/mlp/keys
  algorithm: xchacha20-poly1305

token:
  network: solana
  address: H1DKS5SWqPzzt4WaQahafaWe5nJ56xf2xqtYwvdapump
  enabled: false

sync:
  auto_sync: false
  on_heartbeat: true
```

## Architecture

```
┌─────────────────────────────────────────┐
│           OpenClaw Agent                 │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    │
│  │ MEMORY.md   │───▶│ MLP Storage │    │
│  │ SOUL.md     │    │             │    │
│  │ workspace   │    │ - store()   │    │
│  └─────────────┘    │ - load()    │    │
│                     │ - context() │    │
│                     └──────┬──────┘    │
└────────────────────────────┼───────────┘
                             │
                             ▼
┌─────────────────────────────────────────┐
│         Memory Ledger Protocol          │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    │
│  │ Envelope    │───▶│ Blob        │    │
│  │ (ledger)    │    │ (encrypted) │    │
│  │ +attestation│    │             │    │
│  └─────────────┘    └──────┬──────┘    │
│                            │           │
│                            ▼           │
│              ┌─────────────────────┐   │
│              │ Decentralized Store │   │
│              │ IPFS / Arweave      │   │
│              └─────────────────────┘   │
└─────────────────────────────────────────┘
```

## Dependencies

```json
{
  "ipfs-http-client": "^60.0.0",
  "tweetnacl": "^1.0.3",
  "tweetnacl-util": "^0.15.1",
  "yaml": "^2.3.0"
}
```

## Protocol Reference

- Spec: [MLP-0.2](../spec/MLP-0.2.md)
- Token: $POLYPHONIC (Solana: H1DKS5SWqPzzt4WaQahafaWe5nJ56xf2xqtYwvdapump)

## Roadmap

- [x] IdentityKernel with invariants, evolution rules, epochs
- [x] MemoryEnvelope with attestations and lineage
- [x] Cartouche generation (GLYPH-1 dialect)
- [x] Local storage implementation
- [x] NaCl encryption
- [x] ContextPack generation following spec flow
- [x] Tombstone/revocation support
- [ ] IPFS storage integration (client ready, needs endpoint)
- [ ] Arweave storage option
- [ ] $POLYPHONIC payment integration
- [ ] Access policy enforcement
- [ ] Heartbeat auto-sync

## License

MIT
