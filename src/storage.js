/**
 * Storage - Decentralized storage abstraction
 * 
 * Supports IPFS, Arweave, and local storage.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash, randomBytes } from 'crypto';

// Public IPFS gateways for retrieval
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
];

const PINATA_API_URL = 'https://api.pinata.cloud';

export class Storage {
  constructor(config) {
    this.provider = config.provider || 'local';
    this.endpoint = config.endpoint;
    this.localPath = config.local_path || '~/.config/mlp/storage';
    this.pinataApiKey = config.pinata_api_key || process.env.PINATA_API_KEY || null;
    this.pinataApiSecret = config.pinata_api_secret || process.env.PINATA_API_SECRET || null;
    this.client = null;
  }

  /**
   * Initialize storage client
   */
  async init() {
    switch (this.provider) {
      case 'ipfs':
        // Dynamic import for IPFS client
        try {
          const { create } = await import('ipfs-http-client');
          this.client = create({ url: this.endpoint });
        } catch (err) {
          console.warn('IPFS client not available, falling back to local storage');
          this.provider = 'local';
        }
        break;
        
      case 'arweave':
        // TODO: Arweave integration
        console.warn('Arweave not yet implemented, falling back to local storage');
        this.provider = 'local';
        break;
        
      case 'local':
      default:
        // Local storage - good for development
        const expandedPath = this.localPath.replace('~', process.env.HOME);
        await mkdir(expandedPath, { recursive: true });
        break;
    }
  }

  /**
   * Store data and return CID/identifier
   */
  async store(data) {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    
    switch (this.provider) {
      case 'ipfs':
        return this.storeIPFS(content);
        
      case 'arweave':
        return this.storeArweave(content);
        
      case 'local':
      default:
        return this.storeLocal(content);
    }
  }

  /**
   * Retrieve data by CID/identifier
   */
  async retrieve(cid) {
    switch (this.provider) {
      case 'ipfs':
        return this.retrieveIPFS(cid);
        
      case 'arweave':
        return this.retrieveArweave(cid);
        
      case 'local':
      default:
        return this.retrieveLocal(cid);
    }
  }

  /**
   * Check if storage is connected
   */
  async isConnected() {
    switch (this.provider) {
      case 'ipfs':
        try {
          if (this.client) {
            await this.client.id();
            return true;
          }
          return false;
        } catch {
          return false;
        }
        
      case 'local':
        return true;
        
      default:
        return false;
    }
  }

  // IPFS Implementation
  async storeIPFS(content) {
    // Use Pinata if credentials available
    if (this.pinataApiKey && this.pinataApiSecret) {
      return this.storePinata(content);
    }
    
    // Fall back to local IPFS client
    if (!this.client) {
      await this.init();
    }
    
    if (this.client) {
      const result = await this.client.add(content);
      return result.cid.toString();
    }
    
    throw new Error('No IPFS storage available (no Pinata keys or local node)');
  }

  /**
   * Store via Pinata (pinned IPFS)
   */
  async storePinata(content) {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.pinataApiKey,
        'pinata_secret_api_key': this.pinataApiSecret
      },
      body: JSON.stringify({
        pinataContent: typeof content === 'string' ? JSON.parse(content) : content,
        pinataMetadata: {
          name: `mlp-${Date.now()}`
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${error}`);
    }
    
    const result = await response.json();
    return result.IpfsHash;
  }

  async retrieveIPFS(cid) {
    // Try public gateways first (no client needed)
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const response = await fetch(`${gateway}${cid}`);
        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }
      } catch (err) {
        // Try next gateway
        continue;
      }
    }
    
    // Fall back to client if available
    if (this.client) {
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks).toString();
      
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }
    
    throw new Error(`Could not retrieve CID ${cid} from any gateway`);
  }

  // Arweave Implementation (placeholder)
  async storeArweave(content) {
    throw new Error('Arweave storage not yet implemented');
  }

  async retrieveArweave(txId) {
    throw new Error('Arweave storage not yet implemented');
  }

  // Local Implementation
  async storeLocal(content) {
    const expandedPath = this.localPath.replace('~', process.env.HOME);
    
    // Generate content-addressed ID
    const hash = createHash('sha256').update(content).digest('hex');
    const cid = `local_${hash.slice(0, 32)}`;
    
    const filePath = join(expandedPath, `${cid}.json`);
    await writeFile(filePath, content);
    
    return cid;
  }

  async retrieveLocal(cid) {
    const expandedPath = this.localPath.replace('~', process.env.HOME);
    const filePath = join(expandedPath, `${cid}.json`);
    
    const content = await readFile(filePath, 'utf8');
    
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  /**
   * List all stored items (local only)
   */
  async list() {
    if (this.provider !== 'local') {
      throw new Error('List operation only supported for local storage');
    }
    
    const { readdir } = await import('fs/promises');
    const expandedPath = this.localPath.replace('~', process.env.HOME);
    
    try {
      const files = await readdir(expandedPath);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }
}

export default Storage;
