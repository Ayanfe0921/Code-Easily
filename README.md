# Code Easily

Code Easily is a React/Vite application with an Express API, MongoDB persistence, cookie-based authentication, and AI-assisted project generation.

## Requirements

- Node.js 22 or newer
- npm
- MongoDB (local or MongoDB Atlas)
- An OpenRouter API key for AI project generation

## Run locally

1. Start MongoDB locally, or create an Atlas database and allow your machine's IP address in its Network Access settings.
2. Create `back-end/.env` with:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/code_easily
   JWT_SECRET=replace-with-a-long-random-secret
   ORIGINS=http://localhost:5173
   OPENROUTER_API_KEY=your-openrouter-key
   OPENROUTER_MODEL=openrouter/free
   ```

   For Atlas, replace `MONGODB_URI` with the connection string from Atlas. URL-encode special characters in the database user's password.
3. In one terminal, run `cd back-end`, `npm ci`, then `npm run dev`.
4. In another terminal, run `cd front-end`, `npm ci`, then `npm run dev`.
5. Open <http://localhost:5173>. The Vite development server proxies `/api` calls to `http://localhost:3000`.

The API health endpoint is <http://localhost:3000/health>. If `/api/auth/me` reports a proxy connection refusal, the backend is not listening; check its startup output and database connection first.

## Run with Docker Compose

Copy `.env.example` to `.env`, set a private `JWT_SECRET` and your OpenRouter key, then run:

```sh
docker compose up --build
```

Open <http://localhost:8080>. Compose starts MongoDB with a persistent volume, waits for its health check, then starts the API and frontend. The frontend's Nginx server proxies `/api` to the API container. Stop with `docker compose down`; use `docker compose down -v` only if you also intend to delete the stored database.

## Troubleshooting MongoDB

`MongoNetworkTimeoutError` during `secureConnect` means the API could not finish the TLS handshake with the configured MongoDB host. Verify the URI, network connectivity, Atlas IP allowlist, and database user credentials. For a local MongoDB instance, use `mongodb://127.0.0.1:27017/code_easily` (no TLS URI). The included Docker Compose setup avoids an Atlas connection by running MongoDB locally in a container.

Keep `.env` files and real credentials private. `.env` is ignored by Git.
