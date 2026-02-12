import Anthropic from '@anthropic-ai/sdk';

// Lazy-initialized Anthropic client (server-side only)
let _anthropic: Anthropic | null = null;

export function getAnthropic(): Anthropic {
    if (!_anthropic) {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key || key === 'your-anthropic-key') {
            throw new Error('Missing ANTHROPIC_API_KEY. Set it in .env.local');
        }
        _anthropic = new Anthropic({ apiKey: key });
    }
    return _anthropic;
}

// Proxy for convenient import
export const anthropic = new Proxy({} as Anthropic, {
    get(_target, prop) {
        return (getAnthropic() as any)[prop];
    },
});
