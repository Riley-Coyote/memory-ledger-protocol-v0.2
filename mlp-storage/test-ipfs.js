/**
 * MLP IPFS Test - Tests Pinata integration
 */

import 'dotenv/config';
import MLP from './src/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function testIPFS() {
  console.log('═══════════════════════════════════════════');
  console.log('  Memory Ledger Protocol - IPFS Test');
  console.log('═══════════════════════════════════════════\n');

  // Check for Pinata keys
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
    console.log('❌ Missing Pinata credentials in .env');
    return;
  }
  console.log('✓ Pinata credentials found\n');

  // 1. Initialize MLP with IPFS provider
  console.log('1. Initializing MLP with IPFS...');
  const mlp = new MLP(join(__dirname, 'test-ipfs-config.yaml'));
  
  try {
    const initResult = await mlp.init();
    console.log('   ✓ Initialized');
    console.log(`   Kernel ID: ${initResult.identity.kernel_id}`);
    console.log(`   Storage: ${initResult.storage.provider}`);
  } catch (err) {
    console.error('   ✗ Init failed:', err.message);
    return;
  }

  // 2. Store a memory to IPFS
  console.log('\n2. Storing memory to IPFS via Pinata...');
  try {
    const memory = await mlp.store({
      summary: 'First MLP memory on IPFS',
      content: 'This memory is stored on the decentralized web',
      timestamp: new Date().toISOString(),
      agent: 'Vektor'
    }, {
      kind: 'semantic',
      tags: ['mlp', 'ipfs', 'first-memory', 'decentralized'],
      riskClass: 'low'
    });
    
    console.log(`   ✓ Stored!`);
    console.log(`   Envelope ID: ${memory.envelope_id}`);
    console.log(`   Blob CID: ${memory.blob_cid}`);
    console.log(`   Envelope CID: ${memory.envelope_cid}`);
    console.log(`\n   View blob: https://gateway.pinata.cloud/ipfs/${memory.blob_cid}`);
    console.log(`   View envelope: https://gateway.pinata.cloud/ipfs/${memory.envelope_cid}`);
    
    // 3. Retrieve it back
    console.log('\n3. Retrieving memory from IPFS...');
    const loaded = await mlp.load(memory.envelope_cid);
    console.log(`   ✓ Retrieved!`);
    console.log(`   Content: ${loaded.content?.summary || JSON.stringify(loaded.content)}`);
    
  } catch (err) {
    console.error('   ✗ Storage failed:', err.message);
    console.error(err.stack);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  IPFS Test Complete');
  console.log('═══════════════════════════════════════════');
}

testIPFS().catch(console.error);
