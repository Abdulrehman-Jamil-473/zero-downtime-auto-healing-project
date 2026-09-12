# Zero-Downtime Auto-Healing Deployment Platform

A self-healing, multi-tier deployment platform that eliminates downtime during releases and automatically recovers from failures — built to solve real problems that production teams face every day.

---

## The Problem

When companies push updates to a live application, three things commonly go wrong:

| Problem | Impact |
|---|---|
| **Downtime during deployment** | Restarting a server to release new code takes the application offline for seconds/minutes — users see errors, businesses lose revenue. |
| **Bad deployments break production** | A buggy release can crash the live app, forcing an engineer to manually roll it back — slow and error-prone. |
| **Silent container crashes** | A container can crash at 3 AM with no one watching, and stays down until a user complains. |

This project automates all three away.

---

## The Solution — Architecture

```
                      ┌─────────────┐
   User Request  ───▶ │    Nginx    │  (Reverse Proxy / Traffic Controller)
                      └──────┬──────┘
                             │
                 routes to ACTIVE slot only
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │  Backend BLUE    │           │  Backend GREEN   │
     │  (Node/Express)  │           │  (Node/Express)  │
     └────────┬─────────┘           └────────┬─────────┘
              │                              │
              └──────────────┬───────────────┘
                              ▼
                      ┌───────────────┐
                      │    MongoDB    │
                      └───────────────┘

   ┌─────────────────────────────────────────────────┐
   │  CI/CD (Jenkins, separate server)                │
   │  Push code → Build image → Push to Docker Hub    │
   │  → SSH deploy to inactive slot → Health-check     │
   │  → Switch traffic (or auto-rollback if unhealthy) │
   └─────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────┐
   │  Cron-based Auto-Healing (every 1 min)            │
   │  Checks all containers → restarts any that        │
   │  crashed or became unhealthy                       │
   └─────────────────────────────────────────────────┘
```

**Tech stack:** Node.js/Express · MongoDB · Docker & Docker Compose · Nginx · Jenkins · Docker Hub · AWS EC2 · Bash

---

## How Each Problem Was Solved

### 1. Zero-Downtime Deployment — Blue-Green Strategy
Two identical backend environments run at all times — **Blue** and **Green**. Only one serves live traffic at any moment (controlled by Nginx). New code deploys to the *inactive* slot first, is verified, and only then does Nginx switch traffic to it — a config reload that takes milliseconds, with no dropped requests and no container restart on the live side.

### 2. Auto-Rollback — Health-Checked Deployments
Every deployment is followed by an automated health check (`GET /health`) against the newly deployed slot **before** it receives any real traffic. If the check fails, the pipeline automatically discards the broken container and leaves the previous (working) version live — no human has to intervene at 2 AM.

### 3. Auto-Healing — Continuous Monitoring
A lightweight script runs via cron every minute, independently of any deployment, and checks whether each container is running and responding correctly. If a container has silently crashed or become unresponsive, it's restarted automatically — with every action logged for auditability.

### 4. CI/CD Automation — Jenkins Pipeline
Pushing code triggers a fully automated pipeline: build a Docker image → push it to Docker Hub → SSH into the application server → deploy to the inactive slot → health-check → switch traffic. What used to be a multi-step manual process is now a single "Build Now" click (or, extendable to a Git webhook, fully automatic on every push).

**Design note:** Jenkins runs on a dedicated EC2 instance, separate from the application server — matching industry practice for resource isolation and security (a compromised or overloaded CI server should never be able to take down production).

---

## Project Structure

```
zero-downtime-platform/
├── frontend/              # Static UI (served by Nginx)
├── backend/                # Node.js/Express API + multi-stage Dockerfile
├── nginx/                  # Reverse proxy + blue-green traffic config
├── docker-compose.yml      # Orchestrates mongo, backend-blue, backend-green, nginx
├── Jenkinsfile              # CI/CD pipeline definition
├── deploy.sh                # Blue-green deploy + health-check + auto-rollback logic
└── healthcheck.sh            # Cron-driven auto-healing script
```
