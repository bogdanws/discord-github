import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

let db: Database;

export async function initDatabase(): Promise<void> {
  const verboseDb = sqlite3.verbose();
  db = await open({
    filename: './database.sqlite',
    driver: verboseDb.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS repository_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository TEXT NOT NULL UNIQUE,
      channel_id TEXT NOT NULL
    )
  `);

  console.log('Database initialized successfully.');
}

export async function assignRepository(repository: string, channelId: string): Promise<void> {
  await db.run(
    'INSERT OR REPLACE INTO repository_channels (repository, channel_id) VALUES (?, ?)',
    repository,
    channelId
  );
}

export async function getChannelForRepository(repository: string): Promise<string | undefined> {
  const row = await db.get('SELECT channel_id FROM repository_channels WHERE repository = ?', repository);
  return row?.channel_id;
}

export async function getAllRepositoryAssignments(): Promise<{ repository: string, channel_id: string }[]> {
  const rows = await db.all('SELECT repository, channel_id FROM repository_channels');
  return rows;
}