# 🔫 Port Sniper

> **Instantly hunt down and headshot zombie processes holding your ports hostage.**

```
    ██████╗  ██████╗ ██████╗ ████████╗    ███████╗███╗   ██╗██╗██████╗ ███████╗██████╗ 
    ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝    ██╔════╝████╗  ██║██║██╔══██╗██╔════╝██╔══██╗
    ██████╔╝██║   ██║██████╔╝   ██║       ███████╗██╔██╗ ██║██║██████╔╝█████╗  ██████╔╝
    ██╔═══╝ ██║   ██║██╔══██╗   ██║       ╚════██║██║╚██╗██║██║██╔═══╝ ██╔══╝  ██╔══██╗
    ██║     ╚██████╔╝██║  ██║   ██║       ███████║██║ ╚████║██║██║     ███████╗██║  ██║
    ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
```

<p align="center">
  <strong>Architected by <a href="https://github.com/lakshanmuruganandam">@lakshanmuruganandam</a></strong>
</p>

---

## ⚡ Quick Start

Zero install. Run it instantly with `npx`:

```bash
npx port-sniper-cli
```

Or install globally for instant access:
```bash
npm install -g port-sniper-cli
port-sniper
```

---

## 🔥 Why Port Sniper?

"Port 3000 is already in use." Every developer hates this error. Usually, you have to run `lsof -i :3000`, copy the PID, and type `kill -9 <pid>`.

**Port Sniper** does it all in one interactive, beautiful interface:

1. **Auto-Scans All Ports** — Instantly finds every listening TCP port.
2. **Interactive TUI** — Select multiple processes with arrow keys and Space.
3. **Smart Highlighting** — Colors common dev tools (Node, Python, Go) cyan, and warns you about SYSTEM processes in red.
4. **Instant Kill** — Hit Enter and watch them drop.

---

## 🛠️ Usage

### Default Mode
Scan all open ports and select which to kill:
```bash
npx port-sniper-cli
```

### Targeted Sniper Mode
Directly snipe a specific port:
```bash
npx port-sniper-cli -p 3000
```

### Dry Run
See what would be killed without actually harming anything:
```bash
npx port-sniper-cli --dry-run
```

---

## 📄 License
MIT
