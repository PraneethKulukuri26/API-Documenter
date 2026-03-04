import { DbAdapter, createAdapter } from './adapter.js';

let db: DbAdapter | null = null;
let schemaChecked = false;

export async function initDB() {
    if (!db) {
        const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
        if (!dbUrl) throw new Error('DATABASE_URL environment variable is not set');
        db = await createAdapter(dbUrl);
    }

    if (!schemaChecked) {
        // Auto-migrate schema once per server lifecycle
        await ensureSchema(db);
        schemaChecked = true;
    }

    return db;
}

export async function ensureSchema(adapter: DbAdapter) {
    console.log('[Schema] Checking for updates...');
    try {
        // 1. Create environments table
        await adapter.execute(`
            CREATE TABLE IF NOT EXISTS environments (
                id VARCHAR(50) PRIMARY KEY,
                project_id VARCHAR(50),
                folder_id VARCHAR(50),
                name VARCHAR(100) NOT NULL,
                base_url TEXT,
                is_global BOOLEAN DEFAULT FALSE,
                variables TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[Schema] Environments table ready.');

        // 2. Add allowed_environments to rbac_users
        try {
            await adapter.execute('ALTER TABLE rbac_users ADD COLUMN allowed_environments TEXT');
            console.log('[Schema] Column allowed_environments added.');
        } catch (e: any) {
            // Ignore if column already exists (Error 1060 in MySQL)
            const msg = e.message.toLowerCase();
            const isDuplicate = msg.includes('duplicate') || msg.includes('already exists') || msg.includes('1060');
            if (!isDuplicate) {
                console.warn('[Schema] Column update warning:', e.message);
            } else {
                console.log('[Schema] Column allowed_environments already exists.');
            }
        }
    } catch (err: any) {
        console.error('[Schema] Migration error:', err.message);
    }
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
