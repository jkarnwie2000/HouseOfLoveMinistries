/**
 * Creates (or resets the password of) an administrator account.
 * Usage: npm run create-admin -- you@example.org "Your Name" [admin|editor]
 * You will be prompted for the password (not echoed to shell history).
 */
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { initDb, closeDb } from '../src/db/index.js';

const [email, name = 'Administrator', role = 'admin'] = process.argv.slice(2);
if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Usage: npm run create-admin -- you@example.org "Your Name" [admin|editor]');
  process.exit(1);
}
if (!['admin', 'editor'].includes(role)) {
  console.error('Role must be "admin" or "editor".');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question('Password (min. 10 characters): ');
rl.close();
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const store = await initDb();
const passwordHash = await bcrypt.hash(password, 12);
const [existing] = await store.findBy('users', 'email', email.toLowerCase());
if (existing) {
  await store.update('users', existing.id, { passwordHash, role, name, active: true });
  console.log(`Updated ${role} account for ${email}.`);
} else {
  await store.create('users', { email: email.toLowerCase(), name, role, active: true, passwordHash });
  console.log(`Created ${role} account for ${email}.`);
}
await closeDb();
