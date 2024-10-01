import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { chartData } = await request.json();
    
    if (!chartData) {
      console.error('No chart data received');
      return NextResponse.json({ error: 'No chart data received' }, { status: 400 });
    }

    const prompt = `
      Analyze the following trading chart data and provide a technical analysis:
      Symbol: ${chartData.symbol}
      Timeframe: ${chartData.timeframe}
      Data: ${JSON.stringify(chartData.data)}

      Please provide insights on:
      1. Current market trend
      2. Key support and resistance levels
      3. Potential entry and exit points
      4. Overall market sentiment
      5. Any notable patterns or indicators
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a professional technical analyst for cryptocurrency trading." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
    });

    if (!response.choices[0].message.content) {
      return NextResponse.json({ error: 'No analysis generated' }, { status: 500 });
    }

    return NextResponse.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    console.error('Error processing analysis request:', error);
    return NextResponse.json({ error: 'Error processing your request: ' + (error as Error).message }, { status: 500 });
  }
}