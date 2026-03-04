import { useAppStore } from '@/stores/appStore'
import { useEnvironments } from '@/hooks/useEnvironments'
import { useState } from 'react'

export function EnvironmentSelector() {
    const { currentProjectId, currentEnvironmentId, selectEnvironment, setShowEnvironmentsDialog } = useAppStore()
    const { data: environments } = useEnvironments(currentProjectId)
    const [isOpen, setIsOpen] = useState(false)

    const activeEnv = environments?.find(e => e.id === currentEnvironmentId)
    const globals = environments?.find(e => e.isGlobal)

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <button onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                    width: '100%',
                    borderRadius: '10px', background: '#111111', border: '1px solid #1F1F1F',
                    color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: '150ms ease',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.background = '#151515' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F1F1F'; e.currentTarget.style.background = '#111' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span className="truncate" style={{ flex: 1, textAlign: 'left' }}>
                    {activeEnv ? activeEnv.name : 'No Environment'}
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}>
                    <polyline points="1,3 5,7 9,3" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setIsOpen(false)} />
                    <div className="fade-in"
                        style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                            background: '#111111', border: '1px solid #222', borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)', padding: '6px',
                            zIndex: 1001
                        }}>
                        <div style={{ padding: '8px 12px', color: '#4B5563', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Environments
                        </div>

                        <button onClick={() => { selectEnvironment(null); setIsOpen(false) }}
                            style={{
                                display: 'flex', width: '100%', padding: '10px 12px', borderRadius: '8px',
                                background: !currentEnvironmentId ? '#1F1F1F' : 'transparent',
                                color: !currentEnvironmentId ? '#FFFFFF' : '#9CA3AF', border: 'none',
                                fontSize: '13px', fontWeight: 500, textAlign: 'left', cursor: 'pointer',
                                transition: '150ms ease'
                            }}
                            onMouseEnter={e => { if (currentEnvironmentId) e.currentTarget.style.background = '#151515' }}
                            onMouseLeave={e => { if (currentEnvironmentId) e.currentTarget.style.background = 'transparent' }}>
                            No Environment
                        </button>

                        {environments?.map(e => (
                            <button key={e.id} onClick={() => { selectEnvironment(e.id); setIsOpen(false) }}
                                style={{
                                    display: 'flex', width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    background: currentEnvironmentId === e.id ? '#1F1F1F' : 'transparent',
                                    color: currentEnvironmentId === e.id ? '#FFFFFF' : (e.isGlobal ? '#3B82F6' : '#9CA3AF'),
                                    border: 'none',
                                    fontSize: '13px', fontWeight: 500, textAlign: 'left', cursor: 'pointer',
                                    transition: '150ms ease'
                                }}
                                onMouseEnter={el => { if (currentEnvironmentId !== e.id) el.currentTarget.style.background = '#151515' }}
                                onMouseLeave={el => { if (currentEnvironmentId !== e.id) el.currentTarget.style.background = 'transparent' }}>
                                {e.name} {e.isGlobal && ' (Global)'}
                            </button>
                        ))}

                        <div style={{ height: '1px', background: '#222', margin: '6px 8px' }} />

                        <button onClick={() => { setShowEnvironmentsDialog(true); setIsOpen(false) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px',
                                borderRadius: '8px', background: 'transparent', color: '#6B7280', border: 'none',
                                fontSize: '12px', fontWeight: 500, textAlign: 'left', cursor: 'pointer',
                                transition: '150ms ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = '#151515' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            Manage Environments
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
