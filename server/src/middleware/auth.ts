import { DbAdapter } from '../db/adapter.js';
import { initDB } from '../db/proxyDb.js';

export interface AuthContext {
    user: {
        id: string;
        email: string;
        role: 'viewer' | 'editor' | 'admin';
        allowedFolders: (string | { folderId: string; role: 'viewer' | 'editor' })[];
        allowedEnvironments: (string | { envId: string; role: 'viewer' | 'editor' })[];
        projectId: string;
    };
    db: DbAdapter;
}

export async function authenticate(req: any): Promise<AuthContext> {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
    const projectId = url.searchParams.get('projectId');
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) throw new Error('DATABASE_URL environment variable is not set');
    if (!token) throw new Error('Authentication token is required');
    if (!projectId) throw new Error('Project ID is required');

    const db = await initDB();

    try {
        console.log(`[Auth] Attempting login with token and projectId: ${projectId}`);
        const users = await db.query<any>(
            'SELECT id, email, role, allowed_folders, allowed_environments, project_id FROM rbac_users WHERE token = ? AND project_id = ?',
            [token, projectId]
        );

        if (users.length === 0) {
            throw new Error('Invalid token or project context');
        }

        const user = users[0];
        let allowedFolders: string[] | { folderId: string; role: 'viewer' | 'editor' }[] = [];

        try {
            const parsed = typeof user.allowed_folders === 'string'
                ? JSON.parse(user.allowed_folders)
                : user.allowed_folders;

            // Normalize to array of {folderId, role} or ['*']
            if (Array.isArray(parsed)) {
                if (parsed[0] === '*') {
                    allowedFolders = ['*'];
                } else if (typeof parsed[0] === 'object' && parsed[0] !== null) {
                    // New format: [{folderId, role}]
                    allowedFolders = parsed;
                } else {
                    // Legacy array: ['Id1', 'Id2'] -> map to global role
                    allowedFolders = parsed.map(id => ({ folderId: id, role: user.role }));
                }
            } else if (parsed && typeof parsed === 'object') {
                // Legacy object: {"IdOrName": "role"}
                allowedFolders = Object.entries(parsed).map(([key, role]) => ({
                    folderId: key,
                    role: role as any
                }));
            } else if (parsed === '*') {
                allowedFolders = ['*'];
            }
        } catch (e) {
            allowedFolders = [];
        }

        let allowedEnvironments: (string | { envId: string; role: 'viewer' | 'editor' })[] = [];
        try {
            const parsedEnv = typeof user.allowed_environments === 'string'
                ? JSON.parse(user.allowed_environments)
                : user.allowed_environments;
            allowedEnvironments = Array.isArray(parsedEnv) ? parsedEnv : [];
        } catch (e) {
            allowedEnvironments = [];
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                allowedFolders,
                allowedEnvironments,
                projectId: user.project_id
            },
            db
        };
    } catch (err) {
        throw err;
    }
}
