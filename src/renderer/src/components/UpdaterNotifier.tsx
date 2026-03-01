import { useState, useEffect } from 'react'

export function UpdaterNotifier() {
    const [status, setStatus] = useState<string | null>(null)
    const [version, setVersion] = useState<string | null>(null)
    const [progress, setProgress] = useState<number>(0)
    const [visible, setVisible] = useState(false)
    const [closeHovered, setCloseHovered] = useState(false)

    useEffect(() => {
        const removeStatus = (window as any).electronAPI.onUpdateStatus((newStatus: string, newVersion?: string) => {
            console.log('[UpdaterNotifier] status:', newStatus, newVersion)
            setStatus(newStatus)
            if (newVersion) setVersion(newVersion)

            if (['available', 'downloading', 'downloaded', 'error'].includes(newStatus)) {
                setVisible(true)
            } else if (newStatus === 'up-to-date') {
                // Keep hidden
            }
        })

        const removeProgress = (window as any).electronAPI.onUpdateProgress((percent: number) => {
            setProgress(percent)
            if (percent > 0) setStatus('downloading')
        })

        return () => {
            removeStatus()
            removeProgress()
        }
    }, [])

    useEffect(() => {
        if (status === 'downloaded') {
            const timer = setTimeout(() => {
                ; (window as any).electronAPI.restartApp()
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [status])

    if (!visible) return null

    return (
        <div
            className="animate-in slide-in-from-right-10 duration-500"
            style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}
        >
            <div style={{
                background: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: '16px', width: '320px',
                backdropFilter: 'blur(24px)', position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {status === 'downloaded' ? (
                            <svg style={{ width: '20px', height: '20px', color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : status === 'error' ? (
                            <svg style={{ width: '20px', height: '20px', color: '#f87171' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#FFFFFF', borderRadius: '50%' }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                            {status === 'available' && 'Update Available'}
                            {status === 'downloading' && 'Downloading Update'}
                            {status === 'downloaded' && 'Update Ready'}
                            {status === 'error' && 'Update Failed'}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500, margin: 0 }}>
                            {status === 'available' && `Version ${version} is ready`}
                            {status === 'downloading' && `Fetching software overhaul...`}
                            {status === 'downloaded' && `Installing v${version} now!`}
                            {status === 'error' && 'Check connection'}
                        </p>
                    </div>
                </div>

                {(status === 'downloading' || status === 'available') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div
                                style={{ height: '100%', background: '#FFFFFF', width: `${progress}%`, transition: 'width 300ms ease-out' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#737373' }}>
                            <span>{progress}%</span>
                            <span>Secure Layer</span>
                        </div>
                    </div>
                )}

                {status === 'downloaded' && (
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: 'rgba(16, 185, 129, 0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="animate-pulse" style={{ display: 'flex', height: '6px', width: '6px', borderRadius: '50%', background: '#10b981' }} />
                        Restarting to apply v{version}
                    </div>
                )}

                <button
                    onClick={() => setVisible(false)}
                    style={{ position: 'absolute', top: '12px', right: '12px', color: closeHovered ? '#FFFFFF' : '#52525B', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color 150ms ease' }}
                    onMouseEnter={() => setCloseHovered(true)}
                    onMouseLeave={() => setCloseHovered(false)}
                >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}