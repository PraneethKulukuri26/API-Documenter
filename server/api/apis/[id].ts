import { authenticate } from '../../src/middleware/auth.js';
import { checkFolderAccess } from '../../src/middleware/rbac.js';
import { rateLimit } from '../../src/middleware/rateLimit.js';

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    let context;
    try {
        context = await authenticate(req);
        const token = req.headers.authorization?.replace('Bearer ', '') || new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
        if (token) rateLimit(token);
    } catch (err: any) {
        return res.status(401).json({ error: err.message });
    }

    const { db, user } = context;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.pathname.split('/').pop();

    if (!id) {
        return res.status(400).json({ error: 'API ID is required' });
    }

    try {
        // First, find the API and check its parent folder access
        const apis = await db.query<any>('SELECT folder_id FROM api_collections WHERE id = ? AND project_id = ?', [id, user.projectId]);
        if (apis.length === 0) return res.status(404).json({ error: 'API not found' });
        const folderId = apis[0].folder_id;

        if (req.method === 'GET') {
            await checkFolderAccess(context, folderId, 'read');
            const data = await db.query('SELECT * FROM api_collections WHERE id = ?', [id]);
            return res.status(200).json(data[0]);
        }

        if (req.method === 'PUT') {
            await checkFolderAccess(context, folderId, 'write');
            const {
                name, description, method, path,
                url_params, headers, body_type, raw_type, form_data, urlencoded,
                request_body, response_examples, version
            } = req.body;

            await db.execute(
                `UPDATE api_collections SET 
          name = ?, description = ?, method = ?, path = ?, 
          url_params = ?, headers = ?, body_type = ?, raw_type = ?,
          form_data = ?, urlencoded = ?, 
          request_body = ?, response_examples = ?, version = ?, sync_status = ?
        WHERE id = ?`,
                [
                    name, description, method, path,
                    JSON.stringify(url_params), JSON.stringify(headers), body_type, raw_type,
                    JSON.stringify(form_data), JSON.stringify(urlencoded),
                    request_body, JSON.stringify(response_examples), version, 'synced',
                    id
                ]
            );

            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            await checkFolderAccess(context, folderId, 'write');
            await db.execute('DELETE FROM api_collections WHERE id = ?', [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
