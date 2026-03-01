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

    try {
        if (req.method === 'GET') {
            let folders;
            const isWildcard = Array.isArray(user.allowedFolders)
                ? (user.allowedFolders as string[]).some(f => f === '*')
                : !!(user.allowedFolders as Record<string, any>)['*'];

            if (user.role === 'admin' || isWildcard) {
                folders = await db.query('SELECT * FROM folders WHERE project_id = ? ORDER BY order_index ASC', [user.projectId]);
            } else {
                // To support both ID and Name based permissions during transition, 
                // we fetch all folders for the project and filter in JS.
                const allFolders = await db.query('SELECT * FROM folders WHERE project_id = ? ORDER BY order_index ASC', [user.projectId]);
                folders = allFolders.filter((f: any) => {
                    return (user.allowedFolders as any[]).some((p: any) => {
                        const idOrName = typeof p === 'string' ? p : p.folderId;
                        return idOrName === f.id || idOrName === f.name;
                    });
                });
            }

            // Inject role into each folder
            const enrichedFolders = folders.map((f: any) => {
                let effectiveRole = user.role;
                if (Array.isArray(user.allowedFolders)) {
                    if (user.allowedFolders.some(item => item === '*')) {
                        effectiveRole = user.role;
                    } else if (typeof user.allowedFolders[0] === 'object' && user.allowedFolders[0] !== null) {
                        const perm = (user.allowedFolders as any[]).find((p: any) => p.folderId === f.id);
                        if (perm) effectiveRole = perm.role;
                    } else if (user.allowedFolders.includes(f.id)) {
                        effectiveRole = user.role;
                    }
                } else if (user.allowedFolders && typeof user.allowedFolders === 'object') {
                    effectiveRole = (user.allowedFolders as any)[f.id] || (user.allowedFolders as any)[f.name] || user.role;
                }
                return { ...f, role: effectiveRole };
            });

            return res.status(200).json(enrichedFolders);
        }

        if (req.method === 'POST') {
            if (user.role === 'viewer') return res.status(403).json({ error: 'Viewer role cannot create folders' });

            const { id, name, description, order_index } = req.body;
            if (!id || !name) return res.status(400).json({ error: 'ID and Name are required' });

            await db.execute(
                'INSERT INTO folders (id, project_id, name, description, order_index, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
                [id, user.projectId, name, description || '', order_index || 0, 'synced']
            );

            // If editor, automatically grant permission to the folder they created (implementation detail: requires updating rbac_users in some setups, but here we assume allowed_folders includes it or is handled by admin)

            return res.status(201).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    } finally {
        await db.close();
    }
}
