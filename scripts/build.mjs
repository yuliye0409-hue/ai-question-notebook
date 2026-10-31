import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectPublicNotes } from './note-policy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const notes = JSON.parse(await readFile(resolve(root, 'content', 'notes.json'), 'utf8'));
const publicNotes = selectPublicNotes(notes);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'site'), dist, { recursive: true });
await writeFile(resolve(dist, 'notes.json'), `${JSON.stringify(publicNotes, null, 2)}\n`);
console.log(`Built ${publicNotes.length} public glossary notes to ${dist}`);
