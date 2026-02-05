#!/usr/bin/env node
/**
 * Continuity CLI - Command-line interface for the standalone skill
 */

import { ContinuitySkill } from './index.js';

const skill = new ContinuitySkill();

/**
 * Parse command-line arguments
 */
function parseArgs(args) {
  const parsed = {
    command: null,
    options: {},
    positional: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];

      if (next && !next.startsWith('--')) {
        parsed.options[key] = next;
        i++;
      } else {
        parsed.options[key] = true;
      }
    } else if (!parsed.command) {
      parsed.command = arg;
    } else {
      parsed.positional.push(arg);
    }
  }

  return parsed;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Continuity Framework - Memory Reflection CLI

Usage:
  continuity <command> [options]

Commands:
  reflect      Reflect on recent session
  questions    Show pending questions
  status       Show memory and continuity statistics
  greet        Generate session greeting with questions
  resolve      Mark question as resolved

Options:
  --session <file>    Session transcript file (for reflect)
  --limit <n>         Limit results (for questions)
  --summary <text>    Answer summary (for resolve)
  --skip              Skip question instead of answering (for resolve)

Examples:
  continuity reflect --session session.txt
  continuity questions --limit 5
  continuity greet
  continuity status
  continuity resolve q_abc123 --summary "Discussed and resolved"
  continuity resolve q_abc123 --skip

Environment:
  CONTINUITY_MEMORY_DIR      Base directory for memory storage
  CONTINUITY_IDLE_THRESHOLD  Seconds of idle before reflection triggers
  CONTINUITY_MIN_MESSAGES    Minimum messages to warrant reflection
  CONTINUITY_QUESTION_LIMIT  Max questions to surface at once
`);
}

/**
 * Format output as YAML-like
 */
function formatOutput(data, indent = 0) {
  const prefix = '  '.repeat(indent);

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `${prefix}(none)`;
    }
    return data.map((item, i) => {
      if (typeof item === 'object') {
        return `${prefix}- ${formatOutput(item, indent + 1).trim()}`;
      }
      return `${prefix}- ${item}`;
    }).join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => {
        if (typeof v === 'object') {
          return `${prefix}${k}:\n${formatOutput(v, indent + 1)}`;
        }
        return `${prefix}${k}: ${v}`;
      })
      .join('\n');
  }

  return `${prefix}${data}`;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const parsed = parseArgs(args);

  try {
    await skill.init();

    let result;

    switch (parsed.command) {
      case 'reflect':
        console.log('=== Continuity Reflection ===\n');
        result = await skill.reflect({
          session: parsed.options.session
        });
        break;

      case 'questions':
        console.log('=== Pending Questions ===\n');
        result = await skill.questions({
          limit: parseInt(parsed.options.limit || '10')
        });
        break;

      case 'status':
        console.log('=== Continuity Status ===\n');
        result = await skill.status();
        break;

      case 'greet':
        console.log('=== Session Greeting ===\n');
        result = await skill.greet({
          limit: parseInt(parsed.options.limit || '3')
        });
        break;

      case 'resolve':
        if (parsed.positional.length === 0) {
          console.error('Error: Question ID required');
          process.exit(1);
        }
        result = await skill.resolve(parsed.positional[0], {
          summary: parsed.options.summary,
          skip: parsed.options.skip === true,
          reason: parsed.options.reason
        });
        break;

      default:
        console.error(`Unknown command: ${parsed.command}`);
        console.log('Run with --help for usage information');
        process.exit(1);
    }

    console.log(formatOutput(result));

  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
