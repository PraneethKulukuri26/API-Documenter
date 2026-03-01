import { useState, useEffect } from 'react'

export function UpdaterNotifier() {
    const [status, setStatus] = useState<string | null>(null)
    const [version, setVersion] = useState<string | null>(null)
    const [progress, setProgress] = useState<number>(0)
    const [visible, setVisible] = useState(false)

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

    if (!visible) return null

    return (
        <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-right-10 duration-500">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 w-[320px] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                        {status === 'downloaded' ? (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : status === 'error' ? (
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-[14px] font-bold text-white mb-0.5">
                            {status === 'available' && 'Update Available'}
                            {status === 'downloading' && 'Downloading Update'}
                            {status === 'downloaded' && 'Update Ready'}
                            {status === 'error' && 'Update Failed'}
                        </h4>
                        <p className="text-[12px] text-neutral-400 font-medium">
                            {status === 'available' && `Version ${version} is ready`}
                            {status === 'downloading' && `Fetching software overhaul...`}
                            {status === 'downloaded' && `Installing v${version} now!`}
                            {status === 'error' && 'Check connection'}
                        </p>
                    </div>
                </div>

                {(status === 'downloading' || status === 'available') && (
                    <div className="space-y-2">
                        <div className="h-1.5 w-100 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-neutral-500">
                            <span>{progress}%</span>
                            <span>Secure Layer</span>
                        </div>
                    </div>
                )}

                {status === 'downloaded' && (
                    <div className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-500/80 flex items-center gap-2">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Restarting to apply v{version}
                    </div>
                )}

                <button
                    onClick={() => setVisible(false)}
                    className="absolute top-3 right-3 text-neutral-600 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
