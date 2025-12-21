# Security Policy

## Reporting a Vulnerability

The Memory Ledger Protocol team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to the project maintainers. You should receive a response within 48 hours. If for some reason you do not, please follow up to ensure we received your original message.

Please include the following information:

- Type of issue (e.g., cryptographic weakness, privacy leak, authentication bypass)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: We will assess the vulnerability and determine its severity
3. **Updates**: We will keep you informed of our progress
4. **Resolution**: We will notify you when the issue is fixed
5. **Credit**: We will credit you in the security advisory (unless you prefer anonymity)

## Security Considerations for MLP

### Protocol-Level Security

MLP is designed with the following security properties:

| Property | Mechanism |
|----------|-----------|
| **Confidentiality** | AEAD encryption of memory blobs |
| **Integrity** | Content-addressed storage + attestations |
| **Authentication** | Multi-party signatures (user/agent/host/witness) |
| **Non-repudiation** | Append-only ledger with attestation chains |
| **Forward secrecy** | Key rotation support |

### Known Threat Vectors

The specification addresses these threats:

1. **Forgery** - Mitigated by required attestations and signature verification
2. **Poisoning** - Mitigated by confirmation requirements and anomaly detection
3. **Key Compromise** - Mitigated by rotation, scoped keys, and social recovery
4. **Replay Attacks** - Mitigated by timestamps, nonces, and lineage checks
5. **Metadata Leakage** - Mitigated by on-ledger metadata minimization

### Implementation Security

Implementers MUST:

- Use well-vetted cryptographic libraries
- Implement constant-time comparison for signatures
- Properly validate all inputs
- Handle key material securely
- Follow secure coding practices for their platform

Implementers SHOULD:

- Undergo independent security audit
- Implement rate limiting
- Log security-relevant events
- Provide secure defaults

### Cryptographic Requirements

MLP implementations MUST use:

- **Encryption**: AEAD schemes (AES-GCM-256, ChaCha20-Poly1305)
- **Hashing**: SHA-256 minimum, SHA-3 recommended
- **Signatures**: Ed25519, ECDSA P-256, or equivalent
- **Key Derivation**: HKDF or Argon2 for password-based

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Updates

Security advisories will be published via:

- GitHub Security Advisories
- Project mailing list (when established)
- README badge updates

## Bug Bounty

We do not currently have a formal bug bounty program, but we deeply appreciate security researchers who help improve MLP. Significant findings may be rewarded at our discretion.

## Security Best Practices for Users

If you're implementing or using MLP:

1. **Key Management**: Store keys securely, use hardware security modules when possible
2. **Access Policies**: Apply principle of least privilege
3. **Audit Logs**: Maintain logs of access and modifications
4. **Updates**: Keep implementations updated
5. **Review**: Periodically review access policies and attestations
