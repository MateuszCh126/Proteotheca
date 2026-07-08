# BRIEFING — 2026-06-10T21:26:40+02:00

## Mission
Complete Milestone 2 (PyMOL Rendering Service), Milestone 4 (Interactive Mol* viewer & STRING graph), Milestone 5 (E2E Integration), and Milestone 6 (Coverage Hardening) for the BioMed Explorer project.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: D:/github/github/med/.agents/orchestrator_restart/
- Original parent: main agent
- Original parent conversation ID: 53fa3508-1fce-41aa-8c31-012f19ca15aa

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: D:/github/github/med/PROJECT.md
1. **Decompose**: Decompose the remaining scope (Milestone 2, Milestone 4, Milestone 5, and Milestone 6) and coordinate parallel/sequential tracks.
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: Explorer → Worker → Reviewer → gate
   - **Delegate (sub-orchestrator)**: Spawn sub-orchestrators for milestones.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns. Write handoff.md, spawn successor, transfer parent and subagents.
- **Work items**:
  1. Complete global PROJECT.md update with 30 tools [pending]
  2. Complete Milestone 2: PyMOL & 30 Backend Services [pending]
  3. Complete Milestone 4: Interactive Frontend & 30 UI Visuals [pending]
  4. Complete Milestone 5: E2E Integration & 71+ Playwright tests [pending]
  5. Complete Milestone 6: Coverage Hardening (Tier 5) [pending]
- **Current phase**: 2
- **Current focus**: Update global PROJECT.md and implement Milestone 2 (PyMOL & 30 Backend Services).

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- You MAY use file-editing tools ONLY for metadata/state files (.md) in your .agents/ folder.
- Forensic Auditor verdict is binary veto — clean verdict required, cheating/dummy implementations strictly forbidden.
- Zero-tolerance for hardcoded test results or facade implementations.
- Do not access external websites/APIs directly (CODE_ONLY network mode).

## Current Parent
- Conversation ID: 53fa3508-1fce-41aa-8c31-012f19ca15aa
- Updated: not yet

## Key Decisions Made
- Resuming using the Project Pattern, starting by delegating exploration and implementation of Milestone 2 and Milestone 4.
- Integrating all 30 requested databases into backend services and frontend panels.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_1 | teamwork_preview_explorer | Explore codebase and plan M2, M4, M5, M6 | completed | 1403443f-9749-42bc-beb3-18b8d137c649 |
| worker_m2_backend | teamwork_preview_worker | Update PROJECT.md, implement PyMOL and 30 services | completed | 7d74bc2c-5eab-4605-a3c5-189a8beb297e |
| auditor_m2 | teamwork_preview_auditor | Audit backend implementation and verify tests | completed | 9e575ea7-8adc-4f09-8274-a92b9672d215 |
| worker_m4_frontend | teamwork_preview_worker | Implement Mol*, force graph, and 30 UI visuals | failed | b3b0fdcf-9fe7-43c4-896b-dab35068a70d |
| worker_m4_m5 | teamwork_preview_worker | Verify frontend build, connect backend, write E2E tests | in-progress | 03ce38cd-1797-4afa-9e4a-c18b49cd96d7 |

## Succession Status
- Succession required: no
- Spawn count: 5 / 16
- Pending subagents: 03ce38cd-1797-4afa-9e4a-c18b49cd96d7
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-59
- Safety timer: task-96
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- D:/github/github/med/PROJECT.md — Global project index
- D:/github/github/med/.agents/orchestrator_restart/progress.md — Internal status heartbeat
- D:/github/github/med/.agents/orchestrator_restart/context.md — Context recovery tracking
