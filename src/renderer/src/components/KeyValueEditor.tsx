import { useState } from 'react'
import type { KeyValuePair } from '@/types'
import { v4 as uuid } from 'uuid'
import { VariableInput } from './VariableInput'

interface Props {
    pairs: KeyValuePair[]
    onChange: (p: KeyValuePair[]) => void
    keyPlaceholder?: string
    valuePlaceholder?: string
    variables?: Record<string, string>
    readOnly?: boolean
}

export function KeyValueEditor({ pairs, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value', variables = {}, readOnly = false }: Props) {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null)

    const set = (i: number, f: keyof KeyValuePair, v: string | boolean) => { const u = [...pairs]; u[i] = { ...u[i], [f]: v }; onChange(u) }
    const add = () => onChange([...pairs, { id: uuid(), key: '', value: '', enabled: true }])
    const del = (i: number) => onChange(pairs.filter((_, j) => j !== i))

    return (
        <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: '12px' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: '12px', padding: '10px 16px', background: '#151515', borderBottom: '1px solid #1F1F1F' }}>
                <div />
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A1A1A1' }}>{keyPlaceholder}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A1A1A1' }}>{valuePlaceholder}</span>
                <div />
            </div>

            {/* Data rows */}
            {pairs.map((p, i) => (
                <div key={p.id}
                    style={{
                        display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: '12px', alignItems: 'center',
                        padding: '8px 16px',
                        background: i % 2 === 0 ? '#111111' : '#151515',
                        borderBottom: '1px solid #1F1F1F',
                        opacity: p.enabled ? 1 : 0.35,
                        transition: '150ms ease'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#1A1A1A'
                        setHoveredRow(i)
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = i % 2 === 0 ? '#111111' : '#151515'
                        setHoveredRow(null)
                    }}>

                    {/* Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => !readOnly && set(i, 'enabled', !p.enabled)}
                            disabled={readOnly}
                            style={{
                                width: '16px', height: '16px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                border: '1.5px solid #FFFFFF', background: p.enabled ? '#FFFFFF' : 'transparent', transition: '150ms ease', cursor: readOnly ? 'default' : 'pointer'
                            }}>
                            {p.enabled && <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round"><polyline points="1,3 3,5 7,1" /></svg>}
                        </button>
                    </div>

                    {/* Key input */}
                    <input value={p.key} onChange={e => !readOnly && set(i, 'key', e.target.value)} placeholder={keyPlaceholder}
                        readOnly={readOnly}
                        style={{
                            width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '11px',
                            padding: '0 12px', height: '32px', borderRadius: '8px',
                            background: '#0A0A0A', border: '1px solid #2A2A2A', color: '#FFFFFF',
                            outline: 'none', transition: '150ms ease',
                            cursor: readOnly ? 'default' : 'text'
                        }}
                        onFocus={e => { !readOnly && (e.currentTarget.style.borderColor = '#FFFFFF') }}
                        onBlur={e => { !readOnly && (e.currentTarget.style.borderColor = '#2A2A2A') }} />

                    {/* Value input */}
                    <VariableInput
                        value={p.value}
                        onChange={v => !readOnly && set(i, 'value', v)}
                        variables={variables}
                        placeholder={valuePlaceholder}
                        readOnly={readOnly}
                        style={{
                            width: '100%', fontFamily: 'monospace', fontSize: '11px',
                            height: '32px', borderRadius: '8px',
                            background: '#0A0A0A', border: '1px solid #2A2A2A',
                            transition: '150ms ease',
                            cursor: readOnly ? 'default' : 'text'
                        }}
                    />

                    {/* Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {!readOnly && (
                            <button onClick={() => del(i)}
                                style={{
                                    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: '#6B7280', transition: '150ms ease',
                                    opacity: hoveredRow === i ? 1 : 0
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8" /><line x1="8" y1="2" x2="2" y2="8" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Add row button */}
            {!readOnly && (
                <button onClick={add}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', width: '100%', fontSize: '12px', fontWeight: 500, textAlign: 'left',
                        padding: '12px 16px', color: '#6B7280', transition: '150ms ease', background: 'transparent', border: 'none', cursor: 'pointer'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#FFFFFF' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="6" y1="2" x2="6" y2="10" /><line x1="2" y1="6" x2="10" y2="6" />
                    </svg>
                    Add {keyPlaceholder}
                </button>
            )}
        </div>
    )
}
