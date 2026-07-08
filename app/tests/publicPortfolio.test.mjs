import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public portfolio sample uses synthetic demo identifiers", async () => {
  const sample = await readFile(new URL("../src/data/sampleAccount.js", import.meta.url), "utf8");

  assert.match(sample, /DEMO-ACCT-2048/);
  assert.match(sample, /DEMO-BILL-782913/);
  assert.match(sample, /555-0142/);
  assert.match(sample, /555-0187/);
  assert.match(sample, /DEMO-BUNDLE-3310/);
  assert.match(sample, /synthetic demo/i);
});

test("public portfolio build has a GitHub Pages workflow", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/pages.yml", import.meta.url), "utf8");

  assert.match(workflow, /Deploy portfolio demo/);
  assert.match(workflow, /node scripts\/build\.mjs/);
  assert.match(workflow, /actions\/deploy-pages/);
  assert.match(workflow, /path: app\/dist/);
});
