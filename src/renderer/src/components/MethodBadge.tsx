import type { HttpMethod } from '@/types'

interface Props { method: HttpMethod; size?: 'sm' | 'md' }

export function MethodBadge({ method, size = 'sm' }: Props) {
    const px = size === 'sm' ? '5px' : '8px'
    const py = size === 'sm' ? '1px' : '3px'
    const fs = size === 'sm' ? '9px' : '10px'

    return (
        <span className="font-mono font-bold uppercase whitespace-nowrap"
            style={{
                fontSize: fs, lineHeight: 1, letterSpacing: '0.05em',
                padding: `${py} ${px}`,
                border: '1px solid #2A2A2A',
                borderRadius: '4px',
                color: '#FFFFFF',
                background: 'transparent'
            }}>
            {method}
        </span>
    )
}
