import { useState, useEffect, useCallback, useRef } from 'react'
import { useApi, useUpdateApi } from '@/hooks/useApis'
import { useFolder } from '@/hooks/useFolders'
import { useAppStore } from '@/stores/appStore'
import { KeyValueEditor } from './KeyValueEditor'
import { JsonEditor } from './JsonEditor'
import { ResponseViewer } from './ResponseViewer'
import { ResponsePanel } from './ResponsePanel'
import type { HttpResponse } from './ResponsePanel'
import type { HttpMethod, BodyType, EditorTab, KeyValuePair, ResponseExample } from '@/types'
import { v4 as uuid } from 'uuid'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const BODY_TYPES: { v: BodyType; l: string }[] = [
    { v: 'none', l: 'None' }, { v: 'json', l: 'JSON' }, { v: 'form', l: 'Form' }, { v: 'raw', l: 'Raw' }
]

const MIN_TOP = 300
const MIN_BOTTOM = 150

interface Props { apiId: string }

export function RequestEditor({ apiId }: Props) {
    const { data: api } = useApi(apiId)
    const { data: folder } = useFolder(api?.folderId || null)
    const updateApi = useUpdateApi()
    const { activeEditorTab, setActiveEditorTab } = useAppStore()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [method, setMethod] = useState<HttpMethod>('GET')
    const [path, setPath] = useState('')
    const [urlParams, setUrlParams] = useState<KeyValuePair[]>([])
    const [headers, setHeaders] = useState<KeyValuePair[]>([])
    const [bodyType, setBodyType] = useState<BodyType>('none')
    const [requestBody, setRequestBody] = useState('')
    const [responses, setResponses] = useState<ResponseExample[]>([])
    const [saved, setSaved] = useState(true)
    const [methodDd, setMethodDd] = useState(false)

    // ── Live response state ──
    const [liveResponse, setLiveResponse] = useState<HttpResponse | null>(null)
    const [sending, setSending] = useState(false)

    // ── Resizable panel state ──
    const containerRef = useRef<HTMLDivElement>(null)
    const [splitPct, setSplitPct] = useState(() => {
        const saved = localStorage.getItem('response-panel-pct')
        return saved ? parseFloat(saved) : 65
    })
    const [dragging, setDragging] = useState(false)
    const [dividerHover, setDividerHover] = useState(false)
    const [responseCollapsed, setResponseCollapsed] = useState(false)

    useEffect(() => {
        if (!api) return
        setName(api.name); setDescription(api.description); setMethod(api.method)
        setPath(api.path); setUrlParams(api.urlParams || []); setHeaders(api.headers || [])
        setBodyType(api.bodyType); setRequestBody(api.requestBody)
        setResponses(api.responseExamples || []); setSaved(true)
        setLiveResponse(null)
    }, [api])

    useEffect(() => {
        if (!api) return
        const dirty = name !== api.name || description !== api.description || method !== api.method || path !== api.path ||
            JSON.stringify(urlParams) !== JSON.stringify(api.urlParams) || JSON.stringify(headers) !== JSON.stringify(api.headers) ||
            bodyType !== api.bodyType || requestBody !== api.requestBody || JSON.stringify(responses) !== JSON.stringify(api.responseExamples)
        setSaved(!dirty)
    }, [api, name, description, method, path, urlParams, headers, bodyType, requestBody, responses])

    const save = useCallback(async () => {
        if (!api) return
        await updateApi.mutateAsync({ id: api.id, name, description, method, path, urlParams, headers, bodyType, requestBody, responseExamples: responses, version: (api.version || 0) + 1 })
        setSaved(true)
    }, [api, name, description, method, path, urlParams, headers, bodyType, requestBody, responses, updateApi])

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
            if ((e.ctrlKey || e.metaKey) && e.key === 'j') { e.preventDefault(); setResponseCollapsed(c => !c) }
        }
        window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
    }, [save])

    // ── Drag to resize ──
    const onDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault(); setDragging(true)
    }, [])

    useEffect(() => {
        if (!dragging) return
        const onMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const y = e.clientY - rect.top
            const h = rect.height
            const pct = Math.max(MIN_TOP / h * 100, Math.min((h - MIN_BOTTOM) / h * 100, (y / h) * 100))
            setSplitPct(pct)
        }
        const onUp = () => {
            setDragging(false)
            localStorage.setItem('response-panel-pct', String(splitPct))
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    }, [dragging, splitPct])

    // ── Send HTTP request ──
    const sendRequest = useCallback(async () => {
        if (sending) return
        setSending(true); setLiveResponse(null); setResponseCollapsed(false)

        let fullUrl = path
        if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'https://' + fullUrl.replace(/^\/+/, '')
        const enabledParams = urlParams.filter(p => p.enabled && p.key)
        if (enabledParams.length > 0) {
            const qs = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs
        }

        const hdrs: Record<string, string> = {}
        headers.filter(h => h.enabled && h.key).forEach(h => { hdrs[h.key] = h.value })

        let body: string | undefined
        if (bodyType === 'json' && requestBody) {
            body = requestBody
            if (!hdrs['Content-Type'] && !hdrs['content-type']) hdrs['Content-Type'] = 'application/json'
        } else if (bodyType === 'raw' && requestBody) {
            body = requestBody
        } else if (bodyType === 'form') {
            const formParams = urlParams.filter(p => p.enabled && p.key)
            body = formParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
            if (!hdrs['Content-Type'] && !hdrs['content-type']) hdrs['Content-Type'] = 'application/x-www-form-urlencoded'
        }

        try {
            const res = await (window as any).electronAPI.sendHttpRequest({ url: fullUrl, method, headers: hdrs, body })
            setLiveResponse(res)
        } catch (err: any) {
            setLiveResponse({ success: false, error: err.message || String(err), time: 0 })
        } finally {
            setSending(false)
        }
    }, [path, method, urlParams, headers, bodyType, requestBody, sending])

    const saveAsExample = (status: number, body: string, resHeaders: Record<string, string>) => {
        const headerPairs: KeyValuePair[] = Object.entries(resHeaders).map(([k, v]) => ({ id: uuid(), key: k, value: v, enabled: true }))
        const now = Date.now()
        const example: ResponseExample = {
            id: uuid(), statusCode: status,
            title: `${status} Response`,
            description: `${status} response`,
            body,
            headers: headerPairs,
            metadata: {
                contentType: resHeaders['content-type'] || 'application/json',
                isDefault: responses.length === 0,
                deprecated: false,
                responseTime: liveResponse?.time,
                responseSize: liveResponse?.size
            },
            createdAt: now, updatedAt: now
        }
        setResponses([...responses, example])
    }

    if (!api) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0A0A0A' }}>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Loading…</span>
        </div>
    )

    const tabs: { key: EditorTab; label: string; count?: number }[] = [
        { key: 'params', label: 'Params', count: urlParams.filter(p => p.enabled && p.key).length },
        { key: 'headers', label: 'Headers', count: headers.filter(h => h.enabled && h.key).length },
        { key: 'body', label: 'Body' },
        { key: 'responses', label: 'Responses', count: responses.length }
    ]

    const showResponse = liveResponse || sending

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0A0A0A', userSelect: dragging ? 'none' : 'auto' }}>

            {/* ═══════════════════════════════════════════════
          TOP: REQUEST BUILDER
          ═══════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: showResponse && !responseCollapsed ? `${splitPct}%` : '100%', minHeight: MIN_TOP }}>

                {/* ── Endpoint Bar ── */}
                <div style={{ flexShrink: 0, padding: '20px 24px 0 24px' }}>
                    <div style={{ marginBottom: 12 }}>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Endpoint name"
                            className="w-full"
                            style={{ background: 'transparent', border: 'none', fontSize: '18px', fontWeight: 600, color: '#FFFFFF', outline: 'none', letterSpacing: '-0.02em', marginBottom: '4px' }} />
                        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a description…"
                            className="w-full"
                            style={{ background: 'transparent', border: 'none', fontSize: '13px', color: '#6B7280', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111111', border: '1px solid #1F1F1F', borderRadius: '12px', padding: '12px' }}>

                        {/* Method dropdown */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <button onClick={() => setMethodDd(!methodDd)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', background: '#181818', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF', transition: '150ms ease', minWidth: '80px' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A3A3A' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A' }}>
                                {method}
                                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round"><polyline points="1,1 4,4 7,1" /></svg>
                            </button>
                            {methodDd && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMethodDd(false)} />
                                    <div className="fade-in"
                                        style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: '8px', background: '#111111', border: '1px solid #2A2A2A', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', padding: '4px', minWidth: '140px', animation: 'fadeUp 150ms ease' }}>
                                        {METHODS.map(m => (
                                            <button key={m} onClick={() => { setMethod(m); setMethodDd(false) }}
                                                style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', padding: '8px 12px', borderRadius: '8px', color: method === m ? '#FFFFFF' : '#9CA3AF', background: method === m ? '#1F1F1F' : 'transparent', transition: '150ms ease', border: 'none', cursor: 'pointer' }}
                                                onMouseEnter={e => { if (method !== m) e.currentTarget.style.background = '#1F1F1F' }}
                                                onMouseLeave={e => { if (method !== m) e.currentTarget.style.background = 'transparent' }}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* URL Input */}
                        <input value={path} onChange={e => setPath(e.target.value)} placeholder="https://api.example.com/endpoint"
                            onKeyDown={e => e.key === 'Enter' && sendRequest()}
                            style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: '10px', height: '40px', padding: '0 12px', color: '#FFFFFF', outline: 'none', transition: '150ms ease' }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#FFFFFF'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.1)' }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.boxShadow = 'none' }} />

                        {/* Send */}
                        <button onClick={sendRequest} disabled={sending}
                            style={{ flexShrink: 0, fontWeight: 600, fontSize: '13px', border: '1px solid #FFFFFF', borderRadius: '10px', padding: '0 20px', height: '40px', color: '#FFFFFF', background: 'transparent', transition: '150ms ease', opacity: sending ? 0.5 : 1, cursor: 'pointer' }}
                            onMouseEnter={e => { if (!sending) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000' } }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFFFFF' }}
                            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                            {sending ? 'Sending…' : 'Send'}
                        </button>

                        {/* Save */}
                        {folder?.role !== 'viewer' && (
                            <button onClick={save} disabled={saved || updateApi.isPending}
                                style={{ flexShrink: 0, fontSize: '12px', fontWeight: 500, padding: '0 12px', height: '40px', borderRadius: '10px', color: (saved && !updateApi.isPending) ? '#6B7280' : '#FFFFFF', border: (saved && !updateApi.isPending) ? '1px solid transparent' : '1px solid #2A2A2A', background: 'transparent', transition: '150ms ease', cursor: (saved && !updateApi.isPending) ? 'default' : 'pointer' }}
                                onMouseEnter={e => { if (!saved || updateApi.isPending) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000' } }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = (saved && !updateApi.isPending) ? '#6B7280' : '#FFFFFF' }}>
                                {updateApi.isPending ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div style={{ flexShrink: 0, padding: '16px 24px 0 24px', borderBottom: '1px solid #1F1F1F' }}>
                    <div style={{ display: 'flex', gap: 0 }}>
                        {tabs.map(t => {
                            const isActive = activeEditorTab === t.key
                            return (
                                <button key={t.key} onClick={() => setActiveEditorTab(t.key)}
                                    style={{ position: 'relative', padding: '8px 16px 12px', fontSize: '14px', fontWeight: 500, color: isActive ? '#FFFFFF' : '#A1A1A1', background: 'transparent', border: 'none', transition: '200ms ease', cursor: 'pointer' }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#FFFFFF' }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#A1A1A1' }}>
                                    {t.label}
                                    {!!t.count && t.count > 0 && (
                                        <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, padding: '0 6px', borderRadius: '9999px', background: '#1F1F1F', color: '#9CA3AF' }}>{t.count}</span>
                                    )}
                                    <span style={{ position: 'absolute', bottom: 0, left: '16px', right: '16px', height: '2px', background: '#FFFFFF', borderRadius: '1px', opacity: isActive ? 1 : 0, transform: isActive ? 'scaleX(1)' : 'scaleX(0)', transition: 'opacity 200ms ease, transform 200ms ease' }} />
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {activeEditorTab === 'params' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SectionHeader title="URL Parameters" sub="Query string parameters appended to the request URL" />
                            <KeyValueEditor pairs={urlParams} onChange={setUrlParams} keyPlaceholder="Parameter" valuePlaceholder="Value" />
                        </div>
                    )}
                    {activeEditorTab === 'headers' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SectionHeader title="Request Headers" sub="HTTP headers sent with the request" />
                            <KeyValueEditor pairs={headers} onChange={setHeaders} keyPlaceholder="Header" valuePlaceholder="Value" />
                        </div>
                    )}
                    {activeEditorTab === 'body' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SectionHeader title="Request Body" sub="Data sent in the request payload" />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {BODY_TYPES.map(bt => {
                                    const isAct = bodyType === bt.v
                                    return (
                                        <button key={bt.v} onClick={() => setBodyType(bt.v)}
                                            style={{ fontSize: '12px', fontWeight: 500, padding: '6px 14px', borderRadius: '8px', background: isAct ? '#FFFFFF' : 'transparent', color: isAct ? '#000000' : '#6B7280', border: `1px solid ${isAct ? '#FFFFFF' : '#2A2A2A'}`, transition: '150ms ease', cursor: 'pointer' }}
                                            onMouseEnter={e => { if (!isAct) { e.currentTarget.style.background = '#151515'; e.currentTarget.style.color = '#FFFFFF' } }}
                                            onMouseLeave={e => { if (!isAct) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' } }}>
                                            {bt.l}
                                        </button>
                                    )
                                })}
                            </div>
                            {bodyType === 'json' && <JsonEditor value={requestBody} onChange={setRequestBody} />}
                            {bodyType === 'raw' && (
                                <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: '12px', overflow: 'hidden' }}>
                                    <textarea value={requestBody} onChange={e => setRequestBody(e.target.value)} placeholder="Raw request body…"
                                        className="w-full"
                                        style={{ padding: '16px', fontSize: '12px', fontFamily: 'monospace', resize: 'none', background: 'transparent', color: '#FFFFFF', border: 'none', minHeight: '200px', tabSize: 2, lineHeight: 1.8, outline: 'none' }}
                                        spellCheck={false} />
                                </div>
                            )}
                            {bodyType === 'form' && <KeyValueEditor pairs={urlParams} onChange={setUrlParams} keyPlaceholder="Field" valuePlaceholder="Value" />}
                            {bodyType === 'none' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', background: '#111111', border: '1px solid #1F1F1F', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>No body for this request</p>
                                </div>
                            )}
                        </div>
                    )}
                    {activeEditorTab === 'responses' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SectionHeader title="Response Examples" sub="Document expected response payloads by status code" />
                            <ResponseViewer examples={responses} onChange={setResponses} />
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
          DRAGGABLE DIVIDER
          ═══════════════════════════════════════════════ */}
            {showResponse && !responseCollapsed && (
                <div style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '6px', cursor: 'row-resize',
                    background: dragging || dividerHover ? '#1F1F1F' : 'transparent',
                    transition: dragging ? 'none' : 'background 100ms ease',
                    borderTop: '1px solid #1F1F1F'
                }}
                    onMouseDown={onDragStart}
                    onMouseEnter={() => setDividerHover(true)}
                    onMouseLeave={() => setDividerHover(false)}>
                    {/* Center drag indicator */}
                    <div style={{ display: 'flex', gap: '3px', opacity: dragging || dividerHover ? 0.8 : 0.3, transition: 'opacity 100ms ease' }}>
                        <span style={{ display: 'block', width: '4px', height: '2px', borderRadius: '9999px', background: '#6B7280' }} />
                        <span style={{ display: 'block', width: '4px', height: '2px', borderRadius: '9999px', background: '#6B7280' }} />
                        <span style={{ display: 'block', width: '4px', height: '2px', borderRadius: '9999px', background: '#6B7280' }} />
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
          BOTTOM: RESPONSE PANEL
          ═══════════════════════════════════════════════ */}
            {showResponse && !responseCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: `${100 - splitPct}%`, minHeight: MIN_BOTTOM, background: '#0F0F0F' }}>
                    {/* Sticky header */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '40px', borderBottom: '1px solid #1F1F1F' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280' }}>Response</span>
                        <button onClick={() => setResponseCollapsed(true)}
                            style={{ fontSize: '10px', fontWeight: 500, padding: '4px 8px', borderRadius: '4px', color: '#6B7280', transition: '150ms ease', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = '#1A1A1A' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent' }}>
                            Collapse ⌘J
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        <ResponsePanel response={liveResponse} loading={sending} onSaveAsExample={folder?.role === 'viewer' ? undefined : saveAsExample} />
                    </div>
                </div>
            )}

            {/* Collapsed response toggle */}
            {showResponse && responseCollapsed && (
                <button onClick={() => setResponseCollapsed(false)}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', width: '100%', fontSize: '11px', fontWeight: 500, padding: '8px 24px', borderTop: '1px solid #1F1F1F', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', color: '#6B7280', background: '#0F0F0F', transition: '150ms ease', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}>
                    <svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><polyline points="1,4 4,1 7,4" /></svg>
                    Show Response {liveResponse?.status ? `· ${liveResponse.status} ${liveResponse.statusText} · ${liveResponse.time}ms` : ''}
                </button>
            )}

            {/* ── Status bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, fontSize: '10px', fontWeight: 500, padding: '6px 24px', borderTop: '1px solid #1F1F1F', color: '#6B7280', background: '#0A0A0A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontFamily: 'monospace' }}>v{api.version}</span>
                    <span style={{ color: '#2A2A2A' }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFFFFF', opacity: api.syncStatus === 'synced' ? 1 : 0.3 }} />
                        {api.syncStatus}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!saved && <span style={{ color: '#FFFFFF' }}>● Unsaved</span>}
                    <kbd style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace', border: '1px solid #2A2A2A', color: '#6B7280' }}>Ctrl+S</kbd>
                </div>
            </div>
        </div>
    )
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
    return (
        <div style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em', marginBottom: '4px', marginTop: 0 }}>{title}</h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{sub}</p>
        </div>
    )
}