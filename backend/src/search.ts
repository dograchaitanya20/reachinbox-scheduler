import { Client } from '@elastic/elasticsearch';
import type { Email } from '@prisma/client';
export const es = new Client({ node: process.env.ELASTIC_URL ?? 'http://localhost:9200' });
const index = 'emails';
type Row = Pick<Email, 'id' | 'userId' | 'to' | 'subject' | 'body' | 'scheduledAt'> & Partial<Pick<Email, 'status' | 'sentAt'>>;
export async function ensureIndex() {
  if (await es.indices.exists({ index })) return;
  await es.indices.create({ index, mappings: { properties: {
    userId: { type: 'keyword' }, status: { type: 'keyword' }, to: { type: 'text' },
    subject: { type: 'text' }, body: { type: 'text' }, scheduledAt: { type: 'date' }, sentAt: { type: 'date' } } } });
}
// Postgres is the source of truth: search failures are logged, never block scheduling or sending
export async function indexEmails(rows: Row[]) {
  if (!rows.length) return;
  try {
    await es.bulk({ operations: rows.flatMap((r) => [{ index: { _index: index, _id: r.id } },
      { userId: r.userId, to: r.to, subject: r.subject, body: r.body, status: r.status ?? 'scheduled', scheduledAt: r.scheduledAt, sentAt: r.sentAt ?? null }]) });
  } catch (e) { console.error('es index failed:', (e as Error).message); }
}
export const esUpdate = (id: string, partial: object) =>
  es.update({ index, id, doc: partial, doc_as_upsert: true }).catch((e) => console.error('es update failed:', e.message));
