import { useCallback } from 'react'

interface Props {
    value: string
    onChange: (v: string) => void
    placeholder?: string
}

export function JsonEditor({ value, onChange, placeholder }: Props) {
    const format = useCallback(() => {
        if (!value.trim()) return
        try { onChange(JSON.stringify(JSON.parse(value), null, 2)) } catch { }
    }, [value, onChange])

    let valid = true
    if (value.trim()) { try { JSON.parse(value) } catch { valid = false } }

    return (
        <div style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid #1F1F1F' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0, background: '#151515', borderBottom: '1px solid #1F1F1F' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: valid ? '#FFFFFF' : '#6B7280' }} />
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 500, color: '#6B7280' }}>
                        {valid ? 'Valid JSON' : 'Invalid'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => { navigator.clipboard.writeText(value) }}
                        style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', color: '#9CA3AF', border: '1px solid #2A2A2A', background: 'transparent', transition: '150ms ease', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000'; e.currentTarget.style.borderColor = '#FFFFFF' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#2A2A2A' }}
                    >
                        Copy
                    </button>
                    <button
                        onClick={format}
                        style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', color: '#9CA3AF', border: '1px solid #2A2A2A', background: 'transparent', transition: '150ms ease', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000'; e.currentTarget.style.borderColor = '#FFFFFF' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#2A2A2A' }}
                    >
                        Format
                    </button>
                </div>
            </div>

            {/* Editor */}
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || '{\n  "key": "value"\n}'}
                style={{ flex: 1, width: '100%', padding: '12px 16px', fontSize: '11px', fontFamily: 'monospace', resize: 'none', background: '#0F0F0F', color: '#A1A1A1', border: 'none', minHeight: '200px', tabSize: 2, lineHeight: 1.8, outline: 'none' }}
                spellCheck={false}
            />
        </div>
    )
}