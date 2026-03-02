import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useProject, useUpdateProject, triggerFullProjectSync } from '@/hooks/useProjects'
import { useQueryClient } from '@tanstack/react-query'

export function DatabaseSettingsDialog() {
    const { currentProjectId, setShowDatabaseSettings } = useAppStore()
    const { data: project } = useProject(currentProjectId)
    const updateProject = useUpdateProject()
    const qc = useQueryClient()

    const [dbUrl, setDbUrl] = useState(project?.databaseUrl || '')
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

    useEffect(() => {
        if (project) {
            setDbUrl(project.databaseUrl || '')
        }
    }, [project?.id, project?.databaseUrl])

    const handleTest = async () => {
        setTesting(true)
        const res = await window.electronAPI.testDbConnection(dbUrl)
        setTestResult(res)
        setTesting(false)
        if (res.success) {
            updateProject.mutate({ id: currentProjectId!, databaseUrl: dbUrl })
        }
    }

    const handleCreateTables = async () => {
        if (!confirm('This will create tables and SYNC all existing data for this project to the remote database. Continue?')) return
        setTesting(true)
        try {
            if (project) {
                await triggerFullProjectSync(qc, { ...project, databaseUrl: dbUrl })
                setTestResult({ success: true })
            }
        } catch (err: any) {
            setTestResult({ success: false, error: err.message })
        }
        setTesting(false)
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" style={{ padding: '24px' }}>
            <div
                className="w-full bg-[#0a0a0a] rounded-[16px] shadow-2xl flex flex-col overflow-hidden scale-in"
                style={{ maxWidth: '700px', border: '1px solid #222' }}
            >
                {/* Header Section */}
                <div style={{ padding: '24px', borderBottom: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="rounded-lg bg-white/10 flex items-center justify-center border border-white/5 shrink-0" style={{ width: '32px', height: '32px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-white tracking-tight" style={{ margin: 0 }}>Database Settings</h2>
                        </div>
                        <button
                            onClick={() => setShowDatabaseSettings(false)}
                            className="text-neutral-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            style={{ padding: '6px' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="15" y1="5" x2="5" y2="15" /><line x1="5" y1="5" x2="15" y2="15" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-neutral-400" style={{ margin: 0 }}>Configure external persistence and remote project synchronization</p>
                </div>

                {/* Body Content Area */}
                <div className="custom-scrollbar" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', maxHeight: '60vh' }}>

                    {/* Database URL Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest" style={{ margin: 0 }}>Database Connection URL</label>
                        <input
                            value={dbUrl}
                            onChange={e => setDbUrl(e.target.value)}
                            placeholder="mysql://user:pass@host:3306/db"
                            className="bg-black border border-[#333] rounded-xl text-sm text-white font-mono outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-600"
                            style={{ width: '100%', padding: '16px' }}
                        />
                        <p className="text-[12px] text-neutral-500" style={{ margin: '4px 0 0 4px' }}>
                            Tip: Clearing this field will revert storage to your local SQLite instance.
                        </p>
                    </div>

                    {/* Action Buttons Group */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <button
                            onClick={handleTest}
                            disabled={testing || !dbUrl}
                            className={`bg-white text-black text-[14px] font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] ${testing || !dbUrl ? 'opacity-20' : 'hover:bg-neutral-100'}`}
                            style={{ padding: '16px' }}
                        >
                            {testing ? 'Verifying...' : 'Test Connection'}
                        </button>

                        <button
                            onClick={async () => {
                                if (dbUrl !== project?.databaseUrl) {
                                    // If URL changed but not tested/saved yet
                                    await handleTest()
                                }
                                await handleCreateTables()
                                setShowDatabaseSettings(false)
                            }}
                            disabled={testing || !dbUrl}
                            className={`bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[14px] font-bold rounded-xl transition-all active:scale-[0.98] ${testing || !dbUrl ? 'opacity-20' : 'hover:bg-blue-600/20'}`}
                            style={{ padding: '16px' }}
                        >
                            {project?.databaseUrl === dbUrl && dbUrl ? 'Sync Now' : 'Connect & Sync'}
                        </button>
                    </div>

                    {/* Verification Result Banner */}
                    {testResult && (
                        <div
                            className={`rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 ${testResult.success ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/5 text-red-400 border border-red-500/10'}`}
                            style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}
                        >
                            <div className={`rounded-lg flex items-center justify-center shrink-0 ${testResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} style={{ width: '32px', height: '32px' }}>
                                {testResult.success ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="font-bold text-[13px] uppercase tracking-widest">{testResult.success ? 'Verification Successful' : 'Verification Failed'}</span>
                                <span className="text-[13px] text-neutral-400 opacity-80 leading-relaxed">{testResult.success ? 'Your database connection is stable and ready.' : testResult.error}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Footer Bar */}
                <div className="bg-black/40 text-xs flex-wrap" style={{ padding: '20px 24px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="font-bold text-neutral-500 uppercase tracking-widest text-[10px]">Active Driver</span>
                        <span className="font-mono text-neutral-300 bg-white/5 rounded border border-white/10" style={{ padding: '4px 8px' }}>{dbUrl.split(':')[0] || 'none'}</span>
                    </div>
                    <div className="text-neutral-400" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" style={{ width: '6px', height: '6px' }} />
                        <span>Operational. Ready for large-scale ingestion.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}