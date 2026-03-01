import Dexie, { type EntityTable } from 'dexie'
import type { Project, Folder, ApiCollection, SyncQueueItem, SavedTeamConnection } from '@/types'

class ApiDocumenterDB extends Dexie {
    projects!: EntityTable<Project, 'id'>
    folders!: EntityTable<Folder, 'id'>
    apiCollections!: EntityTable<ApiCollection, 'id'>
    syncQueue!: EntityTable<SyncQueueItem, 'id'>
    teamConnections!: EntityTable<SavedTeamConnection, 'id'>

    constructor() {
        super('ApiDocumenterDB')

        this.version(1).stores({
            projects: 'id, name, createdAt',
            folders: 'id, projectId, name, orderIndex, syncStatus, createdAt',
            apiCollections: 'id, projectId, folderId, name, method, syncStatus, createdAt',
            syncQueue: 'id, localId, tableName, status, createdAt'
        })

        this.version(2).stores({
            projects: 'id, name, createdAt',
            folders: 'id, projectId, name, orderIndex, syncStatus, createdAt',
            apiCollections: 'id, projectId, folderId, name, method, syncStatus, createdAt',
            syncQueue: 'id, localId, projectId, tableName, status, createdAt'
        })

        this.version(3).stores({
            projects: 'id, name, createdAt',
            folders: 'id, projectId, name, orderIndex, syncStatus, createdAt',
            apiCollections: 'id, projectId, folderId, name, method, syncStatus, createdAt',
            syncQueue: 'id, localId, projectId, tableName, status, createdAt',
            teamConnections: 'id, name, url, projectId, lastUsedAt'
        })
    }
}

export const db = new ApiDocumenterDB()
