import * as SQLite from 'expo-sqlite';
import { defaultPreferences, type HistoryEntry, type Preferences } from '../domain/history';
let database: Promise<SQLite.SQLiteDatabase> | null = null;
function db() {
  if (!database) database = (async () => {
    const d = await SQLite.openDatabaseAsync('sway-private.db');
    await d.execAsync(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, responded_at TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, payload TEXT NOT NULL);`);
    return d;
  })();
  return database;
}
export async function readHistory(): Promise<HistoryEntry[]> {
  const rows = await (await db()).getAllAsync<{ payload: string }>('SELECT payload FROM history ORDER BY responded_at, rowid');
  return rows.map(row => JSON.parse(row.payload));
}
export async function insertResponse(entry: HistoryEntry) {
  await (await db()).runAsync('INSERT OR IGNORE INTO history(id,responded_at,payload) VALUES (?,?,?)', entry.id, entry.respondedAt, JSON.stringify(entry));
}
export async function updateResponse(entry: HistoryEntry) {
  await (await db()).runAsync('UPDATE history SET payload=? WHERE id=?', JSON.stringify(entry), entry.id);
}
export async function readPreferences(): Promise<Preferences> {
  const row = await (await db()).getFirstAsync<{ payload: string }>("SELECT payload FROM settings WHERE key='preferences'");
  return row ? { ...defaultPreferences, ...JSON.parse(row.payload) } : defaultPreferences;
}
export async function savePreferences(prefs: Preferences) {
  await (await db()).runAsync("INSERT INTO settings(key,payload) VALUES ('preferences',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload", JSON.stringify(prefs));
}
export async function readSessionInsight(sessionId: string): Promise<string | null | undefined> {
  const row = await (await db()).getFirstAsync<{ payload: string }>('SELECT payload FROM settings WHERE key=?', `insight:${sessionId}`);
  return row ? JSON.parse(row.payload) : undefined;
}
export async function saveSessionInsight(sessionId: string, insight: string | null) {
  await (await db()).runAsync("INSERT INTO settings(key,payload) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload WHERE settings.payload='null'", `insight:${sessionId}`, JSON.stringify(insight));
}
