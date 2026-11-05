---
name: cli-anything-heronatlas
description: Read Heron Atlas public macro research or produce an evidence-based diagnostic product walkthrough with debug-snapshot.
---

# Heron Atlas agent access

Install Python 3.9+ and this wheel (Click is the only runtime dependency):

```sh
pipx install https://heronatlas.com/cli/cli_anything_heronatlas-0.1.0-py3-none-any.whl
# or
uv tool install https://heronatlas.com/cli/cli_anything_heronatlas-0.1.0-py3-none-any.whl
```

Run `cli-anything-heronatlas info --json` first for schema version, build time,
endpoints and check dates. Data commands accept `--json` and `--lang zh|zh-hant|en`.
English includes only admitted fields; event articles currently have no English
variant. Missing languages, data, HTTP/network failures and unsupported schemas
fail with a nonzero exit. Do not silently scrape pages or invent missing data.

```sh
cli-anything-heronatlas banks --json
cli-anything-heronatlas statements fed --json
cli-anything-heronatlas statement fed --date 2026-10-28 --lang en --json
cli-anything-heronatlas events --json
cli-anything-heronatlas event 2026-11-boe --json
cli-anything-heronatlas judgments --status 有效 --due-within 14 --json
cli-anything-heronatlas judgment J-2026-001 --json
cli-anything-heronatlas calendar --economy us --days 14 --json
cli-anything-heronatlas cite central-banks/fed/2026-10-28/
```

Bare invocation opens a REPL (`help`, shell-style quoted arguments, `exit`).
Use `--base-url` before the command or `HERON_ATLAS_BASE_URL` to select another
HTTPS deployment. HTTP is restricted to loopback tests. Requests have a 15-second
timeout, a plain user agent and no redirects. No credentials or model calls.

JSON preserves parsed objects and adds `source_url` and `as_of` to each returned
object. Lists can be empty. `statement` selects the latest adjacent pair unless
`--date` is provided. `statements` lists all admitted pairs. Sentence ops are
`same`, `changed`, `added`, `removed`; English originals and Chinese translations
are retained in Chinese output. English output omits Chinese fields.

`judgments` uses the existing ledger format, with optional status and due-date
filters. Chinese statuses are 有效, 兑现, 落空, 撤回; the status option uses those
values for every language. English output is the limited English page projection.
`--due-within` includes due instants from UTC now through N days. `calendar` shows
future key events from the same admitted entries as the ICS subscriptions;
`--days` uses UTC now through N days. Date-only events stay dates with
`date_only=true`; never treat them as midnight UTC.

Cite permanent decision-pair pages when available:
`Source: Heron Atlas, <url>, as of <checked date>`.
Use `checked_at` for source freshness; `built_at` only says when the static files
were rendered. `as_of=null` means source check unknown, including unverified rates
or calendar rows without a check date. Judgment ledger v0 lacks a check timestamp;
its `as_of` is the build time, not an assertion of source freshness. Never use a
future judgment due date as a checked date. This CLI reads public research; it
does not give trading instructions.

License: Heron Atlas content (translations, sentence comparisons, event research, judgments and notes) is licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Credit "Heron Atlas" and link to the page. Official originals and data remain under their publishers' terms.

`heronatlas` is an alias of `cli-anything-heronatlas`. For a factual UX/content/bug
walkthrough to paste into another AI product manager:

```sh
heronatlas debug-snapshot --out debug_report.md
heronatlas debug-snapshot --site-url https://heronatlas.com \
  --cli-base-url https://preview.example --no-external --out debug_report.md
heronatlas debug-snapshot --sections 1,3,4 --format json --out debug_report.json
```

Options: `--format markdown|json`, `--out FILE`, `--site-url URL` (default
https://heronatlas.com), `--cli-base-url URL` (defaults to site URL),
`--sections 1,2,3,4`, `--max-items N` (8), `--no-external`, `--chrome PATH`.
Section 1 records static HTML and sitemap inventory in all three language trees.
Section 2 quotes deployed search.js with line numbers, discovers its storage
contract/selectors, and uses headless Chrome/CDP pipe for fresh, us, uk and all
offered-economy states on Chinese/English homes at real current time. Computed
visibility, attribute diffs and actual mutation stacks support derived flags;
undetermined code paths remain unknown. Section 3 checks judgment anchors and
calendar promises and optionally external source URLs. Section 4 uses Click's
in-process runner for every command's help/table/JSON samples and error probes;
the diagnostic's own sample uses section 1 to prevent recursion.

Report identity is UTC time, version, manifest built_at and fetched HTML/script
SHA-256, independent of Git. Manifest 404 is non-fatal; the newest feed
lastBuildDate/sitemap lastmod is labelled separately with its source. Subresource
findings include URL, type, reason and affected states, deduplicated across states.
Only main-document or same-origin-script failures invalidate network state
acceptance. Findings alone keep exit 0; incomplete requested checks exit 1.
Markdown has a linked Findings summary (25 lines maximum), separate section and
page/table budgets (6/40/18/16/14 KB, total at most 95 KB), human-readable tables
and no raw selector/JSON receipts. Source excerpts explicitly elide selector
literals; JSON keeps the exact evidence. Markdown caps always disclose omissions; JSON
retains collected evidence. A missing Chrome, unknown storage contract or
failed essential check leaves an explicit partial report and exits nonzero.
Use `--sections 1,3,4` when Chrome is unavailable. `--no-external` skips external
source reachability only; pages and linked ICS are still fetched. Never present
fixture/pipe tests as real browser or live-site validation, or a skipped check
as a pass. The report measures fetched/executed behavior, not editorial truth.

Calendar membership matches exposed UID, otherwise UTC datetime plus economy
where both expose it. Title differences at the same instant are informational,
not membership loss. Missing datetime/UID or ambiguous identity leaves exact
missing counts unknown with a reason. Static visible items exclude hidden
descendants; hidden text is listed separately. Combined caps disclose original
total minus displayed, once per list. Malformed endpoint members fail clearly
on stderr, including the member index and invalid field.
