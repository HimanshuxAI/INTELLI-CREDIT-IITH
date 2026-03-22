import { NextRequest } from 'next/server';

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return Response.json({ status: 'error', message: 'No API key configured in .env.local' });
    }

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/models', {
      headers: { 'Authorization': `Bearer ${GEMINI_API_KEY}` },
    });

    if (res.status === 401) {
      return Response.json({ status: 'error', message: 'Invalid API key', code: 401 });
    }
    if (res.status === 402) {
      return Response.json({ status: 'error', message: 'API key has no credits', code: 402 });
    }
    if (!res.ok) {
      return Response.json({ status: 'error', message: `Gemini API returned ${res.status}`, code: res.status });
    }

    const data = await res.json();
    const hasGemini = data.data?.some((m: any) => m.id?.includes('gemini'));

    return Response.json({
      status: 'connected',
      message: 'Gemini API is live and authenticated',
      modelsAvailable: data.data?.length || 0,
      geminiAvailable: hasGemini,
      keyPrefix: GEMINI_API_KEY.substring(0, 12) + '...',
    });
  } catch (err: any) {
    return Response.json({ status: 'error', message: err.message || 'Network error' });
  }
}
