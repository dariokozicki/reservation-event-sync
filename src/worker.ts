import { pool } from './db/client';
import { startEmailWorker } from './server/email-worker';

const boss = await startEmailWorker();
console.log('Confirmation worker ready.');

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  await boss.stop();
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
