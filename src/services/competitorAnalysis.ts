export interface CompetitorAnalysisResult {
  marketTitle: string;
  avgRetailPriceToman: number;
  minRetailPriceToman: number;
  maxRetailPriceToman: number;
  grossMarginPercent: number;
  profitPerUnitToman: number;
  marketDemandLevel: string;
  competitorPlatforms: string[];
  keyDifferentiators: string[];
  suggestedRetailPriceToman: number;
  executiveSummary: string;
}

export async function analyzeCompetitorMarket(
  productTitle: string,
  category: string,
  specs: string,
  wholesalePriceToman: number,
  costUsd: number
): Promise<CompetitorAnalysisResult> {
  const response = await fetch('/api/competitor-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productTitle,
      category,
      specs,
      wholesalePriceToman,
      costUsd,
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  // Static hosting answers unknown routes with index.html (SPA fallback), so a
  // "successful" 200 can still be HTML — fail with a clear error instead.
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error('API endpoint /api/competitor-analysis is not available on this deployment');
  }

  const json = await response.json();
  if (json.success && json.data) {
    return json.data;
  }
  throw new Error('Failed to analyze competitor market');
}
