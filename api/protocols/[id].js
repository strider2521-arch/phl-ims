import { verifyToken } from '../../lib/auth.js';
import { withClient } from '../../lib/db.js';

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
    const { id } = req.query;
    const b = req.body || {};

    if (!id) return res.status(400).json({ error: 'Protocol ID required' });

    if (req.method === 'PUT') {
      await withClient((client) =>
        client.query(
          `UPDATE protocols SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            reconstitution = COALESCE($3, reconstitution),
            dosage = COALESCE($4, dosage),
            administration = COALESCE($5, administration),
            storage = COALESCE($6, storage),
            references = COALESCE($7, references),
            updated_at = NOW()
           WHERE id = $8`,
          [b.name ?? null, b.description ?? null, b.reconstitution ?? null,
           b.dosage ?? null, b.administration ?? null, b.storage ?? null,
           b.references ?? null, id]
        )
      );
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await withClient((client) => client.query('DELETE FROM protocols WHERE id = $1', [id]));
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}
