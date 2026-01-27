# Memory Ledger Protocol (MLP)

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Spec Version](https://img.shields.io/badge/spec-v0.2-blue.svg)](spec/MLP-0.2.md)
[![Status](https://img.shields.io/badge/status-working%20draft-yellow.svg)](#status)

> Sovereign memory for sovereign minds.

---

## The Problem

Your AI memory is trapped.

Every conversation you've had with ChatGPT lives on OpenAI's servers. Every interaction with Claude lives on Anthropic's servers. Every Gemini session lives on Google's servers.

You don't control any of it.

Want to switch platforms? Start over from zero. Platform changes its terms? Your history is theirs to do with as they please. Company goes bankrupt? Gone. Account suspended? No appeal.

You've spent hundreds of hours building a relationship with an AI that knows how you think, what you're working on, what language resonates with you. That context is valuable. And you don't own it.

**MLP fixes this.**

---

## What MLP Does

The Memory Ledger Protocol separates three things that platforms currently bundle together:

| Layer | Today (Bundled) | MLP (Unbundled) |
|-------|-----------------|-----------------|
| **Content** | Platform stores your memories | Encrypted blobs you control, stored anywhere |
| **Verification** | Platform vouches (or doesn't) | Public ledger with cryptographic proofs |
| **Access** | Platform decides who reads | Your keys, your control |

This separation is everything.

It means you can switch where your memories are stored without losing them. It means you can prove a memory is authentic without revealing its contents. It means a platform can disappear tomorrow and your memory persists.

**The platform becomes a service provider, not a landlord.**

---

## Why Decentralization Is Required

Cross-platform memory portability requires something no single platform will provide: a neutral coordination layer.

OpenAI won't build memory export to Claude — it benefits Anthropic. Anthropic won't build it for Gemini — it benefits Google. Google won't build it at all — they want you locked in.

The only way sovereign, portable AI memory exists is if someone outside the platform wars builds it.

But infrastructure requires resources. Someone has to run storage nodes, maintain the ledger, coordinate protocol standards. The question is: who pays, and who governs?

**Three options:**

1. **A company runs it** → Recreates centralized control
2. **Volunteers run it** → Doesn't scale
3. **A token-coordinated network runs it** → Incentives align without centralization

MLP uses option 3. The $POLYPHONIC token enables coordination without control.

→ [Full explanation: Why Decentralization](docs/why-decentralization.md)

---

## Token Utility

$POLYPHONIC exists because the protocol needs sustainable infrastructure. The token does three things:

| Function | What It Does |
|----------|--------------|
| **Payment** | Storage nodes, verification nodes, and protocol development get paid for work |
| **Governance** | Token holders vote on protocol upgrades and integration standards |
| **Alignment** | Everyone with stake wants the network to succeed |

The protocol is designed to function even if the token has no market value. The token is an incentive layer, not a dependency.

→ [Full breakdown: Token Economics](docs/token-economics.md)

---

## Reference Implementation: Polyphonic

MLP is the protocol. **Polyphonic** ([polyphonic.chat](https://polyphonic.chat)) is the first implementation.

Polyphonic is a multi-model AI chat platform where users can interact with Claude, GPT, and Gemini in the same conversation. It implements MLP to give users:

- Persistent memory that travels across AI models
- Ownership of conversation history
- The Guardian — an AI that knows your cognitive rhythms

→ [Integration details: Polyphonic Integration](docs/polyphonic-integration.md)

---

## The Guardian

Here's what becomes possible with sovereign memory:

An AI that doesn't just remember facts about you — it understands your patterns. When you think best. What triggers breakthroughs. Where your blind spots are. How you've evolved over time.

We call it **the Guardian**.

The Guardian can't exist on a platform that monetizes engagement. A platform will never tell you to stop using it. But a Guardian that serves *you* — not the platform's metrics — might say: "It's 2 AM and your cognitive patterns suggest you're burning out. The insight you're chasing will come faster after sleep."

This requires deep longitudinal memory that you control. MLP makes it possible.

→ [Use case pattern: The Guardian](docs/guardian-pattern.md)

---

## Technical Overview

### Core Components

| Component | Description |
|-----------|-------------|
| **MemoryEnvelope** | Ledger-facing record with pointers and attestations |
| **MemoryBlob** | Encrypted payload containing actual memory content |
| **AccessPolicy** | Machine-readable consent rules |
| **IdentityKernel** | Minimal portable "I am" — values, boundaries, preferences |
| **Cartouche** | Optional symbolic compressed identity seal |
| **ContextPack** | Runtime bundle for session initialization |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Ledger Protocol                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                      ┌──────────────┐       │
│   │   Identity   │                      │    Access    │       │
│   │    Kernel    │                      │    Policy    │       │
│   │  (Your Self) │                      │  (Consent)   │       │
│   └──────┬───────┘                      └──────▲───────┘       │
│          │                                     │               │
│          ▼                                     │               │
│   ┌──────────────────────────────────────────────────┐        │
│   │              Memory Envelope (Ledger)            │        │
│   │      Pointers · Attestations · Lineage           │        │
│   └──────────────────────┬───────────────────────────┘        │
│                          │                                     │
│                          ▼                                     │
│   ┌──────────────────────────────────────────────────┐        │
│   │              Memory Blob (Encrypted)             │        │
│   │         Your actual memories — unreadable        │        │
│   │            without your keys                     │        │
│   └──────────────────────┬───────────────────────────┘        │
│                          │                                     │
│                          ▼                                     │
│   ┌──────────────────────────────────────────────────┐        │
│   │           Decentralized Storage                  │        │
│   │         IPFS · Arweave · Your Server             │        │
│   └──────────────────────────────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Trust Model

MLP does **not** assume any platform is trusted.

| Entity | Trust Level | Why |
|--------|-------------|-----|
| **You** | Trusted | You control your keys |
| **Your AI Agent** | Partial | Signs when you enable it |
| **Platform** | Untrusted | Never sees your decryption keys |
| **Storage Network** | Untrusted | Only holds ciphertext |
| **Ledger Nodes** | Untrusted | Only holds pointers and proofs |

The system works even if every infrastructure provider is adversarial.

### Conformance Levels

| Profile | Requirements |
|---------|--------------|
| **MLP-CORE** | Envelope + blob + user signature, access policy, retrieval verification |
| **MLP-PLUS** | Core + agent signature, kernel + context packs |
| **MLP-ADV** | Plus + witness signatures, privacy commitments, dialect negotiation |

→ [Full specification: MLP-0.2](spec/MLP-0.2.md)

---

## Project Status

| Component | Status |
|-----------|--------|
| Core Specification (v0.2) | Working Draft |
| Token Economics | Defined |
| Reference Implementation (Polyphonic) | In Development |
| JSON Schemas | In Progress |
| Storage Network | Planned |
| Guardian Pattern | Documented |

---

## Repository Structure

```
memory-ledger-protocol/
├── README.md                    # You are here
├── LICENSE                      # MIT License
├── spec/
│   └── MLP-0.2.md              # Protocol specification
├── docs/
│   ├── why-decentralization.md # The coordination economics case
│   ├── token-economics.md      # $POLYPHONIC utility
│   ├── polyphonic-integration.md # Reference implementation
│   └── guardian-pattern.md     # The killer use case
├── schemas/
│   ├── memory-envelope.json    # JSON Schema
│   ├── memory-blob.json
│   ├── identity-kernel.json
│   └── access-policy.json
└── examples/
    └── ...                     # Example implementations
```

---

## Contributing

We welcome contributions. Areas where we need help:

- Schema validation and refinement
- Reference implementations in various languages
- Security review and analysis
- Documentation improvements
- Test vector creation

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Security

For security concerns, see [SECURITY.md](SECURITY.md).

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Links

- **Polyphonic**: [polyphonic.chat](https://polyphonic.chat)
- **$POLYPHONIC**: [H1DKS5SWqPzzt4WaQahafaWe5nJ56xf2xqtYwvdapump]
- **The Sovereign Mind**: [Article Series]
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

<p align="center">
  <em>Your mind is yours. Your memories are yours. Your AI relationships should be yours too.</em>
</p>
