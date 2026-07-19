# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, 100% client-side portal of internal tools ("Ferramentas SPS") for the Seção de Processo Seletivo (staff/intern selection process section) of the Tribunal de Justiça do Estado do Paraná (TJPR). No build step, no package manager, no server, no external API calls — every page is opened directly as a `.html` file (or served as static files) and all processing (PDF parsing, spreadsheet parsing, text generation) happens in the browser. All UI text, comments, and generated documents are in Brazilian Portuguese (pt-BR).

There is no test suite, linter, or build/bundler config in this repo. "Running" the app means opening an `.html` file in a browser (or serving the folder statically) and exercising it manually — there is no CLI dev server.

## Architecture

### Portal registry pattern (`ferramentas.js` + `layout.js`)

`ferramentas.js` defines a single `FERRAMENTAS` array — the source of truth for every tool's filename, emoji, accent color, eyebrow/title/description text, and label. `layout.js` runs on `DOMContentLoaded` on every page and, from that registry, injects:
- the institutional header (`#institutional-placeholder`)
- the nav menu / tab bar (`#menu-placeholder`), including a shrink-on-scroll mini-header
- the per-page title block (`#header-title`) — looked up via `ferramentaPorArquivo(currentFilename)`
- the tool cards grid on the index page (`.tool-grid`)

**To add, rename, or re-order a tool, edit only the `FERRAMENTAS` array in `ferramentas.js`.** Do not hand-edit titles/eyebrows/menu entries in individual HTML files — they're all generated from this registry at runtime. Every tool page includes `<script src="ferramentas.js">` and `<script src="layout.js">` at the end of `<body>`, after its own logic script.

### Shared client-side utilities (`core.js` → `window.TJPRCore`)

`core.js` exposes a `TJPRCore` global (IIFE) with helpers reused across tools: `escapeHtml`, `csvEscape`, `normName` (accent/case/whitespace-insensitive name normalization, used for cross-referencing candidate names between spreadsheets), `detectDelimiter`/`parseCSV` (autodetects `,` vs `;`, since pt-BR Excel exports use `;`), `buildCleanTableHTML`/`buildTSV`/`copyTableToClipboard` (copies a table to the clipboard as both real HTML — for pasting into Word/Excel — and TSV fallback), and `pdfToText` (extracts text from a PDF via `vendor/pdf.min.js`, reconstructing reading order by grouping text items by Y-coordinate line and sorting by X).

Any tool that touches PDFs, CSV/XLSX, or clipboard table-copying should include `core.js` and use `TJPRCore.*` rather than reimplementing (note: `edital_logic.js` currently has its own inline copy of the PDF-to-text logic predating `core.js`'s extraction — treat `TJPRCore.pdfToText` as canonical for anything new).

### Per-tool structure

Each tool is one HTML page + one dedicated logic script, both self-contained (IIFE, no shared module system):
- `index.html` — portal home, tool grid only
- `edital.html` / `edital_logic.js` / `edital_modelos.js` — Gerador do Edital de Abertura: reads a SEI-exported PDF form, extracts field values via label matching (`LABELS` array + `parseFormulario`), selects one of ~40 official edital templates based on a small set of "eixos" (axes: obrigatoriedade, modalidade, nível, entrevista, consulta, webcam), lets the user review/edit every field (`FIELDS` registry drives the confirmation form), then renders the full edital text from `EDITAL_PARAS` (paragraph templates with `{{PLACEHOLDER}}` substitution) into an editable, copyable/printable output
- `ponto_18.html` / `ponto18_logic.js` — Agrupador de E-mails: trivial textarea → `;`-joined list transform
- `ponto_20.html` / `ponto20_logic.js` — cross-references two XLSX/CSV reports (Classificação Final × Inscritos) from the "Fábrica de Provas" platform, applies reserva/cota codes and an approval cap, outputs a table + CSV
- `ponto_26.html` / `ponto26_logic.js` — extracts a classification table from an edital PDF (or manual paste) and cross-references it against a registration CSV to produce a Hércules-import file

New tools should follow this same shape: `<tool>.html` (structural markup + `#institutional-placeholder`, `#menu-placeholder`, `#header-title` divs, only inline `<style>` for page-specific CSS) + `<tool>_logic.js` (IIFE, wired to element IDs) + a new entry appended to `FERRAMENTAS` in `ferramentas.js`.

### Styling

`core.css` defines the shared design system: CSS custom properties for colors (`--teal`, `--coral`, `--mint`, `--gold`, `--navy`, `--ink`, etc., set per-tool via `--accent`), the `.sheet`/`.step`/`.step-*` step-based page layout, `.tool-card`/`.tool-grid` for the index, `.stamp`/`.stamp-*` for the "CONFERIDO"/"REVISAR" result badges, and form/table primitives (`.upload-panel`, `.simple-table`, `.warn-list`, etc.) reused by every tool. Page-specific CSS (e.g. `edital.html`'s `.ed-*` classes) lives in a `<style>` block in that page's own `<head>`.

### Vendored libraries (`vendor/`, plus root-level copies)

`vendor/pdf.min.js` + `vendor/pdf.worker.min.js` (PDF.js, for PDF text extraction) and `vendor/xlsx.min.js` / root `xlsx.min.js` (SheetJS, for XLSX/CSV parsing) are committed third-party bundles, loaded via plain `<script>` tags — not npm packages. Root-level `pdf.worker.min.js` and `xlsx.min.js` also exist alongside the `vendor/` copies; check which path a given HTML page actually references before assuming one is unused.

## Working in this repo

- There is no build/test/lint command — verify changes by opening the relevant `.html` file in a browser and exercising the flow manually (upload a sample PDF/XLSX/CSV, check the rendered table/output, try the copy/download buttons).
- Keep new/edited UI strings and code comments in pt-BR, consistent with the rest of the codebase.
- Every generated/exported artifact (edital text, CSV) carries a disclaimer footer stating the tool is not an official TJPR system and output must be manually verified before use — preserve this pattern in new tools.
- CSV downloads use `;` as delimiter and a UTF-8 BOM (`﻿`) prefix, matching pt-BR Excel's expected format — follow this convention for any new CSV export.
