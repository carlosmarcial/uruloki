import { LineData } from 'lightweight-charts';

export interface ChartData {
  price: number;
  volume: number;
  rsi: number;
}

export async function extractChartData(series: { data: () => LineData[] }): Promise<ChartData> {
  const data = series.data();
  const lastPoint = data[data.length - 1];

  // Calculate RSI (14-period RSI as an example)
  const rsi = calculateRSI(data, 14);

  return {
    price: lastPoint.value,
    volume: 0, // Lightweight Charts doesn't provide volume data by default
    rsi,
  };
}

function calculateRSI(data: LineData[], periods: number): number {
  if (data.length < periods + 1) {
    return 0;
  }

  let gains = 0;
  let losses = 0;

  for (let i = data.length - periods; i < data.length; i++) {
    const difference = (data[i].value as number) - (data[i - 1].value as number);
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  const averageGain = gains / periods;
  const averageLoss = losses / periods;

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - (100 / (1 + relativeStrength));
}