import { useRef, useEffect } from 'react'

interface ConfirmModalProps {
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
    isDanger?: boolean
}

export function ConfirmModal({
    title,
    description,
    confirmLabel = 'Confirm Action',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    isDanger = true
}: ConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
            if (e.key === 'Enter') onConfirm()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onCancel, onConfirm])

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in transition-all" onClick={onCancel} style={{ padding: '24px' }}>
            <div
                ref={modalRef}
                className="w-full bg-[#0a0a0a] rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in scale-in"
                style={{ maxWidth: '440px', border: '1px solid #222' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header & Body Section */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div 
                            className={`rounded-lg flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white'}`}
                            style={{ width: '32px', height: '32px' }}
                        >
                            {isDanger ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight" style={{ margin: 0 }}>{title}</h2>
                    </div>
                    <p className="text-sm text-neutral-400 font-medium leading-relaxed" style={{ margin: 0 }}>
                        {description}
                    </p>
                </div>

                {/* Footer Section */}
                <div className="bg-[#0a0a0a]" style={{ padding: '20px 24px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                    <button
                        onClick={onCancel}
                        className="text-[14px] font-bold text-neutral-500 hover:text-white transition-all"
                        style={{ padding: '0 16px', height: '48px' }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`text-[14px] font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] ${
                            isDanger
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-white text-black hover:bg-neutral-200'
                        }`}
                        style={{ padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}