# E2E Testing Context

## Objective
Design, implement, and run a comprehensive E2E test suite under `tests_e2e/` for the BioMed Explorer application.

## Core Features
1. Gene Symbol Search (R1.1)
2. Genetic Variant Search (R1.2)
3. Disease/Indication Search (R1.3)
4. Interactive Mol* Viewer (R2)
5. PyMOL Rendering Engine (R3)
6. Premium Scientific UI (R4)

## Architecture & Tech Stack
- Frontend: React / Vite / TypeScript
- Backend: FastAPI / Python / PyMOL
- Testing: Python-based (requests/pytest) and/or Node.js/Playwright
  *Let's check if the project has a preference. Usually, since we want to run all in a simple, portable manner, we can use Playwright (either Python or Node.js). Let's let the Explorer agent analyze what tools are installed and recommend the best test runner architecture.*

## Workspaces
- Root: `c:/Users/gamin/Desktop/github/med`
- E2E Tests: `c:/Users/gamin/Desktop/github/med/tests_e2e/`
