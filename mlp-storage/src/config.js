/**
 * Config - MLP configuration management
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import YAML from 'yaml';

const DEFAULT_CONFIG = {
  storage: {
    provider: 'local',
    endpoint: null,
    local_path: '~/.config/mlp/storage'
  },
  identity: {
    kernel_path: '~/.config/mlp/identity-kernel.json'
  },
  encryption: {
    key_path: '~/.config/mlp/keys',
    algorithm: 'xchacha20-poly1305'
  },
  token: {
    network: 'solana',
    address: 'H1DKS5SWqPzzt4WaQahafaWe5nJ56xf2xqtYwvdapump',
    enabled: false
  },
  sync: {
    auto_sync: false,
    sync_interval_minutes: 60,
    on_heartbeat: true
  }
};

export class Config {
  constructor(configPath) {
    this.configPath = configPath?.replace('~', process.env.HOME) || 
                      `${process.env.HOME}/.config/mlp/config.yaml`;
    this.loaded = false;
    
    // Initialize with defaults
    Object.assign(this, DEFAULT_CONFIG);
  }

  /**
   * Load config from file
   */
  async load() {
    try {
      const content = await readFile(this.configPath, 'utf8');
      const parsed = YAML.parse(content);
      
      // Merge with defaults
      this.storage = { ...DEFAULT_CONFIG.storage, ...parsed.storage };
      this.identity = { ...DEFAULT_CONFIG.identity, ...parsed.identity };
      this.encryption = { ...DEFAULT_CONFIG.encryption, ...parsed.encryption };
      this.token = { ...DEFAULT_CONFIG.token, ...parsed.token };
      this.sync = { ...DEFAULT_CONFIG.sync, ...parsed.sync };
      
      this.loaded = true;
      return this;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Create default config
        await this.save();
        this.loaded = true;
        return this;
      }
      throw err;
    }
  }

  /**
   * Save config to file
   */
  async save() {
    await mkdir(dirname(this.configPath), { recursive: true });
    
    const content = YAML.stringify({
      storage: this.storage,
      identity: this.identity,
      encryption: this.encryption,
      token: this.token,
      sync: this.sync
    });
    
    await writeFile(this.configPath, content);
    return this;
  }

  /**
   * Update config values
   */
  async update(changes) {
    if (changes.storage) {
      this.storage = { ...this.storage, ...changes.storage };
    }
    if (changes.identity) {
      this.identity = { ...this.identity, ...changes.identity };
    }
    if (changes.encryption) {
      this.encryption = { ...this.encryption, ...changes.encryption };
    }
    if (changes.token) {
      this.token = { ...this.token, ...changes.token };
    }
    if (changes.sync) {
      this.sync = { ...this.sync, ...changes.sync };
    }
    
    await this.save();
    return this;
  }

  /**
   * Get expanded paths (~ replaced with HOME)
   */
  getExpandedPaths() {
    const home = process.env.HOME;
    return {
      storage: this.storage.local_path?.replace('~', home),
      identity: this.identity.kernel_path?.replace('~', home),
      encryption: this.encryption.key_path?.replace('~', home),
      config: this.configPath
    };
  }

  /**
   * Validate config
   */
  validate() {
    const errors = [];
    
    if (!['ipfs', 'arweave', 'local'].includes(this.storage.provider)) {
      errors.push(`Invalid storage provider: ${this.storage.provider}`);
    }
    
    if (this.storage.provider !== 'local' && !this.storage.endpoint) {
      errors.push(`Storage endpoint required for provider: ${this.storage.provider}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default Config;
