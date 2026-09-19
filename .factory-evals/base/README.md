# Taskboard

The shared task list of a small team. See `docs/product.md` for what it is and
`docs/architecture/overview.md` for how it is built.

## Run it

```
cp .env.example .env
docker compose up -d
```

Then open http://localhost:8080.

## Tests

```
npm test                      # unit tests
tests/acceptance/run.sh       # black-box acceptance tests against a started stack
```
