# guess-lab

End-to-end parity proof for the Centre AI Agent Orchestrator.

This repository contains the project foundation for a guessing game: a React,
TypeScript and Vite setup with automated quality gates. The game itself has
not been implemented yet. No external runtime service, secret or API is
required to develop, test or build this project.

## Requirements

- Node.js 22+
- npm 10+

## Local development

```bash
npm ci             # install dependencies from the lockfile
npm run dev        # start the Vite dev server
npm run typecheck  # run the TypeScript compiler in noEmit mode
npm test           # run the vitest test suite
npm run build      # type-check and produce a production build in dist/
npm run preview    # preview the production build locally
```

## Continuous integration

Every pull request runs `npm ci`, `npm run typecheck`, `npm test` and
`npm run build` via [GitHub Actions](.github/workflows/ci.yml).
