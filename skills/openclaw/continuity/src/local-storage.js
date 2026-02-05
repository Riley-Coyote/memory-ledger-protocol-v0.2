/**
 * Local Storage - File system operations for standalone skill
 * @module continuity-skill/local-storage
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

/**
 * LocalStorage - Handles file system operations for the standalone skill
 */
export class LocalStorage {
  /**
   * @param {string} basePath - Base path for storage
   */
  constructor(basePath) {
    this.basePath = basePath.replace('~', process.env.HOME || '');
    this.sessionsDir = join(this.basePath, 'sessions');
  }

  /**
   * Initialize storage directories
   */
  async init() {
    const dirs = [
      this.basePath,
      this.sessionsDir
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Read a file
   * @param {string} path - File path (absolute or relative to basePath)
   * @returns {Promise<string>} File content
   */
  async readFile(path) {
    const fullPath = path.startsWith('/') ? path : join(this.basePath, path);
    return readFile(fullPath, 'utf-8');
  }

  /**
   * Write a file
   * @param {string} path - File path (absolute or relative to basePath)
   * @param {string} content - Content to write
   */
  async writeFile(path, content) {
    const fullPath = path.startsWith('/') ? path : join(this.basePath, path);

    // Ensure directory exists
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Check if a file exists
   * @param {string} path - File path
   * @returns {boolean} Whether file exists
   */
  exists(path) {
    const fullPath = path.startsWith('/') ? path : join(this.basePath, path);
    return existsSync(fullPath);
  }

  /**
   * Save a session log
   * @param {string} sessionId - Session ID
   * @param {string} transcript - Session transcript
   */
  async saveSessionLog(sessionId, transcript) {
    const filename = `${sessionId}.txt`;
    const path = join(this.sessionsDir, filename);
    await writeFile(path, transcript, 'utf-8');
    return path;
  }

  /**
   * Load a session log
   * @param {string} sessionId - Session ID
   * @returns {Promise<string|null>} Session transcript or null
   */
  async loadSessionLog(sessionId) {
    const filename = `${sessionId}.txt`;
    const path = join(this.sessionsDir, filename);

    if (!existsSync(path)) {
      return null;
    }

    return readFile(path, 'utf-8');
  }

  /**
   * List session logs
   * @param {number} limit - Maximum logs to return
   * @returns {Promise<string[]>} Session IDs
   */
  async listSessionLogs(limit = 10) {
    if (!existsSync(this.sessionsDir)) {
      return [];
    }

    const files = await readdir(this.sessionsDir);
    return files
      .filter(f => f.endsWith('.txt'))
      .map(f => f.replace('.txt', ''))
      .slice(0, limit);
  }

  /**
   * Get the most recent session log
   * @returns {Promise<Object|null>} Session info or null
   */
  async getMostRecentSession() {
    if (!existsSync(this.sessionsDir)) {
      return null;
    }

    const files = await readdir(this.sessionsDir);
    if (files.length === 0) {
      return null;
    }

    // Get file stats to sort by modification time
    const filesWithStats = await Promise.all(
      files
        .filter(f => f.endsWith('.txt'))
        .map(async f => {
          const path = join(this.sessionsDir, f);
          const stats = await stat(path);
          return {
            filename: f,
            sessionId: f.replace('.txt', ''),
            path,
            mtime: stats.mtime
          };
        })
    );

    // Sort by modification time (newest first)
    filesWithStats.sort((a, b) => b.mtime - a.mtime);

    if (filesWithStats.length === 0) {
      return null;
    }

    const most = filesWithStats[0];
    const transcript = await readFile(most.path, 'utf-8');

    return {
      sessionId: most.sessionId,
      transcript,
      mtime: most.mtime
    };
  }

  /**
   * Clean up old session logs
   * @param {number} keepCount - Number of recent logs to keep
   * @returns {Promise<number>} Number of deleted logs
   */
  async cleanupSessionLogs(keepCount = 50) {
    if (!existsSync(this.sessionsDir)) {
      return 0;
    }

    const files = await readdir(this.sessionsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    if (txtFiles.length <= keepCount) {
      return 0;
    }

    // Get file stats
    const filesWithStats = await Promise.all(
      txtFiles.map(async f => {
        const path = join(this.sessionsDir, f);
        const stats = await stat(path);
        return { path, mtime: stats.mtime };
      })
    );

    // Sort by modification time (oldest first)
    filesWithStats.sort((a, b) => a.mtime - b.mtime);

    // Delete oldest files
    const toDelete = filesWithStats.slice(0, filesWithStats.length - keepCount);
    const { unlink } = await import('fs/promises');

    for (const file of toDelete) {
      await unlink(file.path);
    }

    return toDelete.length;
  }
}

export default LocalStorage;
