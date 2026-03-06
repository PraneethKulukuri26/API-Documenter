import { authenticate } from '../src/middleware/auth.js';
import { checkFolderAccess } from '../src/middleware/rbac.js';

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let context;
    try {
        context = await authenticate(req);
    } catch (err: any) {
        return res.status(401).json({ error: err.message });
    }

    const { db, user } = context;
    const { entries } = req.body;

    console.log(`[Sync] User ${user.email} pushing ${entries?.length || 0} entries`);

    if (!Array.isArray(entries)) {
        return res.status(400).json({ error: 'Entries must be an array' });
    }

    try {
        const results = [];

        for (const entry of entries) {
            const { tableName, operation, data } = entry;
            const payload = typeof data === 'string' ? JSON.parse(data) : data;

            // Diagnostic: Log columns if it fails
            const getColumns = async (table: string) => {
                try {
                    const cols = await db.query<any>(`DESCRIBE ${table}`);
                    return cols.map(c => c.Field).join(', ');
                } catch (e) {
                    return 'unknown';
                }
            };

            try {
                if (tableName === 'projects') {
                    console.log(`[Sync] Processing project: ${payload.name} (${operation})`);
                    if (operation === 'create') {
                        // Projects are usually created by admin via Electron directly, 
                        // but we support sync for consistency.
                        await db.execute(
                            'INSERT INTO projects (id, name, database_url, proxy_url, last_deployed_at) VALUES (?, ?, ?, ?, ?)',
                            [payload.id, payload.name, payload.databaseUrl || '', payload.proxyUrl || '', payload.lastDeployedAt ? new Date(payload.lastDeployedAt) : null]
                        );
                    } else if (operation === 'update') {
                        await db.execute(
                            'UPDATE projects SET name = ?, database_url = ?, proxy_url = ?, last_deployed_at = ? WHERE id = ?',
                            [payload.name, payload.databaseUrl || '', payload.proxyUrl || '', payload.lastDeployedAt ? new Date(payload.lastDeployedAt) : null, payload.id]
                        );
                    }
                } else if (tableName === 'folders') {
                    console.log(`[Sync] Processing folder: ${payload.name} (${operation})`);
                    if (operation === 'delete') {
                        if (user.role !== 'admin') throw new Error('Admin only deletion');
                        await db.execute('DELETE FROM api_collections WHERE folder_id = ?', [payload.id]);
                        await db.execute('DELETE FROM folders WHERE id = ? AND project_id = ?', [payload.id, user.projectId]);
                    } else if (operation === 'create') {
                        if (user.role === 'viewer') throw new Error('Permission denied');
                        await db.execute(
                            'INSERT INTO folders (id, project_id, name, description, order_index, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
                            [payload.id, user.projectId, payload.name, payload.description || '', payload.orderIndex || 0, 'synced']
                        );
                    } else if (operation === 'update') {
                        checkFolderAccess(context, payload.id, 'write');
                        await db.execute(
                            'UPDATE folders SET name = ?, description = ?, order_index = ?, sync_status = ? WHERE id = ? AND project_id = ?',
                            [payload.name, payload.description, payload.orderIndex, 'synced', payload.id, user.projectId]
                        );
                    }
                } else if (tableName === 'apiCollections') {
                    const folderId = payload.folderId;
                    console.log(`[Sync] Processing API: ${payload.name} in folder ${folderId} (${operation})`);
                    if (operation === 'delete') {
                        if (user.role !== 'admin') throw new Error('Admin only deletion');
                        await db.execute('DELETE FROM api_collections WHERE id = ?', [payload.id]);
                    } else if (operation === 'create') {
                        checkFolderAccess(context, folderId, 'write');
                        await db.execute(
                            `INSERT INTO api_collections (
                id, project_id, folder_id, name, description, method, path, 
                url_params, headers, body_type, raw_type, form_data, urlencoded,
                request_body, response_examples, version, sync_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                payload.id, user.projectId, folderId, payload.name, payload.description || '', payload.method, payload.path,
                                JSON.stringify(payload.urlParams || []), JSON.stringify(payload.headers || []),
                                payload.bodyType || 'none', payload.rawType || 'json',
                                JSON.stringify(payload.formData || []), JSON.stringify(payload.urlencoded || []),
                                payload.requestBody || '',
                                JSON.stringify(payload.responseExamples || []), payload.version || 1, 'synced'
                            ]
                        );
                    } else if (operation === 'update') {
                        checkFolderAccess(context, folderId, 'write');
                        await db.execute(
                            `UPDATE api_collections SET 
                name = ?, description = ?, method = ?, path = ?, 
                url_params = ?, headers = ?, body_type = ?, raw_type = ?,
                form_data = ?, urlencoded = ?,
                request_body = ?, response_examples = ?, version = ?, sync_status = ?
              WHERE id = ?`,
                            [
                                payload.name, payload.description, payload.method, payload.path,
                                JSON.stringify(payload.urlParams), JSON.stringify(payload.headers), payload.bodyType, payload.rawType,
                                JSON.stringify(payload.formData), JSON.stringify(payload.urlencoded),
                                payload.requestBody, JSON.stringify(payload.responseExamples), payload.version, 'synced',
                                payload.id
                            ]
                        );
                    }
                } else if (tableName === 'environments') {
                    console.log(`[Sync] Processing environment: ${payload.name} (${operation})`);
                    if (operation === 'delete') {
                        if (user.role !== 'admin') throw new Error('Admin only deletion');
                        await db.execute('DELETE FROM environments WHERE id = ? AND project_id = ?', [payload.id, user.projectId]);
                    } else if (operation === 'create') {
                        await db.execute(
                            'INSERT INTO environments (id, project_id, folder_id, name, base_url, is_global, variables) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [payload.id, user.projectId, payload.folderId || null, payload.name, payload.baseUrl || '', payload.isGlobal ? 1 : 0, payload.variables || '{}']
                        );
                    } else if (operation === 'update') {
                        await db.execute(
                            'UPDATE environments SET name = ?, base_url = ?, is_global = ?, folder_id = ?, variables = ? WHERE id = ? AND project_id = ?',
                            [payload.name, payload.baseUrl || '', payload.isGlobal ? 1 : 0, payload.folderId || null, payload.variables, payload.id, user.projectId]
                        );
                    }
                }
                results.push({ id: entry.id, status: 'synced' });
            } catch (e: any) {
                const cols = await getColumns(tableName === 'apiCollections' ? 'api_collections' : tableName);
                console.error(`[Sync] Failed entry ${entry.id} on table ${tableName}:`, e.message, `| Available columns: ${cols}`);
                results.push({ id: entry.id, status: 'failed', error: e.message });
            }
        }

        return res.status(200).json({ results });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    } finally {
    }
}
