#!/usr/bin/env node
/**
 * Generate a versioned scrypt password hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   npm run hash-password
 *
 * Copy only the printed hash into server/.env (local) or /etc/loganb-api.env
 * (production). Never commit the plaintext password or put it in React env vars.
 */

const readline = require('readline');
const { hashPassword } = require('../src/auth/password');

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      const rl = readline.createInterface({ input: stdin, output: stdout });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }

    stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');

    let input = '';
    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');
        resolve(input);
        return;
      }
      if (char === '\u0003') {
        stdin.setRawMode(false);
        stdout.write('\n');
        reject(new Error('Cancelled'));
        return;
      }
      if (char === '\u007f' || char === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          stdout.clearLine?.(0);
          stdout.cursorTo?.(0);
          stdout.write(question + '*'.repeat(input.length));
        }
        return;
      }
      input += char;
      stdout.write('*');
    };

    stdin.on('data', onData);
  });
}

async function main() {
  const password = await promptHidden('Enter admin password: ');
  const confirm = await promptHidden('Confirm admin password: ');

  if (!password || password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }
  if (password !== confirm) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  console.log('\nAdd this to your API environment file (not GitHub, not React):\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\nAlso set ADMIN_EMAIL and a long random ADMIN_SESSION_SECRET (>= 32 chars).');
  console.log('Changing ADMIN_PASSWORD_HASH invalidates all existing admin sessions.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
