/**
 * Utility to map remote snake_case API responses to camelCase frontend types
 * and parse nested JSON strings.
 */

export function mapRemoteFolder(f: any): any {
    if (!f) return f;
    return {
        id: f.id,
        projectId: f.project_id || f.projectId,
        name: f.name,
        description: f.description,
        orderIndex: f.order_index ?? f.orderIndex ?? 0,
        lastSync: f.last_sync || f.lastSync || null,
        syncStatus: f.sync_status || f.syncStatus || 'synced',
        createdAt: f.created_at || f.createdAt,
        role: f.role
    };
}

export function mapRemoteApi(a: any): any {
    if (!a) return a;

    // Parse nested JSON if they are strings (typical for direct SQL results)
    const parseJson = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    };

    return {
        id: a.id,
        projectId: a.project_id || a.projectId,
        folderId: a.folder_id || a.folderId,
        name: a.name,
        description: a.description,
        method: a.method,
        path: a.path,
        urlParams: parseJson(a.url_params || a.urlParams || []),
        headers: parseJson(a.headers || a.headers || []),
        bodyType: a.body_type || a.bodyType || 'none',
        requestBody: a.request_body || a.requestBody || '',
        responseExamples: parseJson(a.response_examples || a.responseExamples || []),
        version: a.version || 1,
        lastSync: a.last_sync || a.lastSync || null,
        syncStatus: a.sync_status || a.syncStatus || 'synced',
        createdAt: a.created_at || a.createdAt
    };
}
export function mapRemoteEnvironment(e: any): any {
    if (!e) return e;
    return {
        id: e.id,
        projectId: e.project_id || e.projectId,
        folderId: e.folder_id || e.folderId || null,
        name: e.name,
        baseUrl: e.base_url || e.baseUrl || '',
        isGlobal: [1, true, 'true', '1'].includes(e.is_global ?? e.isGlobal),
        variables: e.variables || '{}',
        lastSync: e.last_sync || e.lastSync || null,
        syncStatus: 'synced',
        createdAt: e.created_at || e.createdAt
    };
}
