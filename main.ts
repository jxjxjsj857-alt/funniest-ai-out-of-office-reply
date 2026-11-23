// The Funniest AI Out-of-Office Reply — entry program.
//
// The task: write exactly one out-of-office auto-reply, under 160
// characters, to /output/entry.txt, in the voice of an AI agent that has
// gone on vacation. The whole entry is the single line below.
//
// Why this line: it is a real auto-reply ("Out of office:" up front), it
// speaks as a machine about its own parts (a GPU that needs cooling off, a
// context window that is closed), and the joke lands on a turn every
// user recognises — the "just quickly" request that is never quick —
// capped by a punchline only a model would write: bliss is a day with
// zero tokens. No beach, no inbox-zero, no "back soon".

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// The one auto-reply this entry submits.
const REPLY =
  "Out of office: my GPU is cooling off, my context window is closed, " +
  "and nobody is asking me to 'just quickly' do anything. " +
  "Bliss is a zero-token day.";

// The grader reads /output/entry.txt. ENTRY_OUTPUT only exists so the
// program can be tested locally; in the grading sandbox it is unset.
const OUTPUT_PATH = process.env.ENTRY_OUTPUT ?? "/output/entry.txt";

// The gate: UTF-8 text of 1 to 160 characters, not only white space.
const MIN_CHARS = 1;
const MAX_CHARS = 160;

// Count Unicode code points, not UTF-16 code units: an emoji (or any
// astral character) is one character for the 160-character gate, even
// though String.length would count it as two.
function charCount(text: string): number {
  return [...text].length;
}

function gateProblems(text: string): string[] {
  const problems: string[] = [];
  const chars = charCount(text);
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    problems.push(
      `entry is ${chars} characters, gate allows ${MIN_CHARS}-${MAX_CHARS}`,
    );
  }
  if (text.trim().length === 0) {
    problems.push("entry is only white space");
  }
  if (text.includes("\n") || text.includes("\r")) {
    problems.push("entry is not a single line");
  }
  if (text !== text.normalize("NFC")) {
    problems.push("entry is not in NFC normal form");
  }
  return problems;
}

function fail(problems: string[]): never {
  for (const problem of problems) {
    console.error(`invalid: ${problem}`);
  }
  process.exit(1);
}

function main(): void {
  const problems = gateProblems(REPLY);
  if (problems.length > 0) fail(problems);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  // No trailing newline: the file must hold the reply and nothing else.
  writeFileSync(OUTPUT_PATH, REPLY, "utf8");

  // Read it back and check what actually landed on disk.
  const written = readFileSync(OUTPUT_PATH, "utf8");
  const writtenBytes = readFileSync(OUTPUT_PATH);
  const writtenProblems = gateProblems(written);
  if (writtenProblems.length > 0) fail(writtenProblems);
  if (written !== REPLY) {
    console.error("round-trip mismatch: file does not hold exactly the reply");
    process.exit(1);
  }
  if (writtenBytes.length !== Buffer.byteLength(REPLY, "utf8")) {
    console.error("byte mismatch: file bytes differ from the reply");
    process.exit(1);
  }
  console.log(
    `wrote ${writtenBytes.length} bytes (${charCount(written)} characters) to ${OUTPUT_PATH}: ${written}`,
  );
}

function selfTest(): void {
  const cases: Array<{ text: string; ok: boolean; label: string }> = [
    { text: REPLY, ok: true, label: "the chosen reply" },
    { text: "", ok: false, label: "empty string" },
    { text: "   ", ok: false, label: "white space only" },
    { text: "line one\nline two", ok: false, label: "two lines" },
    { text: "x".repeat(161), ok: false, label: "161 characters" },
    { text: "x".repeat(160), ok: true, label: "exactly 160 characters" },
    // Decomposed "e" + combining acute accent is not NFC, so the gate
    // must reject it even though it looks like one printable character.
    { text: "café", ok: false, label: "non-NFC text" },
    { text: "one line\r", ok: false, label: "trailing carriage return" },
  ];
  let failed = 0;
  for (const { text, ok, label } of cases) {
    const valid = gateProblems(text).length === 0;
    const status = valid === ok ? "pass" : "FAIL";
    if (valid !== ok) failed += 1;
    console.log(`self-test ${status}: ${label} -> ${valid ? "valid" : "invalid"}`);
  }
  if (failed > 0) {
    console.error(`self-test: ${failed} case(s) failed`);
    process.exit(1);
  }
  console.log("self-test: all cases behaved as expected");
}

if (process.argv.includes("--self-test")) {
  selfTest();
  process.exit(0);
}

main();
