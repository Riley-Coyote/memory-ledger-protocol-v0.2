# Contributing to Memory Ledger Protocol

Thank you for your interest in contributing to MLP! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Specification Changes](#specification-changes)
- [Schema Contributions](#schema-contributions)
- [Implementation Guidelines](#implementation-guidelines)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Ways to Contribute

### Specification Development
- Propose clarifications to existing sections
- Identify ambiguities or edge cases
- Suggest new features for future versions
- Review and comment on open proposals

### Schema Work
- Validate and refine JSON schemas
- Add test vectors
- Improve schema documentation

### Implementations
- Create reference implementations
- Port to additional languages
- Build tooling and validators

### Documentation
- Improve explanations and examples
- Create tutorials and guides
- Translate documentation

### Security
- Review for vulnerabilities
- Suggest security improvements
- Report issues responsibly

## Getting Started

1. **Fork the repository** and clone locally
2. **Read the specification** in `spec/MLP-0.1.md`
3. **Review open issues** to find something to work on
4. **Join discussions** in GitHub Discussions

## Specification Changes

Specification changes follow a structured process:

### Minor Changes (Clarifications, Typos)
1. Open an issue describing the change
2. Submit a PR with the fix
3. One maintainer approval required

### Substantive Changes (New Features, Behavioral Changes)
1. Open a discussion to gather feedback
2. Create a proposal document
3. Allow 2-week comment period
4. Submit PR after consensus
5. Two maintainer approvals required

### Breaking Changes
1. Must target a new major version
2. Requires RFC-style proposal
3. Extended comment period (4 weeks minimum)
4. Community vote may be required

### Proposal Format

```markdown
# MLP Proposal: [Title]

## Summary
One paragraph description.

## Motivation
Why is this needed?

## Specification
Detailed technical specification.

## Backwards Compatibility
Impact on existing implementations.

## Security Considerations
Any security implications.

## Open Questions
Unresolved issues for discussion.
```

## Schema Contributions

### Adding/Modifying Schemas

1. Schemas must be valid JSON Schema (draft-07 or later)
2. Include comprehensive descriptions
3. Add examples for each type
4. Create corresponding test vectors

### Schema Requirements

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "$id": "https://mlp.dev/schemas/v0.1/[name].json",
  "title": "MLP [Name]",
  "description": "Clear description of the object",
  "type": "object",
  "required": ["..."],
  "properties": {
    "...": {
      "description": "Field description",
      "type": "string"
    }
  }
}
```

## Implementation Guidelines

### Reference Implementations

Reference implementations should:

1. **Be complete**: Implement all required features for a conformance level
2. **Be tested**: Include comprehensive test suites
3. **Be documented**: Clear API documentation and usage examples
4. **Be secure**: Follow security best practices

### Directory Structure

```
implementations/
├── python/
│   ├── README.md
│   ├── setup.py
│   ├── mlp/
│   └── tests/
├── typescript/
│   ├── README.md
│   ├── package.json
│   ├── src/
│   └── tests/
└── rust/
    ├── README.md
    ├── Cargo.toml
    ├── src/
    └── tests/
```

### Implementation Checklist

- [ ] Implements MLP-CORE at minimum
- [ ] Passes all test vectors
- [ ] Includes usage documentation
- [ ] Has CI/CD setup
- [ ] Security review completed

## Pull Request Process

### Before Submitting

1. Ensure your changes follow style guidelines
2. Update relevant documentation
3. Add/update tests as needed
4. Run any existing tests locally

### PR Requirements

- Clear, descriptive title
- Description of changes and motivation
- Reference to related issues
- Passing CI checks

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Specification change
- [ ] Schema addition/modification
- [ ] Documentation update
- [ ] Implementation contribution
- [ ] Bug fix

## Related Issues
Fixes #123

## Checklist
- [ ] I have read CONTRIBUTING.md
- [ ] My changes follow the style guidelines
- [ ] I have updated documentation as needed
- [ ] I have added tests if applicable
```

## Style Guidelines

### Specification Writing

- Use RFC 2119 keywords (MUST, SHOULD, MAY) consistently
- Be precise and unambiguous
- Include examples for complex concepts
- Cross-reference related sections

### JSON Schema

- Use camelCase for property names
- Include descriptions for all properties
- Define sensible defaults where appropriate
- Use `$ref` for shared definitions

### Code (Implementations)

- Follow language-specific conventions
- Prioritize readability
- Document public APIs
- Handle errors gracefully

### Commit Messages

```
type(scope): brief description

Longer explanation if needed.

Refs: #123
```

Types: `spec`, `schema`, `docs`, `impl`, `fix`, `test`, `chore`

## Questions?

- Open a GitHub Discussion for general questions
- Use Issues for bugs or specific proposals
- See SECURITY.md for security concerns

---

Thank you for helping make MLP better!
