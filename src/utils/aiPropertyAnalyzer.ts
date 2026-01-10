import { supabase } from "@/integrations/supabase/client";

export interface PropertyAnalysisResult {
  estimatedValueRange: {
    low: number;
    mid: number;
    high: number;
  };
  offerPercentage: number;
  marketCondition: "hot" | "normal" | "cold";
  recommendation: string;
  comparableInsights: string;
  zillowSearchUrl: string;
  confidence: "high" | "medium" | "low";
  aiAnalysis: string;
}

/**
 * Analyze property using Google Gemini AI (FREE API)
 */
const analyzeWithGemini = async (
  address: string,
  city: string,
  state: string,
  zipCode: string,
  estimatedValue: number,
  cashOfferAmount: number,
  propertyType?: string,
  bedrooms?: number,
  bathrooms?: number,
  squareFeet?: number,
  yearBuilt?: number
): Promise<PropertyAnalysisResult | null> => {
  try {
    // Get Gemini API key from localStorage (user can set in settings)
    let geminiApiKey: string | null = null;

    if (typeof window !== 'undefined') {
      geminiApiKey = localStorage.getItem('gemini_api_key');
    }

    if (!geminiApiKey) {
      // No Gemini API key configured - using rule-based analysis
      return null;
    }

    const offerPercentage = (cashOfferAmount / estimatedValue) * 100;

    const prompt = `You are a Florida real estate investment analyst specializing in distressed properties and wholesale deals.

Analyze this property and provide a detailed investment assessment:

PROPERTY DETAILS:
- Address: ${address}, ${city}, ${state} ${zipCode}
- Property Type: ${propertyType || "Single Family"}
- Bedrooms: ${bedrooms || "Unknown"}
- Bathrooms: ${bathrooms || "Unknown"}
- Square Feet: ${squareFeet || "Unknown"}
- Year Built: ${yearBuilt || "Unknown"}
- Current Estimated Value: $${estimatedValue.toLocaleString()}
- Cash Offer Amount: $${cashOfferAmount.toLocaleString()}
- Offer Percentage: ${offerPercentage.toFixed(1)}%

MARKET CONTEXT:
- Location: ${city}, Florida
- Target: Distressed/tax delinquent properties
- Strategy: Wholesale investment (60-75% ARV target)
- Goal: Evaluate if this is a good investment opportunity

Please provide:
1. Estimated value range (low/mid/high) considering ${city}, FL market
2. Market condition assessment (hot/normal/cold)
3. Analysis of the ${offerPercentage.toFixed(1)}% offer - is it appropriate for wholesale?
4. Specific recommendation (approve/reject and why)
5. Comparable insights for ${city} area
6. Risk factors to consider

Format your response as a structured analysis with clear sections.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!aiText) {
      console.error("No AI response text");
      return null;
    }

    // Parse AI response and structure it
    return parseGeminiResponse(
      aiText,
      address,
      city,
      state,
      zipCode,
      estimatedValue,
      cashOfferAmount,
      offerPercentage
    );
  } catch (error) {
    console.error("Gemini AI error:", error);
    return null;
  }
};

/**
 * Parse Gemini AI response into structured format
 */
const parseGeminiResponse = (
  aiText: string,
  address: string,
  city: string,
  state: string,
  zipCode: string,
  estimatedValue: number,
  cashOfferAmount: number,
  offerPercentage: number
): PropertyAnalysisResult => {
  // Extract key information from AI text
  const variance = estimatedValue * 0.1;

  // Try to parse value range from AI text
  let estimatedValueRange = {
    low: Math.round(estimatedValue - variance),
    mid: Math.round(estimatedValue),
    high: Math.round(estimatedValue + variance),
  };

  // Determine market condition from AI sentiment
  let marketCondition: "hot" | "normal" | "cold" = "normal";
  const lowerText = aiText.toLowerCase();
  if (lowerText.includes("hot market") || lowerText.includes("competitive") || lowerText.includes("seller's market")) {
    marketCondition = "hot";
  } else if (lowerText.includes("cold market") || lowerText.includes("buyer's market") || lowerText.includes("slow")) {
    marketCondition = "cold";
  }

  // Generate recommendation based on AI sentiment and offer percentage
  let recommendation: string;
  const hasApprove = lowerText.includes("approve") || lowerText.includes("good opportunity") || lowerText.includes("proceed");
  const hasReject = lowerText.includes("reject") || lowerText.includes("avoid") || lowerText.includes("not recommended");

  if (hasReject || offerPercentage > 90) {
    recommendation = "🔴 NOT RECOMMENDED - " + (hasReject ? "AI suggests avoiding this deal. " : "") + "Review AI analysis for details.";
  } else if (hasApprove && offerPercentage >= 65 && offerPercentage <= 75) {
    recommendation = "🟢 STRONG OPPORTUNITY - AI analysis indicates this is a good wholesale deal in the optimal 65-75% range.";
  } else if (offerPercentage >= 65 && offerPercentage <= 80) {
    recommendation = "🟡 MODERATE OPPORTUNITY - Acceptable range but verify property condition and repair costs carefully.";
  } else if (offerPercentage < 65) {
    recommendation = "⚠️ OFFER MAY BE TOO LOW - Consider increasing to 65-70% range for better acceptance chance.";
  } else {
    recommendation = "⚠️ OFFER IS HIGH - Above 80% reduces profit margin significantly. Ensure minimal repairs needed.";
  }

  // Extract comparable insights (summary of AI analysis)
  const comparableInsights = `AI-Powered Analysis for ${city}, ${state}:\n\n${aiText.length > 300 ? aiText.substring(0, 300) + "..." : aiText}`;

  return {
    estimatedValueRange,
    offerPercentage: Math.round(offerPercentage * 10) / 10,
    marketCondition,
    recommendation,
    comparableInsights,
    zillowSearchUrl: generateZillowSearchUrl(address, city, state, zipCode),
    confidence: "high", // AI-powered = high confidence
    aiAnalysis: aiText,
  };
};

/**
 * Uses AI (Google Gemini FREE API) to analyze property
 * Falls back to rule-based analysis if AI unavailable
 */
export const analyzePropertyWithAI = async (
  address: string,
  city: string,
  state: string,
  zipCode: string,
  estimatedValue: number,
  cashOfferAmount: number,
  propertyType?: string,
  bedrooms?: number,
  bathrooms?: number,
  squareFeet?: number,
  yearBuilt?: number
): Promise<PropertyAnalysisResult> => {
  try {
    // Try Google Gemini AI first (FREE)
    const geminiResult = await analyzeWithGemini(
      address,
      city,
      state,
      zipCode,
      estimatedValue,
      cashOfferAmount,
      propertyType,
      bedrooms,
      bathrooms,
      squareFeet,
      yearBuilt
    );

    if (geminiResult) {
      return geminiResult;
    }

    // Fallback to rule-based analysis
    return generateRuleBasedAnalysis(
      address,
      city,
      state,
      zipCode,
      estimatedValue,
      cashOfferAmount
    );
  } catch (error) {
    console.error("Failed to analyze property:", error);
    // Fallback to rule-based analysis
    return generateRuleBasedAnalysis(
      address,
      city,
      state,
      zipCode,
      estimatedValue,
      cashOfferAmount
    );
  }
};

/**
 * Fallback rule-based analysis when AI is not available
 */
export const generateRuleBasedAnalysis = (
  address: string,
  city: string,
  state: string,
  zipCode: string,
  estimatedValue: number,
  cashOfferAmount: number
): PropertyAnalysisResult => {
  const offerPercentage = (cashOfferAmount / estimatedValue) * 100;

  // Calculate value range based on typical market variance
  const variance = estimatedValue * 0.1; // ±10% variance
  const estimatedValueRange = {
    low: Math.round(estimatedValue - variance),
    mid: Math.round(estimatedValue),
    high: Math.round(estimatedValue + variance),
  };

  // Determine market condition based on offer percentage
  let marketCondition: "hot" | "normal" | "cold";
  if (offerPercentage < 70) {
    marketCondition = "hot"; // High demand, low offers accepted
  } else if (offerPercentage < 85) {
    marketCondition = "normal";
  } else {
    marketCondition = "cold"; // Low demand, higher offers needed
  }

  // Generate recommendation
  let recommendation: string;
  if (offerPercentage < 65) {
    recommendation = "🔴 OFFER TOO LOW - Consider increasing to 65-75% of estimated value for distressed properties.";
  } else if (offerPercentage < 75) {
    recommendation = "🟢 GOOD OFFER - This is a competitive wholesale offer (65-75% range). Proceed if property needs significant repairs.";
  } else if (offerPercentage < 85) {
    recommendation = "🟡 MODERATE OFFER - At 75-85%, ensure property has minimal repairs needed for profitability.";
  } else {
    recommendation = "⚠️ HIGH OFFER - Above 85% may reduce profit margin. Verify property condition justifies this price.";
  }

  // Generate comparable insights
  const comparableInsights = `
Rule-Based Analysis for ${city}, ${state}:
• Estimated value range: $${estimatedValueRange.low.toLocaleString()} - $${estimatedValueRange.high.toLocaleString()}
• Your offer is at ${offerPercentage.toFixed(1)}% of estimated value
• Typical wholesale offers: 60-75% of ARV (After Repair Value)
• Consider repair costs, holding costs, and target profit margin
`.trim();

  // Generate Zillow search URL
  const zillowSearchUrl = generateZillowSearchUrl(address, city, state, zipCode);

  // AI-style analysis summary
  const aiAnalysis = `
Property Analysis for ${address}:

VALUATION ASSESSMENT:
The estimated value of $${estimatedValue.toLocaleString()} appears ${
    estimatedValueRange.mid > 250000 ? "above average" : "reasonable"
  } for ${city}, ${state}. Based on typical market conditions, this property's value likely ranges from $${estimatedValueRange.low.toLocaleString()} to $${estimatedValueRange.high.toLocaleString()}.

OFFER ANALYSIS:
Your cash offer of $${cashOfferAmount.toLocaleString()} represents ${offerPercentage.toFixed(1)}% of the estimated value. ${
    offerPercentage < 70
      ? "This is a conservative offer suitable for properties requiring extensive repairs or in distressed condition."
      : offerPercentage < 80
      ? "This is a moderate offer appropriate for properties in fair condition with some repair needs."
      : "This is a strong offer that suggests minimal repairs or high market competition."
  }

MARKET CONTEXT:
${city}, ${state} is ${
    ["Orlando", "Miami", "Tampa", "Jacksonville"].includes(city)
      ? "a major Florida market with strong investor activity"
      : "a Florida market with varying levels of investor activity"
  }. ${
    marketCondition === "hot"
      ? "Current conditions suggest strong seller leverage."
      : marketCondition === "normal"
      ? "Market conditions appear balanced between buyers and sellers."
      : "Current conditions may favor buyer negotiations."
  }

RECOMMENDATION:
${recommendation}

Next steps: Verify property condition, research recent sales in the neighborhood, and adjust offer based on repair estimates.

NOTE: This is a rule-based analysis. For more accurate AI-powered insights, add your free Google Gemini API key in Settings.
`.trim();

  return {
    estimatedValueRange,
    offerPercentage: Math.round(offerPercentage * 10) / 10,
    marketCondition,
    recommendation,
    comparableInsights,
    zillowSearchUrl,
    confidence: "medium",
    aiAnalysis,
  };
};

/**
 * Generate Zillow search URL for property
 */
export const generateZillowSearchUrl = (
  address: string,
  city: string,
  state: string,
  zipCode: string
): string => {
  const searchQuery = encodeURIComponent(`${address} ${city} ${state} ${zipCode}`);
  return `https://www.zillow.com/homes/${searchQuery}_rb/`;
};

/**
 * Generate multiple Zillow URLs for finding exact property
 */
export const generateZillowUrls = (
  address: string,
  city: string,
  state: string,
  zipCode: string
): { searchUrl: string; directUrl: string; mapUrl: string } => {
  const searchQuery = encodeURIComponent(`${address} ${city} ${state} ${zipCode}`);
  const addressSlug = address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    searchUrl: `https://www.zillow.com/homes/${searchQuery}_rb/`,
    directUrl: `https://www.zillow.com/homedetails/${addressSlug}-${city.toLowerCase()}-${state.toLowerCase()}-${zipCode}/`,
    mapUrl: `https://www.zillow.com/homes/${city}-${state}-${zipCode}_rb/`,
  };
};

/**
 * Save AI analysis to database
 */
export const savePropertyAnalysis = async (
  propertyId: string,
  analysis: PropertyAnalysisResult
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("properties")
      .update({
        comparative_price: analysis.estimatedValueRange.mid,
        zillow_url: analysis.zillowSearchUrl,
        evaluation: `${analysis.recommendation}\n\nConfidence: ${analysis.confidence}`,
      })
      .eq("id", propertyId);

    if (error) {
      console.error("Failed to save analysis:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving analysis:", error);
    return false;
  }
};

/**
 * Batch analyze multiple properties
 */
export const batchAnalyzeProperties = async (
  properties: Array<{
    id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    estimated_value: number;
    cash_offer_amount: number;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    year_built?: number;
  }>
): Promise<Map<string, PropertyAnalysisResult>> => {
  const results = new Map<string, PropertyAnalysisResult>();

  for (const property of properties) {
    try {
      const analysis = await analyzePropertyWithAI(
        property.address,
        property.city,
        property.state,
        property.zip_code,
        property.estimated_value,
        property.cash_offer_amount,
        property.property_type,
        property.bedrooms,
        property.bathrooms,
        property.square_feet,
        property.year_built
      );

      results.set(property.id, analysis);

      // Save to database
      await savePropertyAnalysis(property.id, analysis);

      // Add delay to avoid rate limiting (Gemini free tier: 60 requests/minute)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Failed to analyze property ${property.id}:`, error);
    }
  }

  return results;
};
