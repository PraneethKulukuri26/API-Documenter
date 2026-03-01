import { DbAdapter, createAdapter } from './adapter.js';

let db: DbAdapter | null = null;

export async function initDB() {
    if (db) return db;
    const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
    if (!dbUrl) throw new Error('DATABASE_URL environment variable is not set');
    db = await createAdapter(dbUrl);
    return db;
}

export async function verifyUserRole(adapter: DbAdapter, user: string | null, token: string, projectId: string) {
    if (user && user !== 'undefined') {
        const rows = await adapter.query<any>(
            'SELECT id, role, allowed_folders FROM rbac_users WHERE id = ? AND token = ? AND project_id = ?',
            [user, token, projectId]
        );
        return rows[0];
    } else {
        // Fallback: lookup by token and projectId if user ID is missing
        const rows = await adapter.query<any>(
            'SELECT id, role, allowed_folders FROM rbac_users WHERE token = ? AND project_id = ?',
            [token, projectId]
        );
        return rows[0];
    }
}

export async function getAllFolders(adapter: DbAdapter, projectId: string) {
    const rows = await adapter.query<any>(
        'SELECT id, name, description FROM folders WHERE project_id = ? ORDER BY order_index',
        [projectId]
    );
    return rows;
}

export async function getApisByFolders(adapter: DbAdapter, projectId: string, allowedFolders: string[]) {
    if (allowedFolders.length === 0) return [];

    // Note: This assumes allowedFolders contains folder NAMES as per user's provided code
    // However, our schema uses IDs for folder_id. We'll stick to names as requested if that's the logic.
    // But usually folder names aren't unique enough. Let's adapt to IDs if necessary.
    // Re-reading user code: "WHERE f.name IN (...)"

    const placeholders = allowedFolders.map(() => '?').join(',');
    const rows = await adapter.query<any>(`
        SELECT ac.*, f.name as folder_name, f.description as folder_description 
        FROM api_collections ac
        JOIN folders f ON ac.folder_id = f.id
        WHERE ac.project_id = ? AND f.name IN (${placeholders})
        ORDER BY f.order_index, ac.created_at
    `, [projectId, ...allowedFolders]);

    return rows.map(row => ({
        ...row,
        headers: JSON.parse(row.headers || '[]'),
        request_body: JSON.parse(row.request_body || '{}')
    }));
}

export async function getFolderById(adapter: DbAdapter, folderId: string, projectId: string) {
    const rows = await adapter.query<any>('SELECT * FROM folders WHERE id = ? AND project_id = ?', [folderId, projectId]);
    return rows[0];
}

export async function getApisByFolder(adapter: DbAdapter, folderId: string, projectId: string) {
    const rows = await adapter.query<any>('SELECT * FROM api_collections WHERE folder_id = ? AND project_id = ?', [folderId, projectId]);
    return rows;
}
