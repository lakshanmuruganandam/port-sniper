#!/usr/bin/env node

import { execSync } from 'child_process';
import enquirer from 'enquirer';
import pc from 'picocolors';
import { Command } from 'commander';
import kill from 'tree-kill';
import boxen from 'boxen';

const program = new Command();

program
  .name('port-sniper')
  .description('Instantly hunt down and headshot zombie processes holding your ports hostage.')
  .version('1.0.0')
  .option('-p, --port <number>', 'Snipe a specific port immediately')
  .option('--dry-run', 'Simulate the kill without actually killing')
  .parse(process.argv);

const options = program.opts();

const BANNER = pc.red(`
    ██████╗  ██████╗ ██████╗ ████████╗    ███████╗███╗   ██╗██╗██████╗ ███████╗██████╗ 
    ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝    ██╔════╝████╗  ██║██║██╔══██╗██╔════╝██╔══██╗
    ██████╔╝██║   ██║██████╔╝   ██║       ███████╗██╔██╗ ██║██║██████╔╝█████╗  ██████╔╝
    ██╔═══╝ ██║   ██║██╔══██╗   ██║       ╚════██║██║╚██╗██║██║██╔═══╝ ██╔══╝  ██╔══██╗
    ██║     ╚██████╔╝██║  ██║   ██║       ███████║██║ ╚████║██║██║     ███████╗██║  ██║
    ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
`);

// Critical system processes that shouldn't be killed
const SYSTEM_PROCESSES = ['launchd', 'syslogd', 'kextd', 'fseventsd', 'distnoted', 'mds', 'systemstats', 'sshd', 'rapportd', 'ControlCe'];

function getListeningPorts() {
  try {
    // macOS/Linux
    const output = execSync('lsof -iTCP -sTCP:LISTEN -P -n', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = output.trim().split('\n').slice(1); // skip header
    const processes = [];

    lines.forEach(line => {
      // Example line: node 12345 user 22u IPv4 0x1234 0t0 TCP *:3000 (LISTEN)
      const parts = line.split(/\s+/);
      if (parts.length >= 9) {
        const name = parts[0];
        const pid = parts[1];
        const user = parts[2];
        const address = parts[8];
        const portMatch = address.match(/:(\d+)$/);
        
        if (portMatch) {
          const port = portMatch[1];
          processes.push({ name, pid, user, port, raw: line });
        }
      }
    });
    
    // Deduplicate by port + pid
    const unique = [];
    const seen = new Set();
    processes.forEach(p => {
      const key = `${p.port}-${p.pid}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    });
    
    return unique.sort((a, b) => parseInt(a.port) - parseInt(b.port));
  } catch (err) {
    // If lsof fails (e.g. no ports or Windows), return empty
    // To make it perfect, we could add netstat for Windows, but lsof is great for Mac/Linux
    return [];
  }
}

function killProcess(pid, name, dryRun) {
  return new Promise((resolve) => {
    if (dryRun) {
      console.log(pc.yellow(`[DRY RUN] Would kill PID ${pid} (${name})`));
      resolve(true);
      return;
    }
    kill(pid, 'SIGKILL', (err) => {
      if (err) {
        console.log(pc.red(`Failed to kill PID ${pid} (${name}): ${err.message}`));
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function run() {
  console.log(BANNER);
  console.log(pc.gray(' Architected by @lakshanmuruganandam \n'));

  if (options.dryRun) {
    console.log(pc.yellow('⚠️  DRY RUN MODE ENABLED - No processes will be actually killed\n'));
  }

  console.log(pc.cyan('📡 Scanning for open ports...'));
  const processes = getListeningPorts();

  if (processes.length === 0) {
    console.log(pc.green('\n✨ Your ports are clean! No listening processes found.'));
    process.exit(0);
  }

  // Filter if specific port is requested
  const targetProcesses = options.port 
    ? processes.filter(p => p.port === options.port)
    : processes;

  if (options.port && targetProcesses.length === 0) {
    console.log(pc.green(`\n✨ Port ${options.port} is already free.`));
    process.exit(0);
  }

  // Build choices for TUI
  const choices = targetProcesses.map(p => {
    const isSystem = SYSTEM_PROCESSES.includes(p.name);
    let nameColored = p.name;
    let desc = `PID: ${p.pid.padEnd(6)} | User: ${p.user}`;
    
    if (isSystem) {
      nameColored = pc.red(p.name + ' [SYSTEM]');
      desc += pc.red(' (WARNING: System process)');
    } else if (p.name.includes('node') || p.name.includes('python') || p.name.includes('go')) {
      nameColored = pc.cyan(p.name);
    } else {
      nameColored = pc.white(p.name);
    }

    return {
      name: `${p.port}-${p.pid}`,
      message: `Port ${p.port.padEnd(5)} 🎯 ${nameColored.padEnd(30)}`,
      hint: pc.gray(desc),
      value: p
    };
  });

  const { selected } = await enquirer.prompt({
    type: 'multiselect',
    name: 'selected',
    message: 'Select targets to headshot (Space to select, Enter to execute):',
    choices: choices,
    result(names) {
      return this.map(names);
    }
  });

  const targets = Object.values(selected);

  if (targets.length === 0) {
    console.log(pc.gray('\nRetreating. No targets engaged.'));
    process.exit(0);
  }

  console.log();
  let killed = 0;
  for (const target of targets) {
    if (SYSTEM_PROCESSES.includes(target.name) && !options.dryRun) {
      // Extra confirmation for system processes
      const { confirm } = await enquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: pc.red(`WARNING: ${target.name} is a system process. Killing it may cause system instability. Are you absolutely sure?`),
        initial: false
      });
      if (!confirm) {
        console.log(pc.gray(`Skipped ${target.name}`));
        continue;
      }
    }

    process.stdout.write(pc.red(`💥 HEADSHOT `) + pc.white(`Port ${target.port} `) + pc.gray(`(PID ${target.pid} - ${target.name})... `));
    const success = await killProcess(target.pid, target.name, options.dryRun);
    if (success) {
      console.log(pc.green('OBLITERATED'));
      killed++;
    }
  }

  const summary = boxen(
    pc.white(`Targets Eliminated: ${pc.red(killed)}\n`) +
    pc.gray(`Mission Accomplished.`),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'red' }
  );

  console.log(summary);
}

run().catch(err => {
  console.error(pc.red('\nFatal error:'), err);
  process.exit(1);
});
