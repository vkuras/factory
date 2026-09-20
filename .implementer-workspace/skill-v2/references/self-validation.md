# Self-validation

This is the concrete version of step 4. Adapt the commands to the product's stack and to its compose file. What matters is the evidence: for every check, record the command, the result, and a short excerpt of the output in the report.

Use your own compose project name so that you never touch other stacks running on the machine, for example `P=selfcheck-NNN`, and pass `-p $P` to every `docker compose` call.

## 1. Build and static checks
- Build each component the way its Dockerfile does, from a clean state. Delete build output directories first, so that a stale artifact can't hide a broken build.
- Run the linters, formatters (in check mode) and type checks named in the conventions or configured in the repo. Zero errors. Warnings you introduced are fixed, not suppressed.

## 2. Tests
- Run the complete suite of every component, not only the tests you added.
- Record the counts: passed, failed, skipped. Compare the skipped count with the count before your work (`git stash` or the base commit), because it must not have grown.

## 3. Traceability
- For each row in the design's traceability table, name the test (file and test name) that proves it, and check that the test exists and ran green in step 2.
- A requirement verified by a manual or smoke check rather than an automated test is covered in step 5, and the report says so.

## 4. The real stack starts
```bash
cp -n .env.example .env        # only if no .env exists; fill in local dummy values, never real secrets
docker compose -p $P down -v   # fresh state: only for your own project name
docker compose -p $P build
docker compose -p $P up -d
docker compose -p $P ps        # every service "healthy" (or "running" where the design defines no healthcheck)
docker compose -p $P logs --no-color | tail -n 200   # no errors or stack traces on start
```
- Wait for health by polling `docker compose -p $P ps` with a timeout that matches the healthchecks. Don't use a fixed sleep.
- Migrations: check that they ran on the empty database. If the product had a schema before this work, also start from the previous commit's schema with data in it, then migrate, and check that the data is intact.

## 5. Use it like a user
Against the running stack, through the ports the design publishes:
- **API**: exercise every endpoint the design lists for this work with `curl` or a small script. Cover the success case, one validation error, and one authorization failure where auth exists. Compare the status codes and response shapes with the design.
- **UI**: if a browser tool is available, open every screen of the design and walk through each story's main flow. Check the states the design lists (empty, error, offline where it applies). If no browser tool is available, at least fetch every page, check that it loads without server errors, and run the UI's automated tests. Record in the report that the UI wasn't clicked through.
- **Jobs**: trigger scheduled jobs through the mechanism the design specifies, for example a clock override or a manual trigger, and check the effect and the idempotency (run the job twice).
- **Failure paths**: one per story at least, for example the database stopped or invalid input, as far as the design specifies the behaviour.

## 6. Data survives
```bash
docker compose -p $P restart   # and also: down (without -v) + up -d
```
The data created in step 5 is still there, and the services are healthy again.

## 7. Hard constraints
Run each verification named in the design's drivers table and in "Test strategy", for example:
- load test: the design's scenario, concurrency and threshold, against the stack started as in production. Record p95 latency, errors and throughput.
- memory: `docker stats --no-stream` during the load test. Each container stays below its limit, and the sum stays inside the budget.
- target architecture: `docker buildx build --platform <target>` for each built image, and an existence check for pulled images on that platform (`docker manifest inspect`).
A constraint that can't be checked on this machine is listed as not run, with the reason. You never report it as passed.

## 8. Own diff review
`git diff <base>...HEAD`: check for debug output, commented-out code, TODO/FIXME you added, secrets or real credentials, files outside the design's scope, deviations from the design or conventions, and code without tests.

## 9. Tear down
`docker compose -p $P down -v`. Only your own project name.

## When the environment can't run a check
If Docker isn't reachable, there's no network, or a tool is missing, run everything that doesn't depend on it. Then list the check under "Not run" in the report, with the exact error. The final message says `passed-with-gaps`. Never replace a check you couldn't run with reasoning about why it would pass.
