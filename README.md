# Superhero Workbench (Phase 3)

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
  heroes/page.tsx
  workflows/page.tsx
  api/workspace/files/route.ts
  api/workspace/file/route.ts
  api/workspace/preview/stop/route.ts
  api/heroes/thumbnail/route.ts
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
  workspace-manager.ts  # local workspace + preview runtime services
  node-registry.ts      # UI node templates
  registry.ts           # engine node registry
  types.ts              # shared types

prisma/
  schema.prisma
  migrations/*

data/
  templates/starter-next-gsap/ # starter project copied for each run workspace
  workspaces/                  # generated local workspaces (gitignored)
  thumbnails/                  # published hero thumbnails (gitignored)
```

## Implemented in Phase 3

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
- Workspace pipeline nodes:
  - `patchplan.generate`
  - `workspace.apply`
  - `preview.run`
  - `hero.publish`
- Real filesystem workspace generation in `data/workspaces/<runId>`
- Local IDE panel (file tree + Monaco editor + disk save)
- Preview panel (iframe + open + stop/restart controls)
- Published hero records and gallery page (`/heroes`)

## Phase 2 architecture

- `components/builder/*`: UI layer (React Flow graph editing, inspector, output, logs, toolbar)
- `engine/graph-adapter.ts`: converts React Flow snapshot (`nodes` + `edges`) into engine `GraphDefinition`
- `engine/registry.ts` + `engine/nodes/*`: executable node definitions and UI-kind to engine-type mapping
- `engine/runner.ts`: deterministic DAG runner
  - validation (cycle detection, missing required inputs, port type mismatch)
  - execution modes (`runWorkflow`, `runFromNode`)
  - per-node status/log/output aggregation
- `engine/persistence.ts`: maps engine run results to DB and back for latest-run hydration
- `engine/workspace-manager.ts`: applies patch plans, enforces path safety, starts/stops preview processes
- `app/api/workflow/*`: server endpoints for execution and latest result retrieval
- `app/api/workspace/*`: IDE and preview process control APIs
- `prisma/schema.prisma`: local SQLite persistence (`workflow_runs`, `node_runs`, `heroes`)

### Run modes

- `runWorkflow`: executes the full graph in topological order
- `runFromNode`: executes selected node branch by running downstream path and all required upstream dependencies

### UI integration contract

- Execute workflow: `POST /api/workflow/run`
- Execute from node: `POST /api/workflow/run-from-node`
- Load latest persisted run: `GET /api/workflow/latest?workflowId=default-workflow`
- Run history: `GET /api/workflow/runs?workflowId=default-workflow&limit=10`
- Run detail: `GET /api/workflow/runs/:runId?workflowId=default-workflow`
- IDE tree/files:
  - `GET /api/workspace/files`
  - `GET /api/workspace/file`
  - `POST /api/workspace/file`
- Preview control:
  - `POST /api/workspace/preview/stop`
- Response payload carries per-node `status`, `logs`, and `output` for inspector/log drawer hydration

## Local setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000` (redirects to `/builder`).

Prerequisite for preview runtime:

- Install `pnpm` globally (required by `preview.run`):

```bash
npm install -g pnpm
```

Optional prerequisite for image -> prompt extraction:

```bash
export OPENROUTER_API_KEY=your_openrouter_api_key
```

The `Image Input` node now supports `mode=visionPrompt` and uses the configured
OpenRouter model (default: `qwen/qwen3-vl-235b-a22b-thinking`) to produce a
text prompt output from the image.

## Useful commands

```bash
npm run lint
npm run build
```

## Manual test checklist

1. Open `/builder`, confirm the default pipeline includes `Generate Hero -> PatchPlan -> Apply Workspace -> Run Preview -> Publish`.
2. Run workflow (`Queue`), confirm `workspace.apply` creates `data/workspaces/<runId>` with hero files under `src/heroes/<heroId>/`.
3. Confirm `preview.run` returns a preview URL and preview node output includes url/port/pid.
4. Select workspace node, confirm IDE panel appears with file tree and Monaco editor.
5. Edit `Hero.tsx`, save, refresh iframe preview URL, confirm changes render.
6. Select preview node, confirm Preview panel appears with iframe and stop/restart controls.
7. Run through `Publish`, open `/heroes`, confirm a new published card appears with thumbnail + preview link.
8. Confirm path safety: only `src/heroes/<heroId>/**` writes are allowed from patch plans.

## Phase 4 preview

- Add real image/spec analysis pipeline (image -> structured hero spec)
- Add LLM-backed patch plan generation instead of deterministic templates
- Add richer publish metadata and real screenshot capture
- Add multi-artifact diff tooling and rollback between publish versions

## Notes

- Single-user localhost tool (no auth, no billing)
- Execution is deterministic and local-first
- Hero generation and patch planning are deterministic (no external AI calls in this phase)
