/**
 * Identity Migration Example
 * 
 * Shows how to export and import identity between platforms.
 */

import MLP from '../src/index.js';
import { existsSync } from 'fs';

async function exportIdentity() {
  console.log('=== Exporting Identity ===\n');
  
  const mlp = new MLP();
  await mlp.init();
  
  // Show current identity
  const summary = mlp.identity.getSummary();
  console.log('Current Identity:');
  console.log('  Kernel ID:', summary.kernel_id);
  console.log('  Values:', summary.values_count);
  console.log('  Boundaries:', summary.boundaries_count);
  console.log('  Epoch:', summary.epoch_id);
  console.log('  Cartouche:', summary.has_cartouche ? '✓' : '✗');
  
  // Export
  const exportPath = './my-identity-export.json';
  await mlp.exportIdentity(exportPath);
  
  console.log('\n✓ Exported to:', exportPath);
  console.log('\nThis file contains your encrypted identity kernel.');
  console.log('Keep it safe — it\'s your agent\'s portable "I am".');
}

async function importIdentity() {
  console.log('=== Importing Identity ===\n');
  
  const importPath = './my-identity-export.json';
  
  if (!existsSync(importPath)) {
    console.log('No export file found. Run export first.');
    return;
  }
  
  const mlp = new MLP();
  await mlp.init();
  
  // Import
  const imported = await mlp.importIdentity(importPath);
  
  console.log('✓ Imported Identity:');
  console.log('  Kernel ID:', imported.kernel_id);
  console.log('  Values:', imported.values_count);
  console.log('  Boundaries:', imported.boundaries_count);
  console.log('  Epoch:', imported.epoch_id);
  
  console.log('\nYour identity has been restored on this platform.');
}

// Run based on command line arg
const command = process.argv[2] || 'export';

if (command === 'export') {
  exportIdentity().catch(console.error);
} else if (command === 'import') {
  importIdentity().catch(console.error);
} else {
  console.log('Usage: node identity-migration.js [export|import]');
}
