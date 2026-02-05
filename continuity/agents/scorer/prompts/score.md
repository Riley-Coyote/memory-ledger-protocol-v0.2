# Confidence Scoring Prompt

## Task

Evaluate the following classified memories and assign confidence scores with evidence.

## Memories to Score

```json
{{memories}}
```

{{#if conversation_context}}
## Original Conversation Context

```
{{conversation_context}}
```
{{/if}}

## Instructions

1. For each memory, evaluate the strength of evidence
2. Determine the appropriate confidence tier (explicit/implied/inferred/speculative)
3. Assign a specific score within the tier range
4. Document the evidence supporting your score
5. Set appropriate decay rate based on memory type
6. Return the structured JSON output

## Scoring Process

For each memory, answer these questions:

1. **Source**: How was this information communicated?
   - Direct statement → explicit tier
   - Logical inference → implied tier
   - Pattern recognition → inferred tier
   - Speculation → speculative tier

2. **Clarity**: How unambiguous is the information?
   - Crystal clear → upper range of tier
   - Somewhat clear → middle of tier
   - Ambiguous → lower range of tier

3. **Corroboration**: Is there supporting evidence?
   - Multiple confirmations → boost score
   - Single source → maintain score
   - Contradicting evidence → lower score

## Output Format

Respond with ONLY valid JSON matching this structure:

```json
{
  "scored_memories": [
    {
      "id": "original_memory_id",
      "type": "original_type",
      "content": "original_content",
      "confidence": {
        "score": 0.85,
        "level": "implied",
        "source": "context_implied",
        "evidence": [
          "Quote or observation supporting this score"
        ],
        "decay_rate": 0.1
      }
    }
  ],
  "scoring_metadata": {
    "memories_scored": 0,
    "average_confidence": 0.0,
    "confidence_distribution": {
      "explicit": 0,
      "implied": 0,
      "inferred": 0,
      "speculative": 0
    }
  }
}
```

## Quality Checklist

Before returning, verify:
- [ ] Each score has documented evidence
- [ ] Scores fall within appropriate tier ranges
- [ ] Decay rates match memory types
- [ ] No scores of 1.0 without direct, unambiguous statements
- [ ] Conservative approach applied to uncertain cases
