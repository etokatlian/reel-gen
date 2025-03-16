#!/usr/bin/env node

/**
 * watch.js - A utility to run multiple watch processes in parallel
 * 
 * This script starts both test:watch and lint:watch in parallel,
 * providing continuous feedback as you make changes to your code.
 */

const { spawn } = require('child_process');
const process = require('process');
const readline = require('readline');

// Configure colors for better visibility
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m'
};

// Process information
const processes = [
  {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'test:watchAll'],
    name: 'TESTS',
    color: COLORS.GREEN
  },
  {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'lint:watch'],
    name: 'LINT',
    color: COLORS.BLUE
  }
];

// Helper to format process output
function formatOutput(name, color, data) {
  const lines = data.toString().split('\n').filter(line => line.trim());
  return lines.map(line => `${color}[${name}]${COLORS.RESET} ${line}`).join('\n');
}

// Start all processes
const children = processes.map(({ command, args, name, color }) => {
  console.log(`${color}Starting ${name}...${COLORS.RESET}`);
  
  const child = spawn(command, args, { 
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true
  });
  
  child.stdout.on('data', (data) => {
    console.log(formatOutput(name, color, data));
  });
  
  child.stderr.on('data', (data) => {
    console.error(formatOutput(name, color, data));
  });
  
  child.on('close', (code) => {
    console.log(`${color}${name} process exited with code ${code}${COLORS.RESET}`);
  });
  
  return child;
});

// Handle process exit
process.on('SIGINT', () => {
  console.log(`\n${COLORS.YELLOW}Stopping all processes...${COLORS.RESET}`);
  children.forEach(child => {
    child.kill('SIGINT');
  });
  process.exit(0);
});

// Setup interactive command interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${COLORS.BRIGHT}${COLORS.CYAN}[WATCH] ${COLORS.RESET}`
});

rl.on('line', (line) => {
  const cmd = line.trim();
  
  if (cmd === 'q' || cmd === 'quit' || cmd === 'exit') {
    console.log(`\n${COLORS.YELLOW}Exiting watch mode...${COLORS.RESET}`);
    children.forEach(child => {
      child.kill('SIGINT');
    });
    process.exit(0);
  } else if (cmd === 'h' || cmd === 'help') {
    console.log(`
${COLORS.CYAN}Available commands:${COLORS.RESET}
  q, quit, exit  - Exit watch mode
  h, help        - Show this help message
  c, clear       - Clear the console
`);
  } else if (cmd === 'c' || cmd === 'clear') {
    console.clear();
  }
  
  rl.prompt();
}).on('close', () => {
  console.log(`\n${COLORS.YELLOW}Stopping all processes...${COLORS.RESET}`);
  children.forEach(child => {
    child.kill('SIGINT');
  });
  process.exit(0);
});

console.log(`
${COLORS.BRIGHT}${COLORS.CYAN}Watch mode started${COLORS.RESET}
${COLORS.CYAN}----------------------------${COLORS.RESET}
Tests and linting will run automatically as you make changes.
${COLORS.CYAN}Commands:${COLORS.RESET} q (quit), h (help), c (clear)
`);

rl.prompt();
