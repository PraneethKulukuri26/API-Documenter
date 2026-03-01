import { useState } from 'react'
import type { Project } from '@/types'

interface DeleteProjectModalProps {
    project: Project
    onClose: () => void
    onConfirm: (target: 'local' | 'remote' | 'both') => void
    isDeleting: boolean
}

export function DeleteProjectModal({ project, onClose, onConfirm, isDeleting }: DeleteProjectModalProps) {
    const [target, setTarget] = useState<'local' | 'remote' | 'both'>('local')

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} style={{ padding: '24px' }}>
            <div
                className="w-full bg-[#0a0a0a] rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in scale-in"
                style={{ maxWidth: '500px', border: '1px solid #222' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header Section */}
                <div style={{ padding: '24px', borderBottom: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="rounded-lg bg-red-500/10 flex items-center justify-center shrink-0" style={{ width: '32px', height: '32px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight" style={{ margin: 0 }}>Delete Project</h2>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed" style={{ margin: 0 }}>
                        Specify the scope of removal for <span className="text-white font-semibold">"{project.name}"</span>.
                        This action cannot be undone.
                    </p>
                </div>

                {/* Options Layout */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Option
                        id="local"
                        title="Local Persistence Only"
                        desc="Purge project from this device. Remote governance data remains intact."
                        selected={target === 'local'}
                        onClick={() => setTarget('local')}
                    />
                    <Option
                        id="remote"
                        title="Cloud Persistence Only"
                        desc="Erase from the remote infrastructure. Maintain local access."
                        selected={target === 'remote'}
                        onClick={() => setTarget('remote')}
                        disabled={!project.databaseUrl}
                    />
                    <Option
                        id="both"
                        title="Global Termination"
                        desc="Absolute destruction. Purge all data from both local and remote stores."
                        selected={target === 'both'}
                        onClick={() => setTarget('both')}
                        danger
                        disabled={!project.databaseUrl}
                    />
                </div>

                {/* Footer Section */}
                <div className="bg-[#0a0a0a]" style={{ padding: '20px 24px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                    <button
                        onClick={onClose}
                        className="text-[14px] font-bold text-neutral-500 hover:text-white transition-all disabled:opacity-20"
                        style={{ padding: '0 16px', height: '48px' }}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(target)}
                        className={`text-[14px] font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] ${target === 'local'
                                ? 'bg-white text-black hover:bg-neutral-200'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            } ${isDeleting ? 'opacity-20 cursor-wait' : ''}`}
                        style={{ padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Processing Termination...' : 'Confirm Destruction'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Option({ id, title, desc, selected, onClick, danger, disabled }: {
    id: string; title: string; desc: string; selected: boolean; onClick: () => void; danger?: boolean; disabled?: boolean
}) {
    if (disabled) return (
        <div
            className="rounded-xl border border-white/5 opacity-20 cursor-not-allowed bg-white/[0.02]"
            style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 className="text-[14px] font-bold text-neutral-500" style={{ margin: 0 }}>{title}</h3>
                <p className="text-[12px] text-neutral-600" style={{ margin: 0 }}>{desc} (Requires DB)</p>
            </div>
        </div>
    )

    return (
        <div
            onClick={onClick}
            className={`rounded-xl border cursor-pointer transition-all ${selected
                ? (danger ? 'bg-red-500/[0.03] border-red-500/30 ring-1 ring-red-500/20' : 'bg-white/[0.03] border-white/30 ring-1 ring-white/10')
                : 'bg-transparent border-white/5 hover:bg-white/[0.02] hover:border-white/10'}`}
            style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}
        >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 className={`text-[15px] font-bold ${selected ? 'text-white' : 'text-neutral-400'}`} style={{ margin: 0 }}>{title}</h3>
                    <div
                        className={`rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${selected
                            ? (danger ? 'border-red-500 bg-red-500' : 'border-white bg-white')
                            : 'border-white/10'}`}
                        style={{ width: '20px', height: '20px' }}
                    >
                        {selected && (
                            <div className={`rounded-full ${danger ? 'bg-white' : 'bg-black'}`} style={{ width: '8px', height: '8px' }} />
                        )}
                    </div>
                </div>
                <p className={`text-[13px] leading-relaxed ${selected ? 'text-neutral-400' : 'text-neutral-600'}`} style={{ margin: 0, paddingRight: '24px' }}>
                    {desc}
                </p>
            </div>
        </div>
    )
}