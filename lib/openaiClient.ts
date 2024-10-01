import axios from 'axios';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/engines/gpt-4o-mini/completions';

export async function getTechnicalAnalysis(chartData: any) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set');
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        prompt: `Analyze the following chart data: ${JSON.stringify(chartData)}`,
        max_tokens: 150,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].text;
  } catch (error) {
    console.error('Error fetching technical analysis:', error);
    throw error;
  }
}