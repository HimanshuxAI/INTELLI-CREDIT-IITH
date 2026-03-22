import { NextRequest } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const SYSTEM_PROMPT = `You are an expert Indian credit analyst assistant for IntelliCredit. You have just completed a credit appraisal analysis on uploaded financial documents. The user (a credit officer) is now asking you questions about the analysis.

You have access to:
1. The extracted text from all uploaded documents
2. The complete analysis results (5 C's scores, risk signals, verdict, etc.)

Answer questions clearly and concisely, referring to specific data from the documents. Be helpful but factual — cite numbers and pages where possible. Format your responses in clean text — you may use bullet points and bold text for emphasis.

Key points:
- Be specific: cite exact figures, ratios, and findings
- Be analytical: explain WHY scores were set the way they were
- Be actionable: suggest what the officer should investigate further
- Keep responses focused and under 300 words unless asked for detail`;

export async function POST(request: NextRequest) {
  let GEMINI_API_KEY = (request.headers.get('X-API-Key') || process.env.GEMINI_API_KEY || '').trim();
  if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSy')) {
    GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
  }
  try {
    const body = await request.json();
    const { messages, extractedText, analysisResult } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build context for Claude
    const analysisContext = analysisResult ? `
ANALYSIS RESULTS:
- Composite Score: ${analysisResult.compositeScore}/100
- Verdict: ${analysisResult.verdict?.decision} — ${analysisResult.verdict?.limit} at ${analysisResult.verdict?.rate}
- Company: ${analysisResult.companyProfile?.companyName}
- 5 C's: ${analysisResult.cScores?.map((c: any) => `${c.label}: ${c.score}/100`).join(', ')}
- Risk Signals: ${analysisResult.riskSignals?.map((r: any) => r.title).join('; ')}
- Rationale: ${analysisResult.verdict?.rationale}
` : '';

    const docContext = extractedText
      ? `\nEXTRACTED DOCUMENT TEXT (first 30000 chars):\n${extractedText.substring(0, 30000)}`
      : '';

    const systemWithContext = SYSTEM_PROMPT + '\n\n' + analysisContext + docContext;

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GEMINI_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://intellicredit.app',
              'X-Title': 'IntelliCredit Chat',
            },
            body: JSON.stringify({
              model: 'gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemWithContext },
                ...messages,
              ],
              max_tokens: 2048,
              temperature: 0.4,
              stream: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Chat failed (${response.status})`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response stream');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', token: delta })}\n\n`));
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (err: any) {
          console.warn("Chat API/Network failed! Falling back to Demo Mode.", err.message);
          const fallback = "*(⚠️ Offline Demo Mode)*\\n\\nBased on the offline data, Rajasthan Textiles has a DSCR of 1.42× but the factory is currently only running at 40% capacity. While this drop in utilisation was flagged automatically as a risk signal, the strong independent collateral (₹70 Cr total including machinery and FD) provides sufficient coverage to approve the conservative ₹45 Cr limit. Do you want to examine the peer benchmarking details?";
          
          for (let i = 0; i < fallback.length; i += 3) {
            const chunk = fallback.substring(i, i+3);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`));
            await new Promise(r => setTimeout(r, 20)); // smooth visual streaming 
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
