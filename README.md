# Cerberes Back End

Cerberes is an end-to-end encrypted chat where users own their keys. Messages are encrypted with
[MLS (RFC 9420)](https://www.rfc-editor.org/rfc/rfc9420) on the users' devices: this server never sees plaintext
nor any private key. It is the MLS **delivery service**:

- it stores accounts, contacts and the public part of identities and devices,
- it hands out key packages so that devices can be added to groups,
- it orders commits (one per epoch) and relays encrypted messages to each device,
- it deletes a message as soon as every recipient device fetched it.

Users keep a 12 word recovery phrase from which their identity key is derived. It certifies each of their
devices, and contacts can compare safety numbers to make sure the server did not swap keys.
See [PROTOCOL.md](PROTOCOL.md) for the protocol and the API contract.

The web client lives in [cerberes_front_end](https://github.com/SebastienPingal/cerberes_front_end).

## Tech stack

TypeScript, Node.js, Express, Sequelize, PostgreSQL. Deployed on Vercel.

## Configuration

Copy `.env.example` to `.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Secret signing session tokens, e.g. `openssl rand -base64 48`. The server refuses to start without it |
| `CORS_ORIGINS` | yes | Comma separated origins of the front-end, e.g. `http://localhost:3333`. Empty means no origin is allowed |
| `COOKIE_DOMAIN` | no | Domain of the session cookie, e.g. `.yourdomain.com` to share it across subdomains |
| `PORT` | no | Port in development, `3000` by default |
| `NODE_ENV` | no | `production` on Vercel |

Tables are created at startup when they don't exist. There are no migrations yet: a schema change means
recreating the database.

## Running locally

With Docker (the API is then on port 8000, PostgreSQL on 5436):

```bash
docker compose up -d
```

Or with a local PostgreSQL:

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

The end-to-end scenario, which drives the web client in several browsers against this server, is in the front-end
repository (`e2e/`).
