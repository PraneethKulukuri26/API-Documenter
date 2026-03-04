import { useAppStore } from '@/stores/appStore'
import { useEnvironments, useCreateEnvironment, useUpdateEnvironment, useDeleteEnvironment } from '@/hooks/useEnvironments'
import { useState, useEffect } from 'react'
import type { Environment, KeyValuePair } from '@/types'
import { KeyValueEditor } from './KeyValueEditor'
import { v4 as uuid } from 'uuid'

export function EnvironmentsDialog() {
    const { currentProjectId, showEnvironmentsDialog, setShowEnvironmentsDialog, proxyConnection, isTeamWorkspace } = useAppStore()
    const { data: environments } = useEnvironments(currentProjectId)
    const createEnv = useCreateEnvironment()
    const updateEnv = useUpdateEnvironment()
    const deleteEnv = useDeleteEnvironment()

    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [editingPairs, setEditingPairs] = useState<KeyValuePair[]>([])

    const selectedEnv = environments?.find(e => e.id === selectedEnvId)
    const isViewer = isTeamWorkspace && (selectedEnv?.role === 'viewer' || proxyConnection?.userRole === 'viewer')
    const canCreate = !isTeamWorkspace || proxyConnection?.userRole !== 'viewer'
    const canDelete = !isTeamWorkspace || proxyConnection?.userRole === 'admin'

    useEffect(() => {
        if (environments && environments.length > 0 && !selectedEnvId) {
            setSelectedEnvId(environments[0].id)
        }
    }, [environments, selectedEnvId])

    useEffect(() => {
        const env = environments?.find(e => e.id === selectedEnvId)
        if (env) {
            setEditingName(env.name)
            try {
                const parsed = JSON.parse(env.variables || '{}')
                const pairs: KeyValuePair[] = Object.entries(parsed).map(([k, v]) => ({
                    id: uuid(),
                    key: k,
                    value: String(v),
                    enabled: true
                }))
                setEditingPairs(pairs.length > 0 ? pairs : [{ id: uuid(), key: '', value: '', enabled: true }])
            } catch (e) {
                setEditingPairs([{ id: uuid(), key: '', value: '', enabled: true }])
            }
        } else {
            setEditingName('')
            setEditingPairs([])
        }
    }, [selectedEnvId, environments])

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowEnvironmentsDialog(false)
        }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [setShowEnvironmentsDialog])

    if (!showEnvironmentsDialog) return null

    const handleSave = () => {
        const env = environments?.find(e => e.id === selectedEnvId)
        if (env) {
            const varsObj: Record<string, string> = {}
            editingPairs.filter(p => p.key && p.enabled).forEach(p => {
                varsObj[p.key] = p.value
            })

            updateEnv.mutate({
                ...env,
                name: editingName,
                variables: JSON.stringify(varsObj)
            })
        }
    }

    const handleAdd = async () => {
        if (!currentProjectId) return
        const newEnv = await createEnv.mutateAsync({
            projectId: currentProjectId,
            name: 'New Environment',
            baseUrl: '',
            isGlobal: false,
            variables: '{}'
        })
        setSelectedEnvId(newEnv.id)
    }

    return (
        <div
            className="fade-in"
            onClick={() => setShowEnvironmentsDialog(false)}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'relative',
                    background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: '16px',
                    width: '900px', height: '600px', display: 'flex', overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                    animation: 'modalIn 200ms ease-out'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={() => setShowEnvironmentsDialog(false)}
                    style={{
                        position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                        color: '#9CA3AF', borderRadius: '8px', cursor: 'pointer', transition: '150ms ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#9CA3AF' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Sidebar */}
                <div style={{ width: '260px', borderRight: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>
                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#9CA3AF' }}>Environments</h3>
                            {canCreate && (
                                <button onClick={handleAdd} style={{ background: '#1F1F1F', border: 'none', color: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>+ New</button>
                            )}
                        </div>
                        {environments?.map(e => (
                            <button key={e.id} onClick={() => setSelectedEnvId(e.id)}
                                style={{
                                    display: 'flex', width: '100%', padding: '10px 12px', marginBottom: '4px', borderRadius: '8px',
                                    background: selectedEnvId === e.id ? '#1F1F1F' : 'transparent',
                                    color: selectedEnvId === e.id ? '#FFFFFF' : '#6B7280', border: 'none',
                                    fontSize: '13px', fontWeight: 500, textAlign: 'left', cursor: 'pointer', transition: '150ms ease'
                                }}>
                                {e.name} {e.isGlobal && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#3B82F6', fontWeight: 700 }}>GLOBAL</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0A0A0A' }}>
                    {selectedEnvId && environments?.some(e => e.id === selectedEnvId) ? (
                        <>
                            <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Environment Name</label>
                                        <input value={editingName} onChange={e => !isViewer && setEditingName(e.target.value)}
                                            placeholder="Environment Name"
                                            readOnly={isViewer}
                                            style={{ background: 'transparent', border: 'none', fontSize: '24px', fontWeight: 600, color: '#FFFFFF', outline: 'none', width: '100%', paddingLeft: 0, cursor: isViewer ? 'default' : 'text' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '40px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>Variables</label>
                                    <KeyValueEditor pairs={editingPairs} onChange={setEditingPairs} keyPlaceholder="Variable" valuePlaceholder="Value" readOnly={isViewer} />
                                </div>
                            </div>

                            {/* Footer */}
                            {!isViewer && (
                                <div style={{ padding: '24px 32px', borderTop: '1px solid #1F1F1F', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: '#0D0D0D' }}>
                                    {canDelete && !(environments?.find(e => e.id === selectedEnvId)?.isGlobal) && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this environment? This action cannot be undone.')) {
                                                    deleteEnv.mutate({ id: selectedEnvId, projectId: currentProjectId! }, { onSuccess: () => setSelectedEnvId(null) })
                                                }
                                            }}
                                            disabled={deleteEnv.isPending}
                                            style={{
                                                background: 'transparent', color: '#EF4444', border: '1px solid #1F1F1F',
                                                padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
                                                cursor: deleteEnv.isPending ? 'not-allowed' : 'pointer', opacity: deleteEnv.isPending ? 0.5 : 1
                                            }}
                                        >
                                            {deleteEnv.isPending ? 'Deleting...' : 'Delete'}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={updateEnv.isPending}
                                        style={{
                                            background: '#FFFFFF', color: '#000000', border: 'none',
                                            padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                                            cursor: updateEnv.isPending ? 'not-allowed' : 'pointer', opacity: updateEnv.isPending ? 0.7 : 1
                                        }}
                                    >
                                        {updateEnv.isPending ? 'Saving Changes...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', fontSize: '14px' }}>
                            Select an environment to edit
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
