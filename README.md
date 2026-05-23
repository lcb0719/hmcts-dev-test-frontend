# HMCTS Dev Test Frontend

This is the frontend for the HMCTS dev test case management system. It provides a task management UI that connects to the backend API.

## Prerequisites

- Node.js 18+ (see `.nvmrc`)
- Yarn 3 (enable with `corepack enable`)
- Backend running at `http://localhost:4000` (see `hmcts-dev-test-backend`)

## Quick start

```bash
yarn install
yarn webpack
yarn start:dev
```

## Open the app

The frontend runs on **port 3100** by default.

After `yarn start:dev`, open:

- **Tasks list:** https://localhost:3100/tasks
- **Home (redirects to tasks):** https://localhost:3100/

Development uses **HTTPS** with a self-signed certificate. Your browser may show a security warning — that is expected locally. Proceed to continue.

You should see a message in the terminal like:

```
Application started: https://localhost:3100
```

### Change the port

```bash
PORT=3200 yarn start:dev
```

Then open https://localhost:3200/tasks

## Production-style run

```bash
yarn build:prod
yarn start
```

This serves on **http://localhost:3100** (HTTP, not HTTPS).

## Backend

Start the backend before using the frontend:

```bash
cd ../hmcts-dev-test-backend
docker compose up -d
./gradlew bootRun
```

## Tests

```bash
yarn test:coverage
```
