import { contextBridge, ipcRenderer } from 'electron'

export interface HttpRequestOptions {
    url: string
    method: string
    headers: Record<string, string>
    body?: string
}

export interface HttpResponse {
    success: boolean
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: string
    time: number
    size?: number
    error?: string
}

export interface ElectronAPI {
    // Window controls
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    // File system
    saveFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>
    readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
    selectDirectory: () => Promise<string | null>
    getAppPath: () => Promise<string>
    // HTTP requests
    sendHttpRequest: (opts: HttpRequestOptions) => Promise<HttpResponse>
    // Remote DB management
    testDbConnection: (url: string) => Promise<{ success: boolean; error?: string }>
    createRemoteTables: (url: string) => Promise<{ success: boolean; error?: string }>
    createRbacUser: (url: string, user: { id: string, email: string, token: string, allowedFolders: string[], projectId: string, role: string }) => Promise<{ success: boolean; error?: string }>
    syncDirect: (url: string, entries: any[]) => Promise<{ success: boolean; results?: any[]; error?: string }>
    deleteRemoteProject: (url: string, projectId: string) => Promise<{ success: boolean; error?: string }>
    getRbacUsers: (url: string, projectId: string) => Promise<{ success: boolean; users?: any[]; error?: string }>
    updateRbacUser: (url: string, user: { id: string, email: string, allowedFolders: any, role: string }) => Promise<{ success: boolean; error?: string }>
    deleteRbacUser: (url: string, userId: string) => Promise<{ success: boolean; error?: string }>
    fetchRemoteData: (url: string, projectId: string) => Promise<{ success: boolean; folders: any[]; apis: any[]; error?: string }>
    getRemoteProjects: (url: string) => Promise<{ success: boolean; projects?: any[]; error?: string }>
    // Deployment
    deployToVercel: (params: { databaseUrl: string, adminToken?: string, projectId: string, projectName: string }) => Promise<{ success: boolean; url?: string; error?: string }>
    deleteVercelProject: (params: { projectId: string, projectName: string }) => Promise<{ success: boolean; error?: string }>
    onDeployOutput: (callback: (data: string) => void) => () => void
    // Updates
    onUpdateStatus: (callback: (status: string, version?: string) => void) => () => void
    onUpdateProgress: (callback: (percent: number) => void) => () => void
    // Platform info
    platform: string
}

const electronAPI: ElectronAPI = {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    sendHttpRequest: (opts) => ipcRenderer.invoke('send-http-request', opts),
    testDbConnection: (url) => ipcRenderer.invoke('test-db-connection', url),
    createRemoteTables: (url) => ipcRenderer.invoke('create-remote-tables', url),
    createRbacUser: (url, user) => ipcRenderer.invoke('create-rbac-user', url, user),
    syncDirect: (url, entries) => ipcRenderer.invoke('sync-direct', url, entries),
    deleteRemoteProject: (url, projectId) => ipcRenderer.invoke('delete-remote-project', url, projectId),
    getRbacUsers: (url, projectId) => ipcRenderer.invoke('get-rbac-users', url, projectId),
    updateRbacUser: (url, user) => ipcRenderer.invoke('update-rbac-user', url, user),
    deleteRbacUser: (url, userId) => ipcRenderer.invoke('delete-rbac-user', url, userId),
    fetchRemoteData: (url, projectId) => ipcRenderer.invoke('fetch-remote-data', url, projectId),
    getRemoteProjects: (url) => ipcRenderer.invoke('get-remote-projects', url),
    // Deployment
    deployToVercel: (params) => ipcRenderer.invoke('deploy-to-vercel', params),
    deleteVercelProject: (params) => ipcRenderer.invoke('delete-vercel-project', params),
    onDeployOutput: (callback) => {
        const subscription = (_event: any, data: string) => callback(data)
        ipcRenderer.on('deploy-output', subscription)
        return () => ipcRenderer.removeListener('deploy-output', subscription)
    },
    onUpdateStatus: (callback) => {
        const subscription = (_event: any, status: string, version?: string) => callback(status, version)
        ipcRenderer.on('update-status', subscription)
        return () => ipcRenderer.removeListener('update-status', subscription)
    },
    onUpdateProgress: (callback) => {
        const subscription = (_event: any, percent: number) => callback(percent)
        ipcRenderer.on('update-progress', subscription)
        return () => ipcRenderer.removeListener('update-progress', subscription)
    },
    platform: process.platform
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
