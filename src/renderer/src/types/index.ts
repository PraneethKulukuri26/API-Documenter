// ─── HTTP Method Types ───────────────────────────────────────────
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type BodyType = 'json' | 'form' | 'raw' | 'none'

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'offline'

export type UserRole = 'viewer' | 'editor' | 'admin'

// ─── Key-Value Pairs (Headers, Params) ──────────────────────────
export interface KeyValuePair {
    id: string
    key: string
    value: string
    enabled: boolean
}

// ─── Response Example Metadata ──────────────────────────────────
export interface ResponseExampleMetadata {
    contentType: string
    isDefault: boolean
    deprecated: boolean
    version?: string
    tags?: string[]
    responseTime?: number
    responseSize?: number
    notes?: string
}

// ─── Response Examples ──────────────────────────────────────────
export interface ResponseExample {
    id: string
    statusCode: number
    title: string
    description: string
    body: string
    headers?: KeyValuePair[]
    metadata: ResponseExampleMetadata
    createdAt: number
    updatedAt: number
}

// ─── Core Data Models ───────────────────────────────────────────
export interface Project {
    id: string
    name: string
    databaseUrl?: string
    proxyUrl?: string
    lastDeployedAt?: number
    createdAt: number
}

export interface Folder {
    id: string
    projectId: string
    name: string
    description: string
    orderIndex: number
    role?: UserRole
    lastSync: number | null
    syncStatus: SyncStatus
    createdAt: number
}

export interface ApiCollection {
    id: string
    projectId: string
    folderId: string
    name: string
    description: string
    method: HttpMethod
    path: string
    urlParams: KeyValuePair[]
    headers: KeyValuePair[]
    bodyType: BodyType
    requestBody: string
    responseExamples: ResponseExample[]
    version: number
    lastSync: number | null
    syncStatus: SyncStatus
    createdAt: number
}

// ─── Sync Queue ─────────────────────────────────────────────────
export type SyncTableName = 'projects' | 'folders' | 'apiCollections'
export type SyncOperation = 'create' | 'update' | 'delete'

export interface SyncQueueItem {
    id: string
    localId: string
    projectId: string
    tableName: SyncTableName
    operation: SyncOperation
    data: string
    status: 'pending' | 'synced' | 'failed'
    retries: number
    createdAt: number
}

export interface FolderPermission {
    folderId: string
    role: UserRole
}

// ─── RBAC User ──────────────────────────────────────────────────
export interface RbacUser {
    id: string
    email: string
    token: string
    allowedFolders: string[] | FolderPermission[]
    projectId: string
    role: UserRole
    createdAt: number
}

// ─── Proxy Connection ───────────────────────────────────────────
export interface ProxyConnection {
    proxyUrl: string
    token: string
    connected: boolean
    userRole?: UserRole
    allowedFolders?: string[] | FolderPermission[]
}

export interface SavedTeamConnection {
    id: string
    name: string
    url: string
    token: string
    projectId: string
    lastUsedAt: number
}

// ─── UI State Types ─────────────────────────────────────────────
export type EditorTab = 'params' | 'headers' | 'body' | 'responses'

// ─── Method Colors (using raw CSS values for style prop) ────────
export interface MethodColorStyle {
    bg: string
    text: string
    border: string
}

export const METHOD_COLORS: Record<HttpMethod, MethodColorStyle> = {
    GET: { bg: 'transparent', text: '#FFFFFF', border: '#2A2A2A' },
    POST: { bg: 'transparent', text: '#FFFFFF', border: '#2A2A2A' },
    PUT: { bg: 'transparent', text: '#FFFFFF', border: '#2A2A2A' },
    DELETE: { bg: 'transparent', text: '#FFFFFF', border: '#2A2A2A' },
    PATCH: { bg: 'transparent', text: '#FFFFFF', border: '#2A2A2A' },
    HEAD: { bg: 'transparent', text: '#FFFFFF', border: '#2A2A2A' },
    OPTIONS: { bg: 'transparent', text: '#FFFFFF', border: '#2A2A2A' }
}

export const SYNC_ICONS: Record<SyncStatus, { icon: string; label: string }> = {
    synced: { icon: '✓', label: 'Synced' },
    pending: { icon: '↻', label: 'Pending sync' },
    conflict: { icon: '⚠', label: 'Conflict' },
    offline: { icon: '◉', label: 'Local only' }
}
