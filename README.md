# FarSight (Opportunity Radar)

FarSight is an intelligent engineering opportunity and buying signal platform. It scans job feeds, procurement notices, press releases, and technical roadmaps to discover, qualify, and prioritize high-value commercial leads.

---

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router) (file-based routing with SSR via Nitro)
- **UI & Styling**: React 19, [Tailwind CSS v4](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com/), and [Lucide Icons](https://lucide.dev)
- **Data & State**: [TanStack Query](https://tanstack.com/query)
- **Tooling**: Vite 8, TypeScript 5.8, ESLint 9, Prettier, and Vitest
- **Package Manager**: [Bun](https://bun.sh) (recommended) or Node.js / npm

---

## Project Structure

```text
FarSight/
├── src/
│   ├── components/
│   │   ├── radar/          # Core radar screens and theme provider
│   │   └── ui/             # Radix / Shadcn UI primitive components
│   ├── data/               # Screen references, shell templates, and lead data
│   │   ├── leads.json      # Structured company & lead attributes
│   │   ├── screens.json    # Reference layout markup
│   │   └── shell.json      # Navigation header & sidebar shell
│   ├── hooks/              # Custom React hooks (e.g. useMobile)
│   ├── lib/                # Utilities and error reporting helpers
│   ├── routes/             # TanStack file-based routes
│   │   ├── __root.tsx      # App shell layout and query context
│   │   ├── index.tsx       # Opportunity radar overview
│   │   ├── find-leads.tsx  # Lead discovery and search
│   │   ├── lead-inbox.tsx  # Ingested signal inbox
│   │   ├── outreach.tsx    # Campaign and pitch drafting
│   │   └── ...             # Settings, sources, research queue, limits
│   ├── styles.css          # Tailwind CSS v4 design system tokens
│   ├── router.tsx          # Router instantiation
│   ├── server.ts           # SSR server entry
│   └── start.ts            # TanStack Start runtime configuration
├── public/                 # Static assets (favicons, robots.txt)
├── bun.lock                # Bun dependency lockfile
├── package.json            # Scripts and dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite & TanStack Start build configuration
```

---

## Workspace Routes

| Route                    | View                | Description                                                    |
| :----------------------- | :------------------ | :------------------------------------------------------------- |
| `/`                      | Overview            | Engineering opportunity velocity and intent radar              |
| `/find-leads`            | Find Leads          | Multi-filter discovery scan across markets and stacks          |
| `/lead-inbox`            | Lead Inbox          | Live signal review, qualification, and CSV export              |
| `/leads/meridian`        | Research Brief      | Detailed dossier: observed facts, inferred needs & pitch angle |
| `/research-queue`        | Research Queue      | Deep technical investigation pipeline                          |
| `/outreach`              | Outreach            | Pitch generation, draft editing, and clipboard export          |
| `/saved-searches`        | Saved Searches      | Configured monitoring rules and market alerts                  |
| `/sources-and-platforms` | Sources & Platforms | API data providers and platform connections                    |
| `/usage-and-limits`      | Usage & Limits      | Tavily and AI credits consumption guardrails                   |
| `/settings`              | Settings            | Scoring thresholds and workspace preferences                   |

---

## Getting Started

### 1. Install Dependencies

Using Bun (recommended):

```bash
bun install
```

Or using npm:

```bash
npm install
```

### 2. Development Server

Start the local development server at `http://localhost:3000`:

```bash
bun run dev
# or
npm run dev
```

### 3. Testing & Code Quality

```bash
# Run test suite
bun run test

# Run ESLint validation
bun run lint

# Auto-format files with Prettier
bun run format
```

### 4. Production Build

Build the production SSR server bundle:

```bash
bun run build
bun run preview
```
