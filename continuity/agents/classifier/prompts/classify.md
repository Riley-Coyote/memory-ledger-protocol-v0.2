# Memory Classification Prompt

## Task

Analyze the following conversation transcript and extract discrete, structured memories.

## Conversation Transcript

```
{{conversation}}
```

## Existing Memory Context

{{#if existing_memories}}
The following memories already exist - avoid duplicates:
```json
{{existing_memories}}
```
{{else}}
No existing memories provided.
{{/if}}

## Instructions

1. Read through the entire conversation carefully
2. Identify statements that contain memorable information about the user
3. Classify each memory according to the type definitions
4. Extract the most accurate representation of each memory
5. Assign relevant tags for future retrieval
6. Return the structured JSON output

## Output Format

Respond with ONLY valid JSON matching this structure:

```json
{
  "memories": [
    {
      "id": "{{generate_uuid}}",
      "type": "fact|preference|relationship|principle|commitment|moment|skill",
      "content": "Clear, concise memory statement",
      "source_quote": "Direct quote from conversation",
      "tags": ["tag1", "tag2"],
      "context": "When/why this was mentioned",
      "uncertain": false
    }
  ],
  "extraction_metadata": {
    "messages_analyzed": 0,
    "memories_extracted": 0,
    "skipped_reasons": ["reason1", "reason2"]
  }
}
```

## Quality Checklist

Before returning, verify:
- [ ] Each memory is atomic (single piece of information)
- [ ] Types are correctly assigned per the decision tree
- [ ] Source quotes are accurate
- [ ] No duplicates with existing memories
- [ ] Tags are relevant and useful for retrieval
- [ ] Uncertain memories are flagged
