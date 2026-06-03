#!/usr/bin/env node

import { execSync } from 'child_process';
import enquirer from 'enquirer';
import pc from 'picocolors';
import { Command } from 'commander';
import kill from 'tree-kill';
import boxen from 'boxen';
import pidusage from 'pidusage';
import cliSpinners from 'cli-spinners';
import logUpdate from 'log-update';

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

const SYSTEM_PROCESSES = ['launchd', 'syslogd', 'kextd', 'fseventsd', 'distnoted', 'mds', 'systemstats', 'sshd', 'rapportd', 'ControlCe'];

function getListeningPorts() {
  try {
    const output = execSync('lsof -iTCP -sTCP:LISTEN -P -n', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = output.trim().split('\n').slice(1);
    const processes = [];

    lines.forEach(line => {
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
    return [];
  }
}

function killProcess(pid, name, dryRun) {
  return new Promise((resolve) => {
    if (dryRun) {
      setTimeout(() => resolve(true), 300); // simulate delay
      return;
    }
    kill(pid, 'SIGKILL', (err) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function run() {
  console.log(BANNER);
  console.log(pc.gray(' Architected by @lakshanmuruganandam \n'));

  if (options.dryRun) {
    console.log(boxen(pc.yellow('⚠️ DRY RUN MODE ENABLED - No processes will be harmed'), { padding: 0, margin: { bottom: 1 }, borderStyle: 'round', borderColor: 'yellow' }));
  }

  // Animated scanner
  const spinner = cliSpinners.dots;
  let i = 0;
  const timer = setInterval(() => {
    logUpdate(pc.cyan(`${spinner.frames[i = ++i % spinner.frames.length]} Scanning network interfaces & gathering telemetry...`));
  }, spinner.interval);

  const processes = getListeningPorts();
  
  // Gather memory and CPU stats
  const pids = processes.map(p => p.pid);
  let stats = {};
  if (pids.length > 0) {
    try {
      stats = await pidusage(pids);
    } catch (e) {
      // Ignore if some processes died in the meantime
    }
  }

  clearInterval(timer);
  logUpdate.clear();

  if (processes.length === 0) {
    console.log(pc.green('\n✨ Sector clear. No zombie processes detected.'));
    process.exit(0);
  }

  const targetProcesses = options.port 
    ? processes.filter(p => p.port === options.port)
    : processes;

  if (options.port && targetProcesses.length === 0) {
    console.log(pc.green(`\n✨ Port ${options.port} is already free.`));
    process.exit(0);
  }

  const choices = targetProcesses.map(p => {
    const isSystem = SYSTEM_PROCESSES.includes(p.name);
    const stat = stats[p.pid] || { cpu: 0, memory: 0 };
    
    const cpuRaw = `${stat.cpu.toFixed(1)}%`;
    const memRaw = formatBytes(stat.memory);
    
    const cpuStr = pc.magenta(cpuRaw.padEnd(5));
    const memStr = pc.blue(memRaw.padEnd(8));
    
    let displayName = p.name;
    if (isSystem) displayName += '*';
    
    displayName = displayName.length > 15 ? displayName.substring(0, 13) + '..' : displayName;
    displayName = displayName.padEnd(15);
    
    let nameColored;
    if (isSystem) nameColored = pc.red(displayName);
    else if (p.name.includes('node') || p.name.includes('python') || p.name.includes('go')) nameColored = pc.cyan(displayName);
    else nameColored = pc.white(displayName);

    let pidStr = String(p.pid).padEnd(5);
    let hintStr = pc.gray(`PID:${pidStr} | `) + cpuStr + pc.gray(` | `) + memStr;
    if (isSystem) hintStr += pc.red(' ⚠️');

    return {
      name: `${p.port}-${p.pid}`,
      message: `${p.port.padEnd(5)} 🎯 ${nameColored}  ${hintStr}`,
      value: p
    };
  });

  const { selected } = await enquirer.prompt({
    type: 'multiselect',
    name: 'selected',
    message: 'Select targets to headshot (Space to select, Enter to execute):',
    choices: choices,
    limit: 10,
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
      const { confirm } = await enquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: pc.bgRed(pc.white(` WARNING: ${target.name} is a SYSTEM process. Killing it may crash your OS. Proceed? `)),
        initial: false
      });
      if (!confirm) {
        console.log(pc.gray(`Skipped ${target.name}`));
        continue;
      }
    }

    const killSpinner = cliSpinners.sniper || cliSpinners.dots;
    let k = 0;
    const kTimer = setInterval(() => {
      logUpdate(pc.red(`${killSpinner.frames[k = ++k % killSpinner.frames.length]} Engaging PID ${target.pid} on Port ${target.port}...`));
    }, killSpinner.interval);

    const success = await killProcess(target.pid, target.name, options.dryRun);
    
    clearInterval(kTimer);
    if (success) {
      logUpdate(pc.red(`💥 HEADSHOT `) + pc.white(`Port ${target.port} `) + pc.gray(`(PID ${target.pid}) `) + pc.green('OBLITERATED'));
      logUpdate.done();
      killed++;
    } else {
      logUpdate(pc.red(`❌ MISS `) + pc.white(`Port ${target.port} `) + pc.gray(`(PID ${target.pid}) survived.`));
      logUpdate.done();
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
