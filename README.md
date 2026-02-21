# Superhero Workbench (Phase 2)

Local-first workflow builder for creating and debugging hero section generation pipelines.

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- React Flow (`@xyflow/react`)
- Prisma + SQLite

## Project structure

```bash
app/
  builder/page.tsx
  workflows/page.tsx
  api/workflow/run/route.ts
  api/workflow/run-from-node/route.ts
  api/workflow/latest/route.ts

components/
  builder/              # shell, canvas, inspector, logs, toolbar
  ui/                   # base UI components

engine/
  nodes/*               # node implementations
  runner.ts             # DAG execution runner
  graph-adapter.ts      # React Flow -> engine graph conversion
  persistence.ts        # run persistence + latest run hydration
  node-registry.ts      # UI node templates
  registry.ts           # engine node registry
  types.ts              # shared types

prisma/
  schema.prisma
  migrations/*
```

## Implemented in Phase 2

- Real DAG execution for full workflow and run-from-node
- Graph validation:
  - cycle detection
  - required input checks
  - port type compatibility checks
- Node-level execution state:
  - status (`idle`, `running`, `success`, `error`)
  - logs
  - output payload
- Mocked `Generate Hero` output (no AI calls)
- Persistent run history in SQLite:
  - `workflow_runs`
  - `node_runs`
- API endpoints for execution and latest run hydration
- Builder UI wired to API-based execution and persisted result hydration

## Phase 2 architecture

- `components/builder/*`: UI layer (React Flow graph editing, inspector, output, logs, toolbar)
- `engine/graph-adapter.ts`: converts React Flow snapshot (`nodes` + `edges`) into engine `GraphDefinition`
- `engine/registry.ts` + `engine/nodes/*`: executable node definitions and UI-kind to engine-type mapping
- `engine/runner.ts`: deterministic DAG runner
  - validation (cycle detection, missing required inputs, port type mismatch)
  - execution modes (`runWorkflow`, `runFromNode`)
  - per-node status/log/output aggregation
- `engine/persistence.ts`: maps engine run results to DB and back for latest-run hydration
- `app/api/workflow/*`: server endpoints for execution and latest result retrieval
- `prisma/schema.prisma`: local SQLite persistence (`workflow_runs`, `node_runs`)

### Run modes

- `runWorkflow`: executes the full graph in topological order
- `runFromNode`: executes selected node branch by running downstream path and all required upstream dependencies

### UI integration contract

- Execute workflow: `POST /api/workflow/run`
- Execute from node: `POST /api/workflow/run-from-node`
- Load latest persisted run: `GET /api/workflow/latest?workflowId=default-workflow`
- Response payload carries per-node `status`, `logs`, and `output` for inspector/log drawer hydration

## Local setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000` (redirects to `/builder`).

## Useful commands

```bash
npm run lint
npm run build
```

## Manual test checklist

1. Open `/builder`, confirm existing latest run appears on node badges/output/logs (if previous runs exist).
2. Click `Queue`, confirm nodes transition to success/error and status line updates.
3. Click `Generate` on a single node card, confirm run-from-node executes related branch only.
4. Select a node, open inspector `Output` tab, verify output JSON appears and `Copy` button works.
5. Open node logs drawer, verify timestamped logs are shown for selected node.
6. Break a graph (missing required input or wrong port type), run workflow, verify readable error message.
7. Reload page, verify latest run is restored from SQLite-backed persistence.

## Phase 3 preview

- Add run history panel with selectable past runs (not only latest run)
- Add diff view between two runs (status and output delta)
- Add workspace/preview pipeline after mocked `Generate Hero`
- Add stronger graph authoring UX (port hints, inline validation badges, quick-fix actions)

## Notes

- Single-user localhost tool (no auth, no billing)
- Execution is deterministic and local-first
- Hero generation remains mocked by design for this phase
