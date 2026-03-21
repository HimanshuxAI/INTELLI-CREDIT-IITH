import { NextRequest } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return Response.json({ status: 'error', message: 'No API key configured in .env.local' });
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
    });

    if (res.status === 401) {
      return Response.json({ status: 'error', message: 'Invalid API key', code: 401 });
    }
    if (res.status === 402) {
      return Response.json({ status: 'error', message: 'API key has no credits — top up at openrouter.ai/credits', code: 402 });
    }
    if (!res.ok) {
      return Response.json({ status: 'error', message: `OpenRouter returned ${res.status}`, code: res.status });
    }

    const data = await res.json();
    const hasClaude = data.data?.some((m: any) => m.id?.includes('claude'));

    return Response.json({
      status: 'connected',
      message: 'OpenRouter API is live and authenticated',
      modelsAvailable: data.data?.length || 0,
      claudeAvailable: hasClaude,
      keyPrefix: OPENROUTER_API_KEY.substring(0, 12) + '...',
    });
  } catch (err: any) {
    return Response.json({ status: 'error', message: err.message || 'Network error' });
  }
}
