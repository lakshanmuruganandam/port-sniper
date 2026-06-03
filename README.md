<div align="center">

# 🎯 Port Sniper CLI

> **Instantly hunt down and headshot zombie processes holding your ports hostage.**

[![npm version](https://badge.fury.io/js/port-sniper-cli.svg)](https://www.npmjs.com/package/port-sniper-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

</div>

```text
    ██████╗  ██████╗ ██████╗ ████████╗    ███████╗███╗   ██╗██╗██████╗ ███████╗██████╗ 
    ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝    ██╔════╝████╗  ██║██║██╔══██╗██╔════╝██╔══██╗
    ██████╔╝██║   ██║██████╔╝   ██║       ███████╗██╔██╗ ██║██║██████╔╝█████╗  ██████╔╝
    ██╔═══╝ ██║   ██║██╔══██╗   ██║       ╚════██║██║╚██╗██║██║██╔═══╝ ██╔══╝  ██╔══██╗
    ██║     ╚██████╔╝██║  ██║   ██║       ███████║██║ ╚████║██║██║     ███████╗██║  ██║
    ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
```

Ever tried to start your dev server, only to get slapped with `EADDRINUSE: address already in use :::3000`? 

**Port Sniper** is a blazing-fast, interactive CLI that finds exactly what is running on your ports, displays real-time CPU & RAM telemetry, and lets you securely "headshot" (kill) the offending processes with a beautifully animated interface.

## ✨ Features

- **📡 Real-Time Telemetry:** Instantly see the CPU % and RAM usage of every process holding a port.
- **🛡️ System Protection:** Automatically detects critical OS processes and warns you before you accidentally nuke your system.
- **⚡ Interactive UI:** Built on the robust `inquirer` engine. No more memorizing PIDs or typing `kill -9`. Just select and hit Enter.
- **🎨 Beautiful Aesthetics:** Custom ASCII art, gradient spinners, and satisfying terminal animations.
- **🌍 Cross-Platform:** Works flawlessly on macOS, Linux, and Windows.

## 🚀 Installation

You can run it instantly without installing:

```bash
npx port-sniper-cli
```

Or install it globally to keep the sniper rifle in your holster at all times:

```bash
npm install -g port-sniper-cli
```

## 🎮 Usage

Simply run the command anywhere in your terminal:

```bash
port-sniper
```

### Controls:
- **`↑ / ↓`** : Navigate the list of active ports.
- **`Space`** : Select the target(s) you want to eliminate.
- **`a`** : Select ALL targets (use with caution).
- **`i`** : Invert selection.
- **`Enter`** : Pull the trigger.

## 🛠️ How it works

1. It recursively scans your system using `find-process` to identify every active process bound to a network port.
2. It fetches real-time performance stats using `pidusage`.
3. It presents them in an interactive CLI, categorizing dangerous system tasks to prevent catastrophic crashes.
4. It executes `tree-kill` to safely terminate the process and all its children.

---

### Architected by [@lakshanmuruganandam](https://github.com/lakshanmuruganandam)
*Built for developers who don't have time for zombie ports.*
