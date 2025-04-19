import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const username = os.userInfo().username;
const dbHost = 'localhost';
const dbPort = 5432;
const dbName = 'mindcare';

const databaseUrl = `postgres://${username}@${dbHost}:${dbPort}/${dbName}`;

const envPath = path.join(__dirname, '.env');
let existing = '';

if (fs.existsSync(envPath)) {
  existing = fs.readFileSync(envPath, 'utf-8');
  existing = existing.replace(/^DATABASE_URL=.*$/m, '');
}
const apiKey = 'AIzaSyDDBlyHSbBKDNDghtk3Zq0TYwZ1n9VRyw4';
const combinedEnv = `${existing.trim()}DATABASE_URL=${databaseUrl}\nAI_PROVIDER="gemini"\nAI_API_KEY=${apiKey}\n`; // AI_provider="gemini" or "openai"
fs.writeFileSync(envPath, combinedEnv);
