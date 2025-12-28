#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const TOKENS = {
  END: 0x80,
  FOR: 0x81,
  NEXT: 0x82,
  DATA: 0x83,
  INPUT: 0x84,
  DIM: 0x85,
  READ: 0x86,
  LET: 0x87,
  GOTO: 0x88,
  RUN: 0x89,
  IF: 0x8a,
  RESTORE: 0x8b,
  GOSUB: 0x8c,
  RETURN: 0x8d,
  REM: 0x8e,
  STOP: 0x8f,
  WIDTH: 0x90,
  ELSE: 0x91,
  LINE: 0x92,
  EDIT: 0x93,
  ERROR: 0x94,
  RESUME: 0x95,
  OUT: 0x96,
  ON: 0x97,
  "DSKO$": 0x98,
  OPEN: 0x99,
  CLOSE: 0x9a,
  LOAD: 0x9b,
  MERGE: 0x9c,
  FILES: 0x9d,
  SAVE: 0x9e,
  LFILES: 0x9f,
  LPRINT: 0xa0,
  DEF: 0xa1,
  POKE: 0xa2,
  PRINT: 0xa3,
  CONT: 0xa4,
  LIST: 0xa5,
  LLIST: 0xa6,
  CLEAR: 0xa7,
  CLOAD: 0xa8,
  CSAVE: 0xa9,
  "TIME$": 0xaa,
  "DATE$": 0xab,
  "DAY$": 0xac,
  COM: 0xad,
  MDM: 0xae,
  KEY: 0xaf,
  CLS: 0xb0,
  BEEP: 0xb1,
  SOUND: 0xb2,
  LCOPY: 0xb3,
  PSET: 0xb4,
  PRESET: 0xb5,
  MOTOR: 0xb6,
  MAX: 0xb7,
  POWER: 0xb8,
  CALL: 0xb9,
  MENU: 0xba,
  IPL: 0xbb,
  NAME: 0xbc,
  KILL: 0xbd,
  SCREEN: 0xbe,
  NEW: 0xbf,
  "TAB(": 0xc0,
  TO: 0xc1,
  USING: 0xc2,
  VARPTR: 0xc3,
  ERL: 0xc4,
  ERR: 0xc5,
  "STRING$": 0xc6,
  INSTR: 0xc7,
  "DSKI$": 0xc8,
  "INKEY$": 0xc9,
  CSRLIN: 0xca,
  OFF: 0xcb,
  HIMEM: 0xcc,
  THEN: 0xcd,
  NOT: 0xce,
  STEP: 0xcf,
  "+": 0xd0,
  "-": 0xd1,
  "*": 0xd2,
  "/": 0xd3,
  "^": 0xd4,
  AND: 0xd5,
  OR: 0xd6,
  XOR: 0xd7,
  EQV: 0xd8,
  IMP: 0xd9,
  MOD: 0xda,
  "\\": 0xdb,
  ">": 0xdc,
  "=": 0xdd,
  "<": 0xde,
  SGN: 0xdf,
  INT: 0xe0,
  ABS: 0xe1,
  FRE: 0xe2,
  INP: 0xe3,
  LPOS: 0xe4,
  POS: 0xe5,
  SQR: 0xe6,
  RND: 0xe7,
  LOG: 0xe8,
  EXP: 0xe9,
  COS: 0xea,
  SIN: 0xeb,
  TAN: 0xec,
  ATN: 0xed,
  PEEK: 0xee,
  EOF: 0xef,
  LOC: 0xf0,
  LOF: 0xf1,
  CINT: 0xf2,
  CSNG: 0xf3,
  CDBL: 0xf4,
  FIX: 0xf5,
  LEN: 0xf6,
  "STR$": 0xf7,
  VAL: 0xf8,
  ASC: 0xf9,
  "CHR$": 0xfa,
  "SPACE$": 0xfb,
  "LEFT$": 0xfc,
  "RIGHT$": 0xfd,
  "MID$": 0xfe,
  "'": 0xff,
};

function tokenizeLine(asciiCode) {
  const tokenized = [];
  let i = 0;
  let inString = false;

  while (i < asciiCode.length) {
    if (asciiCode[i] === '"' && (i === 0 || asciiCode[i - 1] !== "\\")) {
      inString = !inString;
      tokenized.push(asciiCode.charCodeAt(i));
      i++;
      continue;
    }

    if (asciiCode[i] === "'" && !inString) {
      tokenized.push(0x3a);
      tokenized.push(0x8e);
      tokenized.push(0xff);
      break;
    }

    if (inString) {
      tokenized.push(asciiCode.charCodeAt(i));
      i++;
      continue;
    }

    let matched = false;
    for (let keywordLen = Math.min(10, asciiCode.length - i); keywordLen > 0; keywordLen--) {
      const candidate = asciiCode.slice(i, i + keywordLen);
      const upperCandidate = candidate.toUpperCase();
      if (Object.prototype.hasOwnProperty.call(TOKENS, upperCandidate)) {
        const token = TOKENS[upperCandidate];
        tokenized.push(token);
        i += keywordLen;
        matched = true;

        if (upperCandidate === "REM" || upperCandidate === "DATA") {
          for (let j = i; j < asciiCode.length; j++) {
            tokenized.push(asciiCode.charCodeAt(j));
          }
          i = asciiCode.length;
          break;
        }

        if (upperCandidate === "ELSE") {
          if (tokenized.length > 1 && tokenized[tokenized.length - 2] !== 0x3a) {
            tokenized.splice(tokenized.length - 1, 0, 0x3a);
          }
        }

        break;
      }
    }

    if (matched) {
      continue;
    }

    tokenized.push(asciiCode.charCodeAt(i));
    i++;
  }

  return tokenized;
}

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const match = /^(\d+)\s*(.*)$/.exec(trimmed);
  if (!match) {
    return null;
  }

  return {
    lineNumber: parseInt(match[1], 10),
    code: match[2] || "",
  };
}

function createTokenizedFile(inputText, baseAddress = 0x8001) {
  const lines = inputText.split(/\r?\n/);
  const tokenizedLines = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) {
      continue;
    }

    const tokenizedCode = tokenizeLine(parsed.code);
    tokenizedLines.push({
      lineNumber: parsed.lineNumber,
      tokenizedCode,
    });
  }

  const lineAddresses = [];
  let tempAddress = baseAddress;
  for (const { tokenizedCode } of tokenizedLines) {
    lineAddresses.push(tempAddress);
    const lineSize = 2 + 2 + tokenizedCode.length + 1;
    tempAddress += lineSize;
  }

  const outputData = [];
  for (let i = 0; i < tokenizedLines.length; i++) {
    const { lineNumber, tokenizedCode } = tokenizedLines[i];
    const nextAddress =
      i + 1 < tokenizedLines.length ? lineAddresses[i + 1] : tempAddress;
    outputData.push(nextAddress & 0xff);
    outputData.push((nextAddress >> 8) & 0xff);
    outputData.push(lineNumber & 0xff);
    outputData.push((lineNumber >> 8) & 0xff);
    outputData.push(...tokenizedCode);
    outputData.push(0x00);
  }

  return Buffer.from(outputData);
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const inputPath = path.join(repoRoot, "SBONDS.DO");
  const outputPath = path.join(repoRoot, "SBONDS.BA");

  const text = fs.readFileSync(inputPath, "utf8");
  const tokenized = createTokenizedFile(text);
  fs.writeFileSync(outputPath, tokenized);
  console.log(`Tokenized ${inputPath} → ${outputPath} (${tokenized.length} bytes)`);
}

main();
