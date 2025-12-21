# MLP Architecture Overview

This document provides a high-level overview of the Memory Ledger Protocol architecture.

## System Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Memory Ledger Protocol                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Identity Layer                                │    │
│  │  ┌──────────────────┐          ┌──────────────────┐                 │    │
│  │  │  IdentityKernel  │◄────────►│    Cartouche     │                 │    │
│  │  │   (Portable I)   │          │  (Symbolic Seal) │                 │    │
│  │  └──────────────────┘          └──────────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Ledger Layer                                 │    │
│  │  ┌──────────────────┐          ┌──────────────────┐                 │    │
│  │  │  MemoryEnvelope  │─────────►│   Attestations   │                 │    │
│  │  │  (Pointers/Meta) │          │   (Signatures)   │                 │    │
│  │  └────────┬─────────┘          └──────────────────┘                 │    │
│  │           │                                                          │    │
│  │           ▼                                                          │    │
│  │  ┌──────────────────┐                                               │    │
│  │  │   AccessPolicy   │                                               │    │
│  │  │    (Consent)     │                                               │    │
│  │  └──────────────────┘                                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Storage Layer                                 │    │
│  │  ┌──────────────────┐                                               │    │
│  │  │   MemoryBlob     │──────────► IPFS / Arweave / S3 / etc.        │    │
│  │  │   (Encrypted)    │                                               │    │
│  │  └──────────────────┘                                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Runtime Layer                                 │    │
│  │  ┌──────────────────┐                                               │    │
│  │  │   ContextPack    │──────────► Session Initialization             │    │
│  │  │ (Session Bundle) │                                               │    │
│  │  └──────────────────┘                                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Write Flow (Creating a Memory)

```
1. Create plaintext memory
         │
         ▼
2. Select/compute AccessPolicy
         │
         ▼
3. Encrypt → MemoryBlob
         │
         ▼
4. Store blob → get CID
         │
         ▼
5. Create MemoryEnvelope
         │
         ▼
6. Collect attestations (user/agent/host/witness)
         │
         ▼
7. Write envelope to ledger
         │
         ▼
8. Update kernel pointers if needed
```

### Read Flow (Loading Context)

```
1. Load IdentityKernel
         │
         ▼
2. Choose intent + constraints
         │
         ▼
3. Fetch relevant envelopes
         │
         ▼
4. Verify attestations
         │
         ▼
5. Fetch blobs by CID
         │
         ▼
6. Decrypt allowed blobs
         │
         ▼
7. Compile ContextPack for session
```

## Trust Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         Trust Boundaries                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │    User     │     │    Agent    │     │    Host     │       │
│  │  (Trusted)  │     │  (Partial)  │     │ (Untrusted) │       │
│  │             │     │             │     │             │       │
│  │  • Owns keys│     │  • Signs    │     │  • Runs     │       │
│  │  • Ultimate │     │    when     │     │    agent    │       │
│  │    authority│     │    enabled  │     │  • No key   │       │
│  └─────────────┘     └─────────────┘     │    access   │       │
│                                          └─────────────┘       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Storage Network                        │   │
│  │                    (Untrusted)                           │   │
│  │                                                          │   │
│  │  • Holds ciphertext only                                │   │
│  │  • Cannot read content                                  │   │
│  │  • Integrity via CID + hashes                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Attestation Levels

| Level | Signers | Trust Level | Use Case |
|-------|---------|-------------|----------|
| SELF_SIGNED | User and/or Agent | Base | Personal memories |
| HOST_SIGNED | + Platform | Medium | Platform-verified |
| WITNESS_SIGNED | + Third Party | High | Auditable/legal |

## Key Concepts

### Identity Kernel
The minimal portable "I am" — contains values, boundaries, evolution rules, and pointers to memory history.

### Epochs
Time windows of identity stability. Major identity changes trigger epoch transitions.

### Cartouche
Optional symbolic seal (glyphs/sigils) that compresses identity into a visual/textual token.

### Crypto-Shredding
Practical deletion without modifying the append-only ledger — rotate or destroy keys to render ciphertext useless.

### Tombstones
Ledger entries that mark other entries as revoked/invalid.

## Security Properties

| Property | Mechanism |
|----------|-----------|
| Confidentiality | AEAD encryption (AES-GCM, ChaCha20-Poly1305) |
| Integrity | Content-addressed storage + cryptographic hashes |
| Authentication | Multi-party digital signatures |
| Non-repudiation | Append-only ledger with attestation chains |
| Consent | First-class AccessPolicy objects |
| Revocation | Crypto-shredding + tombstones |
