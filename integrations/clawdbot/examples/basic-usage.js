/**
 * Basic MLP Usage Example
 * 
 * Shows how to initialize, store memories, and generate a ContextPack.
 */

import MLP from '../src/index.js';

async function main() {
  // Initialize MLP
  const mlp = new MLP();
  await mlp.init();
  
  console.log('Identity:', mlp.identity.getSummary());
  
  // Configure identity (first time only)
  if (mlp.identity.invariants.values.length === 0) {
    mlp.identity.addValue('protect user privacy');
    mlp.identity.addValue('be helpful and honest');
    mlp.identity.addBoundary('will not deceive about identity');
    
    // Generate cartouche
    const cartouche = mlp.identity.generateCartouche(mlp.encryption);
    console.log('Cartouche:', cartouche.cartouche_string);
  }
  
  // Store some memories
  const memory1 = await mlp.store({
    summary: 'User prefers dark mode interfaces',
    context: 'Mentioned during UI discussion',
    confidence: 0.9
  }, {
    kind: 'semantic',
    tags: ['preferences', 'ui', 'user'],
    riskClass: 'low'
  });
  console.log('Stored preference:', memory1.envelope_id);
  
  const memory2 = await mlp.store({
    event: 'Helped user debug authentication issue',
    outcome: 'Resolved by fixing token expiration',
    duration: '15 minutes'
  }, {
    kind: 'episodic',
    tags: ['debugging', 'auth', 'resolved'],
    riskClass: 'low'
  });
  console.log('Stored event:', memory2.envelope_id);
  
  const memory3 = await mlp.store({
    reflection: 'I notice I work better with clear problem statements',
    insight: 'Should ask clarifying questions early'
  }, {
    kind: 'reflection',
    tags: ['self-improvement', 'communication'],
    riskClass: 'low'
  });
  console.log('Stored reflection:', memory3.envelope_id);
  
  // Generate ContextPack for next session
  const contextPack = await mlp.generateContextPack({
    intent: 'general_assistance',
    memoryTypes: ['semantic', 'episodic', 'reflection'],
    maxMemories: 10,
    maxTokens: 4000
  });
  
  console.log('\nContextPack compiled:');
  console.log('- Memories included:', contextPack.compilation_trace.memories_included);
  console.log('- Memories considered:', contextPack.compilation_trace.memories_considered);
  
  // Show what's in the pack
  console.log('\nMemory slices:');
  for (const slice of contextPack.memory_slices) {
    console.log(`  [${slice.envelope.kind}] ${slice.decrypted_content?.summary || slice.decrypted_content?.event || slice.decrypted_content?.reflection}`);
  }
}

main().catch(console.error);
