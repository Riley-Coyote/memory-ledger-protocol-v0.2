# Memory Ledger Protocol (MLP)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Spec Version](https://img.shields.io/badge/spec-v0.1--draft-orange.svg)](spec/MLP-0.1.md)
[![Status](https://img.shields.io/badge/status-working%20draft-yellow.svg)](#status)

> A portable, verifiable, consent-aware memory format and persistence workflow for digital intelligence across platforms.

## Overview

The Memory Ledger Protocol (MLP) defines a standard for how digital agents (AI systems, autonomous entities) can maintain persistent, verifiable memory that travels with them across platforms while respecting consent and privacy.

### Core Principles

- **Portability**: Memories belong to the agent/user, not the platform
- **Verifiability**: Cryptographic proofs ensure memory integrity and provenance
- **Consent-First**: Access policies are first-class citizens, not afterthoughts
- **Privacy-Preserving**: Encrypted blobs with metadata minimization
- **Append-Only Evolution**: Identity evolves through attestation, not mutation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Memory Ledger Protocol                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Identity   │    │    Memory    │    │   Access     │  │
│  │    Kernel    │◄───│   Envelope   │───►│   Policy     │  │
│  │  (Self/I am) │    │   (Ledger)   │    │  (Consent)   │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                                │
│                             ▼                                │
│                    ┌──────────────┐                         │
│                    │   Memory     │                         │
│                    │    Blob      │                         │
│                    │ (Encrypted)  │                         │
│                    └──────────────┘                         │
│                             │                                │
│                             ▼                                │
│         ┌──────────────────────────────────┐                │
│         │     Decentralized Storage        │                │
│         │   (IPFS / Arweave / S3 / etc)   │                │
│         └──────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Description |
|-----------|-------------|
| **MemoryEnvelope** | Ledger-facing record with attestations and pointers |
| **MemoryBlob** | Encrypted payload containing actual memory content |
| **AccessPolicy** | Machine-readable consent rules and constraints |
| **IdentityKernel** | Minimal portable "I am" — values, boundaries, preferences |
| **Cartouche** | Optional symbolic compressed identity seal |
| **ContextPack** | Runtime bundle for session initialization |

## Quick Start

### Reading the Specification

The full protocol specification is available in [`spec/MLP-0.1.md`](spec/MLP-0.1.md).

### Understanding the Data Model

```
MLP Objects:
├── MemoryEnvelope     (ledger-facing pointer + attestations)
├── MemoryBlob         (encrypted memory payload)
├── AccessPolicy       (consent + permission rules)
├── Attestations       (cryptographic signatures)
├── IdentityKernel     (portable self definition)
└── ContextPack        (session load bundle)
```

### JSON Schemas

Formal schemas for all MLP objects are available in [`schemas/`](schemas/).

## Conformance Levels

MLP defines three conformance profiles:

| Profile | Requirements |
|---------|--------------|
| **MLP-CORE** | Envelope + blob + user signature, access policy, retrieval verification |
| **MLP-PLUS** | Core + agent signature, host signature (optional), kernel + context packs |
| **MLP-ADV** | Plus + witness signatures, privacy commitments, dialect negotiation + cartouche |

## Trust Model

MLP does **not** assume the host platform is trusted. It assumes:

- Users control their own keys
- Agents can sign statements when enabled by their host
- Storage networks can be untrusted (ciphertext remains safe)

## Use Cases

- **AI Agent Continuity**: Maintain persistent identity across different LLM providers
- **Verified Memory**: Prove that memories haven't been tampered with
- **Consent Management**: Fine-grained control over who can access what
- **Identity Portability**: Take your agent's "self" to any platform
- **Audit Trails**: Immutable record of memory evolution

## Project Status

| Milestone | Status |
|-----------|--------|
| Core Specification (v0.1) | Working Draft |
| JSON Schemas | In Progress |
| Reference Implementation | Planned |
| Test Vectors | Planned |
| Dialect Registry | Planned |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Areas where we especially need help:
- Schema validation and refinement
- Reference implementations in various languages
- Security review and analysis
- Documentation improvements
- Test vector creation

## Security

For security concerns, please see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the Apache License 2.0 — see [LICENSE](LICENSE) for details.

The specification itself is made available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) to ensure broad adoption.

## Acknowledgments

MLP builds on ideas from:
- Content-addressable storage (IPFS, Git)
- Verifiable credentials (W3C)
- Self-sovereign identity principles
- Consent management frameworks

## Contact

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

<p align="center">
  <em>Memory is identity. Identity deserves sovereignty.</em>
</p>
