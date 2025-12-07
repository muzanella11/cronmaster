# ⏱️ cronmaster

A lightweight and extensible cron job manager for Node.js with persistence, timezone support, rolling jobs, and human-readable schedules.

![npm version](https://img.shields.io/npm/v/cronmaster.svg)
![license](https://img.shields.io/github/license/yourname/cronmaster.svg)
![tests](https://img.shields.io/github/actions/workflow/status/yourname/cronmaster/test.yml?label=tests)

---

## ✨ Features

- 🕒 **Programmatic Cron Management** — create, start, stop, and delete cron jobs dynamically.
- 🌍 **Timezone Support** using `moment-timezone`.
- 💾 **Persistent Storage** (MemoryStore, FileStore, extendable to Redis).
- 🔁 **Rolling Jobs** — generate multiple recurring jobs in one call.
- 🧠 **Human-Readable Cron Expressions** using `cronstrue`.
- ⚡ **Fully Typed with TypeScript**.
- 🧪 **Jest-tested** and production-ready.

---

## 📦 Installation

```bash
npm install cronmaster
# or
yarn add cronmaster
```
