import React, { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useProject, useDeleteProject } from '@/hooks/useProjects'
import { useQueryClient } from '@tanstack/react-query'
import { DeleteProjectModal } from './DeleteProjectModal'

export function GeneralSettingsDialog() {
    const { currentProjectId, setShowGeneralSettings, selectProject } = useAppStore()
    const { data: project } = useProject(currentProjectId)
    const deleteProject = useDeleteProject()
    const qc = useQueryClient()

    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const handleDeleteProject = async (target: 'local' | 'remote' | 'both') => {
        if (!project) return
        await deleteProject.mutateAsync({ id: project.id, target })

        if (target === 'local' || target === 'both') {
            selectProject(null)
            setShowGeneralSettings(false)
        } else {
            setShowDeleteModal(false)
            qc.invalidateQueries({ queryKey: ['project', project.id] })
        }
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" style={{ padding: '24px' }}>
            <div
                className="w-full bg-[#0a0a0a] rounded-[16px] shadow-2xl flex flex-col overflow-hidden scale-in"
                style={{ maxWidth: '600px', border: '1px solid #222' }}
            >
                {/* Header Section */}
                <div style={{ padding: '24px', borderBottom: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="rounded-lg bg-white/10 flex items-center justify-center border border-white/5 shrink-0" style={{ width: '32px', height: '32px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-white tracking-tight" style={{ margin: 0 }}>Project Settings</h2>
                        </div>
                        <button
                            onClick={() => setShowGeneralSettings(false)}
                            className="text-neutral-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            style={{ padding: '6px' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="15" y1="5" x2="5" y2="15" /><line x1="5" y1="5" x2="15" y2="15" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-neutral-400" style={{ margin: 0 }}>Manage high-level project properties and hazardous actions</p>
                </div>

                {/* Body Content Area */}
                <div className="custom-scrollbar" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', maxHeight: '60vh' }}>

                    {/* Identification Fields Group */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest" style={{ margin: 0 }}>Identified Name</label>
                            <div className="bg-black border border-[#333] rounded-xl text-[15px] text-white flex items-center font-medium" style={{ width: '100%', padding: '0 16px', minHeight: '52px' }}>
                                {project?.name}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest" style={{ margin: 0 }}>Unique Project Identifier</label>
                            <div className="bg-black border border-[#333] rounded-xl text-sm text-neutral-400 flex items-center font-mono" style={{ width: '100%', padding: '0 16px', minHeight: '52px' }}>
                                {project?.id}
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone Section */}
                    <div style={{ paddingTop: '32px', borderTop: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: '8px', height: '8px' }} />
                            <h3 className="text-[12px] font-bold text-red-500 uppercase tracking-[0.15em]" style={{ margin: 0 }}>Danger Zone</h3>
                        </div>

                        <div
                            className="bg-red-500/[0.03] border border-red-500/10 rounded-[16px] group hover:border-red-500/20 transition-all"
                            style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
                                <p className="text-[15px] text-white font-semibold" style={{ margin: 0 }}>Terminate Project</p>
                                <p className="text-[13px] text-neutral-500 leading-relaxed" style={{ margin: 0 }}>
                                    Permanently dissolve this project and purge all associated governance data.
                                    <span className="text-red-400/60 ml-1">This action is irreversible.</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 text-[14px] font-bold rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all active:scale-[0.98] shrink-0"
                                style={{ padding: '0 24px', height: '48px' }}
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Footer Bar */}
                <div className="bg-[#0a0a0a] text-[11px] text-neutral-600 font-medium uppercase tracking-[0.1em]" style={{ padding: '20px 24px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="rounded-full bg-neutral-700" style={{ width: '6px', height: '6px' }} />
                        <span>Metadata lock active</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="rounded-full bg-neutral-700" style={{ width: '6px', height: '6px' }} />
                        <span>Vault encryption: AES-256</span>
                    </div>
                </div>
            </div>

            {/* Nested Modals */}
            {showDeleteModal && project && (
                <DeleteProjectModal
                    project={project}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteProject}
                    isDeleting={deleteProject.isPending}
                />
            )}
        </div>
    )
}