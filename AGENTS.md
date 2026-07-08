# AI Agent Project Graph Guide

This repository has a Graphify project graph generated for faster orientation.

Use these files before doing a broad repository scan:

- `.graphify/graph_report.md` - human-readable project graph report.
- `.graphify/graph.json` - canonical Graphify JSON graph.
- `graphify-out/project-graph.html` - visual graph export for humans.
- `graphify-out/project-graph.json` - portable JSON export.

Current graph snapshot:

- Nodes: 1772
- Edges: 3324
- Communities: 284
- Files tracked: 302

Recommended workflow for agents:

1. Read `.graphify/graph_report.md` first to understand the main modules and communities.
2. Use `graphify-out/project-graph.html` for visual navigation.
3. Use Graphify queries for targeted questions instead of scanning all files blindly:

```powershell
nodesify-graphify status --graph .
nodesify-graphify stats --graph .
nodesify-graphify query --graph . "Where is the frontend API data flow?"
nodesify-graphify explain --graph . "frontend/src/App.tsx"
```

Refresh the graph after meaningful code changes:

```powershell
nodesify-graphify run .
nodesify-graphify export --graph . --format html --out graphify-out\project-graph.html
nodesify-graphify export --graph . --format json --out graphify-out\project-graph.json
```

Do not treat the HTML graph as a substitute for source review when making code changes. Use it as a navigation index, then inspect the relevant files directly.
