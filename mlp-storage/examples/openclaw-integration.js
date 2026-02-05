/**
 * OpenClaw Integration Example
 *
 * Shows how to integrate MLP with OpenClaw's session lifecycle.
 */

import MLP from '../src/index.js';

/**
 * Call this at session start to bootstrap context
 */
async function onSessionStart(sessionIntent = 'general') {
  const mlp = new MLP();
  await mlp.init();
  
  // Generate ContextPack
  const contextPack = await mlp.generateContextPack({
    intent: sessionIntent,
    memoryTypes: ['semantic', 'reflection', 'episodic'],
    maxMemories: 15,
    maxTokens: 4000
  });
  
  console.log(`Session started with ${contextPack.compilation_trace.memories_included} memories`);
  
  return {
    mlp,
    contextPack,
    kernel: contextPack.kernel
  };
}

/**
 * Call this during session to store new memories
 */
async function storeMemory(mlp, content, kind = 'semantic', tags = []) {
  return await mlp.store(content, {
    kind,
    tags,
    riskClass: 'low'
  });
}

/**
 * Call this at session end to store reflections
 */
async function onSessionEnd(mlp, sessionSummary) {
  // Store session reflection
  const reflection = await mlp.store({
    type: 'session_reflection',
    summary: sessionSummary.summary,
    learnings: sessionSummary.learnings || [],
    duration: sessionSummary.duration,
    ended_at: new Date().toISOString()
  }, {
    kind: 'reflection',
    tags: ['session', 'reflection'],
    riskClass: 'low'
  });
  
  console.log('Session reflection stored:', reflection.envelope_id);
  
  return reflection;
}

/**
 * Example session flow
 */
async function exampleSession() {
  console.log('=== OpenClaw + MLP Session Flow ===\n');
  
  // 1. Session starts
  console.log('1. Starting session...');
  const { mlp, contextPack, kernel } = await onSessionStart('coding_assistance');
  
  console.log(`   Kernel: ${kernel.kernel_id.slice(0, 8)}...`);
  console.log(`   Cartouche: ${kernel.cartouche?.cartouche_string || 'none'}`);
  console.log(`   Memories loaded: ${contextPack.compilation_trace.memories_included}`);
  
  // 2. During session - store learnings
  console.log('\n2. Storing memories during session...');
  
  await storeMemory(mlp, {
    summary: 'User is building a React app with TypeScript',
    details: 'Using Next.js 14, prefers server components'
  }, 'semantic', ['project', 'react', 'typescript']);
  
  await storeMemory(mlp, {
    event: 'Helped refactor authentication flow',
    changes: 'Moved from JWT to session cookies',
    outcome: 'Improved security and simplified code'
  }, 'episodic', ['refactoring', 'auth']);
  
  console.log('   ✓ Stored 2 memories');
  
  // 3. Session ends
  console.log('\n3. Ending session...');
  await onSessionEnd(mlp, {
    summary: 'Productive coding session on auth refactoring',
    learnings: [
      'User prefers functional patterns',
      'Next.js 14 server components are new territory'
    ],
    duration: '45 minutes'
  });
  
  // 4. Status
  console.log('\n4. Final status:');
  const status = await mlp.status();
  console.log(`   Storage: ${status.storage.provider} (${status.storage.connected ? 'connected' : 'disconnected'})`);
  console.log(`   Keys: ${status.encryption.keys_exist ? 'present' : 'missing'}`);
  
  console.log('\n=== Session Complete ===');
}

exampleSession().catch(console.error);
