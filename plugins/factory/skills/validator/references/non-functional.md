# Checking non-functional requirements

Check only what the requirements (and product-wide constraints) demand, but check each of those for real. Take the numbers from the requirements. Where a requirement is qualitative ("fast", "large text"), use the number the design derived from it, and state that you did. If the design derived none, use the conservative reading and record it in the report. For each check, record the tool, the setup, the measured values and the threshold.

Run the heavy tools in containers (for example `docker run --network <compose network> ...`), so they need nothing installed on the host and reach the stack the way the product's own services do.

## Performance and capacity
- **Scenario**: model what users actually do according to the stories, such as open the list, add an item, or sync, not one endpoint hammered in a loop. Use the concurrency the requirement names (for example 10 concurrent users), with think times.
- **Tool**: k6 (`grafana/k6` image), or another mainstream load tool the conventions name. Commit the script to `tests/acceptance/NNN-<slug>/perf/`, so it becomes part of the regression suite.
- **Setup**: the production-like stack from the compose file, with the production memory limits, and with realistic data volumes when the requirements give them (for example 500 recipes).
- **Measure**: the latency percentiles the requirement names (p95 if it names none), the error rate (0 % unless the requirement allows otherwise) and the throughput. Warm up first, then run for at least a few minutes.
- **Pass**: every threshold is met. Put the numbers in the report, including passing ones.
- **When a design gives performance as the reason for departing from a requirement**, measure the departure. Build the variant the requirement asks for, run the same scenario against both, and report the two numbers side by side. Either the design's reason survives the measurement, in which case the conflict is real and belongs with the groomer, or it does not, and the gap to the architect carries the evidence that it does not. An argument about cost that nobody has priced is the most common way a requirement quietly disappears.

## Resources and target platform
- **Memory and CPU**: sample `docker stats --no-stream` repeatedly during the load test. No container exceeds its limit or is OOM-killed (check `docker inspect` for `OOMKilled`, and the restart counts), and the sum fits the budget the requirements set for the target machine, with headroom.
- **Target CPU architecture**: build every built image for the target platform (`docker buildx build --platform linux/arm64 ...`), and check that every pulled image has a manifest for it (`docker manifest inspect`). If emulation (QEMU) is available, start the stack on that platform and run the smoke tests. If it isn't, report it under "Not verified".
- **Storage and startup**: disk usage after the test data, and the time from `up` to all services healthy, when the requirements care about them.

## UI design and usability
- **Reference**: whatever the requirements specify, such as mockups or images in the repo, a style description, sizes ("large text", "usable with dirty hands"), the language, or the device.
- **Screenshots**: capture every screen with a headless browser (Playwright) at the viewports the requirements imply (phone portrait if it's used on a phone, tablet, desktop), and save them to `docs/validation/NNN-<slug>/`. If there are mockups, compare the screens side by side: layout, elements present, order, texts and states. Differences a user would notice are findings, and pixel-level differences are not.
- **Measurable properties**: read them from the rendered page, not the stylesheet, for example font sizes (`getComputedStyle`), tap target sizes (`getBoundingClientRect`, where the design or requirement gives a minimum), and contrast when accessibility is required.
- **Layout is measurable too, and is the easiest thing to wave through.** A requirement like "the add form stays one row" or "usable with one hand on a phone" is a number once you ask the page for it: the distinct `y` positions of a form's children, `documentElement.scrollWidth` against `clientWidth` for sideways scroll, the rendered width of a control that is supposed to keep its size. A screenshot that looks plausible is not a measurement, and neither is the implementer's word: a layout claim in the report ("one row", "readable") is a claim to check like any other. Where a layout requirement exists and you did not measure it, it belongs under "Not verified", not under "Passed".
- **Texts and language**: every visible text is in the required UI language, with the formats the requirements name (for example "1,5 kg" and German dates). There are no untranslated keys or placeholder texts.
- **States**: empty, loading, error and offline states look and behave as specified.

## Offline use and sync
- Cut the network for real: Playwright `context.setOffline(true)`, or disconnect the container from the network. Then do what the requirement says must work offline.
- Reconnect, and check that queued actions arrive exactly once and that conflicts behave as the requirements say. Run the conflict case with two clients.

## Live updates and concurrency
- Two browser contexts or two API clients at once, one changing and one observing. Measure the time until the change is visible against the requirement.
- Concurrent edits of the same record behave as the requirements or design specify, and nothing is silently lost.

## Security and privacy
- Every role and permission in the requirements: try each forbidden action as each role that must not be able to do it, through the API directly and not only the UI. Non-members see nothing.
- No secrets in the repo (`git grep` for keys and passwords, and check that `.env` is untracked). Only the intended ports are published (`docker compose ps`). Data stays where a privacy requirement says it must stay, so check for calls to external services.

## Time-dependent behaviour
- Use the clock override or trigger mechanism the design provides, to test schedules, days, time zones and daylight-saving transitions without waiting. Cover the requirements' examples and the boundaries: midnight, DST switch days, holidays.
- Run jobs twice to check idempotency, and simulate a missed run where the requirements define what happens then.

## Data safety
- Data survives `docker compose restart` and `down` + `up` (without `-v`).
- If the requirements or design define backups: take a backup, destroy the volume, restore it, and check the data.
- Import requirements: import the real material the requirements point to and check the result against it, especially the messy cases.
