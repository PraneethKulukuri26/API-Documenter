import React, { useState, useRef, useMemo, useEffect } from 'react'

interface VariableInputProps {
    value: string
    onChange: (val: string) => void
    onKeyDown?: (e: React.KeyboardEvent) => void
    onFocus?: (e: React.FocusEvent) => void
    onBlur?: (e: React.FocusEvent) => void
    variables: Record<string, string>
    placeholder?: string
    style?: React.CSSProperties
    className?: string
    readOnly?: boolean
}

export function VariableInput({ value, onChange, onKeyDown, onFocus, onBlur, variables, placeholder, style, className, readOnly }: VariableInputProps) {
    const [hoveredVar, setHoveredVar] = useState<{ key: string, value: string, x: number, y: number } | null>(null)
    const [isFocused, setIsFocused] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    // Suggestion logic
    const [showMenu, setShowMenu] = useState(false)
    const [menuIndex, setMenuIndex] = useState(0)
    const [menuTriggerPos, setMenuTriggerPos] = useState({ start: 0, end: 0 })
    const [menuItems, setMenuItems] = useState<string[]>([])

    // Sync horizontal scroll
    const handleScroll = () => {
        if (inputRef.current && overlayRef.current) {
            overlayRef.current.scrollLeft = inputRef.current.scrollLeft
        }
    }

    // Tokenize text into segments (plain text and variables)
    const segments = useMemo(() => {
        const parts: { type: 'text' | 'var', content: string }[] = []
        let lastIndex = 0
        const regex = /\{\{(.+?)\}\}/g
        let match

        while ((match = regex.exec(value)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: value.substring(lastIndex, match.index) })
            }
            parts.push({ type: 'var', content: match[0] })
            lastIndex = regex.lastIndex
        }

        if (lastIndex < value.length) {
            parts.push({ type: 'text', content: value.substring(lastIndex) })
        }

        return parts
    }, [value])

    const filterSuggestions = (text: string, pos: number) => {
        const textBeforeCaret = text.substring(0, pos)
        // Match {{ followed by characters that don't include }} 
        const match = textBeforeCaret.match(/\{\{([^}]*)$/)

        if (match) {
            const query = match[1].trim().toLowerCase()
            const filtered = Object.keys(variables).filter(k => k.toLowerCase().includes(query))
            if (filtered.length > 0) {
                setMenuItems(filtered)
                setMenuIndex(0)
                setMenuTriggerPos({ start: match.index!, end: pos })
                setShowMenu(true)
                return
            }
        }
        setShowMenu(false)
    }

    const applySuggestion = (varName: string) => {
        const before = value.substring(0, menuTriggerPos.start)
        const after = value.substring(menuTriggerPos.end)
        // Check if there is already a closing }} immediately after to avoid duplicates
        const hasClosing = after.startsWith('}}')
        const newValue = `${before}{{${varName}}}${hasClosing ? after.substring(2) : after}`

        onChange(newValue)
        setShowMenu(false)

        // Refocus and set cursor
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus()
                const newPos = before.length + varName.length + 4 // {{ + var + }}
                inputRef.current.setSelectionRange(newPos, newPos)
            }
        }, 0)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (showMenu) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMenuIndex(i => (i + 1) % menuItems.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMenuIndex(i => (i - 1 + menuItems.length) % menuItems.length)
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                applySuggestion(menuItems[menuIndex])
            } else if (e.key === 'Escape') {
                e.preventDefault()
                setShowMenu(false)
            }
        } else {
            onKeyDown?.(e)
        }
    }

    // Handle clicks outside menu implicitly by onBlur delay, 
    // but better to use a dedicated cleanup if needed.

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                borderColor: isFocused ? '#FFFFFF' : (style?.borderColor || '#2A2A2A'),
                boxShadow: isFocused ? '0 0 0 1px rgba(255,255,255,0.1)' : 'none',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
                ...style
            }}
        >
            {/* The Real Input (Middle layer) */}
            <input
                ref={inputRef}
                value={value}
                onChange={e => {
                    if (readOnly) return
                    const val = e.target.value
                    onChange(val)
                    filterSuggestions(val, e.target.selectionStart || 0)
                }}
                onScroll={handleScroll}
                onKeyDown={handleInputKeyDown}
                onClick={e => !readOnly && filterSuggestions(value, (e.target as HTMLInputElement).selectionStart || 0)}
                onFocus={e => {
                    if (readOnly) return
                    setIsFocused(true);
                    onFocus?.(e);
                    filterSuggestions(value, e.target.selectionStart || 0);
                }}
                readOnly={readOnly}
                onBlur={e => {
                    setIsFocused(false)
                    onBlur?.(e)
                    // Increase delay to ensure menu clicks work
                    setTimeout(() => setShowMenu(false), 300)
                }}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'transparent',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: '0 12px',
                    position: 'relative',
                    zIndex: 1,
                    caretColor: 'white'
                }}
            />

            {/* The Highlighter Overlay (Top layer) */}
            <div
                ref={overlayRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'pre',
                    pointerEvents: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    overflow: 'hidden',
                    zIndex: 2,
                    color: '#FFFFFF'
                }}
            >
                {segments.map((s, i) => {
                    if (s.type === 'text') return <span key={i}>{s.content}</span>

                    const varKey = s.content.replace(/[\{\}]/g, '').trim()
                    const resolvedValue = variables[varKey]
                    const isValid = resolvedValue !== undefined

                    return (
                        <span
                            key={i}
                            style={{
                                color: isValid ? '#10B981' : '#EF4444',
                                background: isValid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                borderRadius: '4px',
                                padding: '0 2px',
                                margin: '0 -2px',
                                pointerEvents: 'auto',
                                cursor: 'help'
                            }}
                            onMouseEnter={(e) => {
                                // Only show tooltip if it's a complete variable AND we aren't showing the menu
                                if (!showMenu) {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setHoveredVar({
                                        key: varKey,
                                        value: resolvedValue || 'Unresolved',
                                        x: rect.left,
                                        y: rect.top
                                    })
                                }
                            }}
                            onMouseLeave={() => setHoveredVar(null)}
                        >
                            {s.content}
                        </span>
                    )
                })}
            </div>

            {/* Tooltip */}
            {hoveredVar && !showMenu && (
                <div style={{
                    position: 'fixed',
                    left: hoveredVar.x,
                    top: hoveredVar.y - 45,
                    background: '#1F1F1F',
                    border: '1px solid #333',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#FFF',
                    zIndex: 10000,
                    pointerEvents: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'fadeUp 150ms ease'
                }}>
                    <span style={{ color: '#9CA3AF', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Resolved Value</span>
                    <span style={{ fontFamily: 'monospace', color: '#10B981' }}>{hoveredVar.value}</span>
                </div>
            )}

            {/* Suggestions Menu */}
            {showMenu && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '12px',
                    zIndex: 10001,
                    background: 'rgba(17, 17, 17, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                    padding: '6px',
                    minWidth: '240px',
                    marginTop: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    animation: 'fadeUp 200ms ease'
                }}>
                    <div style={{ padding: '4px 10px 8px', fontSize: '10px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Variables
                    </div>
                    {menuItems.map((item, i) => (
                        <button
                            key={item}
                            onMouseDown={e => e.preventDefault()} // Prevent blur before click
                            onClick={() => applySuggestion(item)}
                            onMouseEnter={() => setMenuIndex(i)}
                            style={{
                                display: 'flex',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: menuIndex === i ? '#FFFFFF' : 'transparent',
                                color: menuIndex === i ? '#000000' : '#D1D5DB',
                                textAlign: 'left',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                transition: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                        >
                            <span style={{ fontWeight: menuIndex === i ? 600 : 400 }}>{item}</span>
                            <span style={{
                                fontSize: '11px',
                                color: menuIndex === i ? 'rgba(0,0,0,0.5)' : '#6B7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '120px',
                                whiteSpace: 'nowrap'
                            }}>
                                {variables[item]}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
