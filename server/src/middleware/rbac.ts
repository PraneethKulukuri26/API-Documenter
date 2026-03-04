import { AuthContext } from './auth.js';

export async function checkFolderAccess(context: AuthContext, folderId: string, action: 'read' | 'write' | 'delete'): Promise<void> {
    const { user, db } = context;

    // Admin has full access
    if (user.role === 'admin') return;

    let effectiveRole: 'viewer' | 'editor' = user.role;
    let isAllowed = false;

    // 1. Check for legacy global wildcard
    if (Array.isArray(user.allowedFolders) && user.allowedFolders.some(f => f === '*')) {
        isAllowed = true;
    }
    else {
        // Try to find a direct match (ID or Name)
        const findMatch = (folders: any[], id: string, name?: string) => {
            return folders.some((p: any) => {
                const idOrName = typeof p === 'string' ? p : p.folderId;
                const match = idOrName === id || (name && idOrName === name);
                if (match && typeof p === 'object' && p.role) {
                    effectiveRole = p.role;
                }
                return match;
            });
        };

        if (Array.isArray(user.allowedFolders)) {
            // First try matching the ID
            if (findMatch(user.allowedFolders, folderId)) {
                isAllowed = true;
            } else {
                // If ID didn't match, maybe the name will. We need to fetch the folder info.
                const results = await db.query('SELECT name FROM folders WHERE id = ?', [folderId]) as any[];
                if (results.length > 0 && findMatch(user.allowedFolders, folderId, results[0].name)) {
                    isAllowed = true;
                }
            }
        }
        else if (user.allowedFolders && typeof user.allowedFolders === 'object') {
            // Legacy Record format
            const mapping = user.allowedFolders as Record<string, 'viewer' | 'editor'>;
            if (mapping[folderId]) {
                effectiveRole = mapping[folderId];
                isAllowed = true;
            } else {
                const results = await db.query('SELECT name FROM folders WHERE id = ?', [folderId]) as any[];
                if (results.length > 0 && mapping[results[0].name]) {
                    effectiveRole = mapping[results[0].name];
                    isAllowed = true;
                }
            }
        }
    }

    if (!isAllowed) {
        throw new Error(`Access denied to folder: ${folderId}`);
    }

    // Enforce role permissions
    if (effectiveRole === 'viewer' && action !== 'read') {
        throw new Error(`Viewer role cannot perform ${action} operations on folder: ${folderId}`);
    }

    if (effectiveRole === 'editor' && action === 'delete') {
        throw new Error(`Editor role cannot perform ${action} operations (Admin only)`);
    }
}

export function checkProjectAccess(context: AuthContext, projectId: string): void {
    if (context.user.projectId !== projectId) {
        throw new Error('Unauthorized project access');
    }
}

export async function checkEnvironmentAccess(context: AuthContext, envIdOrName: string, action: 'read' | 'write' | 'delete', isGlobal: boolean = false): Promise<void> {
    const { user } = context;

    // Admin has full access
    if (user.role === 'admin') return;

    // Globals are read-accessible to everyone in the project
    // If they want to write/delete global, they need to be an editor/admin
    // But usually global envs are handled specially.

    let effectiveRole: 'viewer' | 'editor' = user.role;
    let isAllowed = false;

    if (isGlobal) {
        if (action === 'read') return;
        isAllowed = true; // For now allow global edit if they are not viewer (checked later)
    } else {
        // Check specific permissions
        const match = user.allowedEnvironments.find((e: any) => {
            const idOrName = typeof e === 'string' ? e : e.envId;
            return idOrName === '*' || idOrName === envIdOrName;
        });

        if (match) {
            isAllowed = true;
            if (typeof match === 'object' && (match as any).role) {
                effectiveRole = (match as any).role;
            }
        }
    }

    if (!isAllowed) {
        throw new Error(`Access denied to environment: ${envIdOrName}`);
    }

    // Enforce role permissions
    if (effectiveRole === 'viewer' && action !== 'read') {
        throw new Error(`Viewer role cannot perform ${action} operations on environment`);
    }

    if (action === 'delete') {
        // Only global Admin role can delete environments in this project
        throw new Error(`Only project administrators can delete environments`);
    }
}
