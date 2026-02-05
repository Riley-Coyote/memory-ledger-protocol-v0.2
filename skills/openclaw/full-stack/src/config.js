/**
 * Configuration for MLP Continuity
 * @module mlp-continuity/config
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  // Continuity settings
  continuity: {
    memoryDir: join(process.env.HOME || '~', 'clawd', 'memory'),
    idleThreshold: 1800,
    minMessages: 5,
    questionLimit: 3
  },

  // MLP settings
  mlp: {
    version: '0.2',
    configPath: join(process.env.HOME || '~', '.openclaw', 'mlp-config.yaml')
  },

  // Storage settings
  storage: {
    provider: 'local',
    path: join(process.env.HOME || '~', '.openclaw', 'mlp-blobs')
  },

  // Encryption settings
  encryption: {
    algorithm: 'XChaCha20-Poly1305',
    keyPath: join(process.env.HOME || '~', '.openclaw', 'keys')
  },

  // Identity settings
  identity: {
    kernelPath: join(process.env.HOME || '~', '.openclaw', 'identity-kernel.yaml'),
    epochDuration: 'P30D'
  },

  // Agent settings
  agents: {
    classifier: {
      id: 'continuity-classifier',
      model: 'anthropic/claude-sonnet-4'
    },
    scorer: {
      id: 'continuity-scorer',
      model: 'anthropic/claude-sonnet-4'
    },
    generator: {
      id: 'continuity-generator',
      model: 'anthropic/claude-sonnet-4'
    }
  }
};

/**
 * Load configuration from environment and files
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig() {
  const config = { ...DEFAULT_CONFIG };

  // Override from environment
  if (process.env.CONTINUITY_MEMORY_DIR) {
    config.continuity.memoryDir = process.env.CONTINUITY_MEMORY_DIR;
  }
  if (process.env.CONTINUITY_IDLE_THRESHOLD) {
    config.continuity.idleThreshold = parseInt(process.env.CONTINUITY_IDLE_THRESHOLD);
  }
  if (process.env.CONTINUITY_QUESTION_LIMIT) {
    config.continuity.questionLimit = parseInt(process.env.CONTINUITY_QUESTION_LIMIT);
  }
  if (process.env.MLP_CONFIG_PATH) {
    config.mlp.configPath = process.env.MLP_CONFIG_PATH;
  }

  // Load MLP config file if exists
  const mlpConfigPath = config.mlp.configPath.replace('~', process.env.HOME || '');

  if (existsSync(mlpConfigPath)) {
    try {
      const content = await readFile(mlpConfigPath, 'utf-8');
      const mlpConfig = YAML.parse(content);

      // Merge MLP config
      if (mlpConfig.storage) {
        config.storage = { ...config.storage, ...mlpConfig.storage };

        // Handle environment variable interpolation
        if (config.storage.jwt && config.storage.jwt.startsWith('${')) {
          const envVar = config.storage.jwt.slice(2, -1);
          config.storage.jwt = process.env[envVar];
        }
        if (config.storage.gateway && config.storage.gateway.startsWith('${')) {
          const envVar = config.storage.gateway.slice(2, -1);
          config.storage.gateway = process.env[envVar];
        }
      }

      if (mlpConfig.encryption) {
        config.encryption = { ...config.encryption, ...mlpConfig.encryption };
      }

      if (mlpConfig.identity) {
        config.identity = { ...config.identity, ...mlpConfig.identity };
      }
    } catch (e) {
      console.warn(`Failed to load MLP config: ${e.message}`);
    }
  }

  // Override from Pinata environment variables
  if (process.env.PINATA_JWT) {
    config.storage.provider = 'pinata';
    config.storage.jwt = process.env.PINATA_JWT;
  }
  if (process.env.PINATA_GATEWAY) {
    config.storage.gateway = process.env.PINATA_GATEWAY;
  }

  return config;
}

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateConfig(config) {
  const errors = [];

  // Check required paths
  if (!config.continuity?.memoryDir) {
    errors.push('continuity.memoryDir is required');
  }

  // Check storage configuration
  if (config.storage?.provider === 'pinata') {
    if (!config.storage.jwt) {
      errors.push('storage.jwt is required for Pinata provider');
    }
    if (!config.storage.gateway) {
      errors.push('storage.gateway is required for Pinata provider');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default { loadConfig, validateConfig };
