import crypto from 'crypto';
import { verifyToken } from '../lib/auth.js';
import { withClient } from '../lib/db.js';

function requireAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const user = verifyToken(token);
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return user;
}

export default async function handler(req, res) {
  try {
    requireAuth(req);
    const b = req.body || {};
    const id = req.query?.id;

    if (req.method === 'GET') {
      const result = await withClient(async (client) => {
        const { rows } = await client.query(`
          SELECT p.*, i.sku as item_sku, i.name as item_name
          FROM protocols p
          LEFT JOIN items i ON i.id = p.item_id
          ORDER BY p.name
        `);
        return rows;
      });
      return res.json(result);
    }

    if (req.method === 'POST') {
      if (!b.itemId || !b.name) return res.status(400).json({ error: 'itemId and name required' });
      const newId = crypto.randomUUID();
      await withClient((client) =>
        client.query(
          `INSERT INTO protocols (id, item_id, name, description, reconstitution, dosage, administration, storage, source_refs)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [newId, b.itemId, b.name, b.description || '', b.reconstitution || '',
           b.dosage || '', b.administration || '', b.storage || '', b.sourceRefs || '']
        )
      );
      return res.status(201).json({ id: newId, itemId: b.itemId, name: b.name });
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'Protocol ID required (query param ?id=)' });
      await withClient((client) =>
        client.query(
          `UPDATE protocols SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            reconstitution = COALESCE($3, reconstitution),
            dosage = COALESCE($4, dosage),
            administration = COALESCE($5, administration),
            storage = COALESCE($6, storage),
            source_refs = COALESCE($7, source_refs),
            updated_at = NOW()
           WHERE id = $8`,
          [b.name ?? null, b.description ?? null, b.reconstitution ?? null,
           b.dosage ?? null, b.administration ?? null, b.storage ?? null,
           b.sourceRefs ?? null, id]
        )
      );
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Protocol ID required (query param ?id=)' });
      await withClient((client) => client.query('DELETE FROM protocols WHERE id = $1', [id]));
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
