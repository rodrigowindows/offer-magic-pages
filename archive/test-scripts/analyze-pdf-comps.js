/**
 * Análise dos Comparables do PDF - 28 Properties
 * Verifica se os dados fazem sentido
 */

console.log("═══════════════════════════════════════════════════════");
console.log("🔍 ANÁLISE DOS COMPARABLES - PDF REPORT");
console.log("28 Properties Analyzed - January 24, 2026");
console.log("═══════════════════════════════════════════════════════\n");

const properties = [
  {
    id: 1,
    address: "25217 MATHEW ST UNINCORPORATED 32709",
    city: "Orlando",
    estimated_value: 100000,
    avg_sale_price: 101000,
    avg_sqft_price: 52,
    comps: [
      { address: "3820 Colonial Dr", price: 112000, sqft: 2083, price_sqft: 54, beds: 4, baths: 2, dist: 0.0 },
      { address: "4609 Pine Ave", price: 87000, sqft: 1806, price_sqft: 48, beds: 3, baths: 1, dist: 0.0 },
      { address: "7506 Palm Way", price: 115000, sqft: 1542, price_sqft: 74, beds: 4, baths: 2, dist: 0.0 },
      { address: "4811 Main St", price: 86000, sqft: 2162, price_sqft: 40, beds: 3, baths: 2, dist: 0.0 },
      { address: "3684 Cedar Ln", price: 102000, sqft: 1785, price_sqft: 57, beds: 4, baths: 1, dist: 0.0 },
      { address: "5891 Cedar Ln", price: 101000, sqft: 2441, price_sqft: 41, beds: 2, baths: 3, dist: 0.0 }
    ]
  },
  {
    id: 10,
    address: "E 13TH ST",
    city: "Orlando",
    estimated_value: 100000,
    avg_sale_price: 103000,
    avg_sqft_price: 47,
    comps: [
      { address: "8455 Main St", price: 99000, sqft: 1856, price_sqft: 53, beds: 4, baths: 1, dist: 1.2 },
      { address: "782 Palm Way", price: 108000, sqft: 2607, price_sqft: 41, beds: 4, baths: 2, dist: 1.2 },
      { address: "8589 Pine Ave", price: 96000, sqft: 2249, price_sqft: 43, beds: 4, baths: 3, dist: 0.0 },
      { address: "1106 Cedar Ln", price: 103000, sqft: 2152, price_sqft: 48, beds: 4, baths: 3, dist: 0.6 },
      { address: "3783 Lake View Dr", price: 99000, sqft: 1836, price_sqft: 54, beds: 2, baths: 2, dist: 0.6 },
      { address: "9112 Cedar Ln", price: 114000, sqft: 2519, price_sqft: 45, beds: 3, baths: 3, dist: 0.5 }
    ]
  },
  {
    id: 4,
    address: "144 WASHINGTON AVE EATONVILLE",
    city: "Orlando",
    estimated_value: 100000,
    avg_sale_price: 96000,
    avg_sqft_price: 52,
    comps: [
      { address: "5885 Park Ave", price: 92000, sqft: 1486, price_sqft: 62, beds: 4, baths: 3, dist: 1.1 },
      { address: "360 Maple Dr", price: 105000, sqft: 1670, price_sqft: 63, beds: 3, baths: 3, dist: 0.8 },
      { address: "7521 Lake View Dr", price: 86000, sqft: 2493, price_sqft: 35, beds: 4, baths: 2, dist: 1.3 },
      { address: "547 Main St", price: 109000, sqft: 2328, price_sqft: 47, beds: 2, baths: 2, dist: 0.1 },
      { address: "6921 Main St", price: 90000, sqft: 1449, price_sqft: 62, beds: 3, baths: 2, dist: 0.7 },
      { address: "9440 Park Ave", price: 94000, sqft: 2013, price_sqft: 46, beds: 4, baths: 2, dist: 0.2 }
    ]
  }
];

console.log("📊 ANÁLISE GERAL:");
console.log("─────────────────────────────────────────────────────\n");

// Análise de distâncias
let totalComps = 0;
let compsWithZeroDistance = 0;
let compsWithDistance = 0;
let totalDistance = 0;
let maxDistance = 0;

const distanceGroups = {
  '0.0 mi': 0,
  '0.1-0.5 mi': 0,
  '0.6-1.0 mi': 0,
  '1.1-1.5 mi': 0,
  '> 1.5 mi': 0
};

properties.forEach(prop => {
  prop.comps.forEach(comp => {
    totalComps++;

    if (comp.dist === 0.0) {
      compsWithZeroDistance++;
      distanceGroups['0.0 mi']++;
    } else {
      compsWithDistance++;
      totalDistance += comp.dist;
      maxDistance = Math.max(maxDistance, comp.dist);

      if (comp.dist <= 0.5) {
        distanceGroups['0.1-0.5 mi']++;
      } else if (comp.dist <= 1.0) {
        distanceGroups['0.6-1.0 mi']++;
      } else if (comp.dist <= 1.5) {
        distanceGroups['1.1-1.5 mi']++;
      } else {
        distanceGroups['> 1.5 mi']++;
      }
    }
  });
});

const avgDistance = compsWithDistance > 0 ? totalDistance / compsWithDistance : 0;

console.log(`Total de comps analisados: ${totalComps}`);
console.log(`Comps com distância 0.0 mi: ${compsWithZeroDistance} (${((compsWithZeroDistance/totalComps)*100).toFixed(1)}%)`);
console.log(`Comps com distância > 0: ${compsWithDistance} (${((compsWithDistance/totalComps)*100).toFixed(1)}%)`);
console.log(`Distância média (excluindo 0.0): ${avgDistance.toFixed(2)} miles`);
console.log(`Distância máxima: ${maxDistance.toFixed(2)} miles`);

console.log("\n📊 Distribuição de Distâncias:");
Object.entries(distanceGroups).forEach(([range, count]) => {
  const pct = ((count / totalComps) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(count / 2));
  console.log(`  ${range.padEnd(15)} ${count.toString().padStart(3)} (${pct}%) ${bar}`);
});

console.log("\n═══════════════════════════════════════════════════════");
console.log("🔍 PROBLEMAS IDENTIFICADOS:");
console.log("═══════════════════════════════════════════════════════\n");

// Problema 1: Muitos comps com distância 0.0
if (compsWithZeroDistance > totalComps * 0.1) {
  console.log(`❌ PROBLEMA 1: ${compsWithZeroDistance} comps (${((compsWithZeroDistance/totalComps)*100).toFixed(1)}%) com distância 0.0 mi`);
  console.log("   Explicação: Distância 0.0 significa que:");
  console.log("   - Não foram calculadas coordenadas reais");
  console.log("   - Ou as coordenadas não foram salvas no PDF");
  console.log("   - Sistema gerou comps mas não calculou distância\n");
}

// Problema 2: Todas properties com mesmo estimated_value
const uniqueValues = new Set(properties.map(p => p.estimated_value));
if (uniqueValues.size === 1) {
  console.log("⚠️ PROBLEMA 2: Todas as 28 properties têm o MESMO estimated_value ($100,000)");
  console.log("   Explicação: Isso é MUITO suspeito!");
  console.log("   - Properties diferentes deveriam ter valores diferentes");
  console.log("   - Pode ser valor padrão/placeholder");
  console.log("   - Precisa verificar se os valores reais estão no banco\n");
}

console.log("═══════════════════════════════════════════════════════");
console.log("📋 ANÁLISE POR PROPERTY:");
console.log("═══════════════════════════════════════════════════════\n");

properties.forEach(prop => {
  console.log(`\n${prop.id}. ${prop.address}`);
  console.log(`   Estimated Value: $${prop.estimated_value.toLocaleString()}`);
  console.log(`   Avg Sale Price: $${prop.avg_sale_price.toLocaleString()}`);
  console.log(`   Avg $/SqFt: $${prop.avg_sqft_price}`);

  const zeroDistComps = prop.comps.filter(c => c.dist === 0.0).length;
  const avgCompDist = prop.comps.reduce((sum, c) => sum + c.dist, 0) / prop.comps.length;

  if (zeroDistComps > 0) {
    console.log(`   ⚠️ ${zeroDistComps}/6 comps com distância 0.0`);
  }

  if (avgCompDist > 0) {
    console.log(`   📍 Distância média: ${avgCompDist.toFixed(2)} miles`);
  }

  // Validar preços
  const avgPrice = prop.comps.reduce((sum, c) => sum + c.price, 0) / prop.comps.length;
  const calculatedAvg = Math.round(avgPrice / 1000) * 1000;

  if (Math.abs(calculatedAvg - prop.avg_sale_price) > 2000) {
    console.log(`   ⚠️ Avg calculado ($${calculatedAvg.toLocaleString()}) difere do mostrado ($${prop.avg_sale_price.toLocaleString()})`);
  }

  // Validar $/sqft
  const avgSqftPrice = prop.comps.reduce((sum, c) => sum + c.price_sqft, 0) / prop.comps.length;
  if (Math.abs(Math.round(avgSqftPrice) - prop.avg_sqft_price) > 2) {
    console.log(`   ⚠️ $/SqFt calculado ($${Math.round(avgSqftPrice)}) difere do mostrado ($${prop.avg_sqft_price})`);
  }

  console.log(`   ✅ Comps: ${prop.comps.length} registros`);
});

console.log("\n\n═══════════════════════════════════════════════════════");
console.log("📊 ESTATÍSTICAS DE PREÇOS:");
console.log("═══════════════════════════════════════════════════════\n");

let allComps = [];
properties.forEach(p => {
  p.comps.forEach(c => allComps.push(c));
});

const prices = allComps.map(c => c.price);
const sqftPrices = allComps.map(c => c.price_sqft);

const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);

const avgSqftPrice = sqftPrices.reduce((a, b) => a + b, 0) / sqftPrices.length;
const minSqftPrice = Math.min(...sqftPrices);
const maxSqftPrice = Math.max(...sqftPrices);

console.log("Preços de Venda:");
console.log(`  Mínimo: $${minPrice.toLocaleString()}`);
console.log(`  Máximo: $${maxPrice.toLocaleString()}`);
console.log(`  Média: $${Math.round(avgPrice).toLocaleString()}`);
console.log(`  Range: $${(maxPrice - minPrice).toLocaleString()}`);

console.log("\n$/SqFt:");
console.log(`  Mínimo: $${minSqftPrice}`);
console.log(`  Máximo: $${maxSqftPrice}`);
console.log(`  Média: $${Math.round(avgSqftPrice)}`);
console.log(`  Range: $${maxSqftPrice - minSqftPrice}`);

console.log("\n═══════════════════════════════════════════════════════");
console.log("✅ VALIDAÇÕES:");
console.log("═══════════════════════════════════════════════════════\n");

// Validação 1: Range de preços
if (maxPrice - minPrice < 50000) {
  console.log("❌ Range de preços muito pequeno ($" + (maxPrice - minPrice).toLocaleString() + ")");
  console.log("   Properties diferentes deveriam ter maior variação");
} else {
  console.log("✅ Range de preços razoável ($" + (maxPrice - minPrice).toLocaleString() + ")");
}

// Validação 2: $/SqFt
if (avgSqftPrice >= 30 && avgSqftPrice <= 100) {
  console.log("✅ $/SqFt médio ($" + Math.round(avgSqftPrice) + ") está em range normal para Orlando");
} else {
  console.log("⚠️ $/SqFt médio ($" + Math.round(avgSqftPrice) + ") fora do esperado");
}

// Validação 3: Quantidade de comps
if (totalComps === 28 * 6) {
  console.log("✅ Todas as 28 properties têm 6 comps cada");
} else {
  console.log("⚠️ Número inconsistente de comps");
}

// Validação 4: Distâncias
if (compsWithZeroDistance === 0) {
  console.log("✅ Todas as distâncias foram calculadas");
} else {
  console.log(`❌ ${compsWithZeroDistance} comps sem distância calculada (0.0 mi)`);
}

console.log("\n═══════════════════════════════════════════════════════");
console.log("🎯 CONCLUSÃO:");
console.log("═══════════════════════════════════════════════════════\n");

const issuesFound = [];

if (compsWithZeroDistance > 0) {
  issuesFound.push(`${compsWithZeroDistance} comps com distância 0.0 mi`);
}

if (uniqueValues.size === 1) {
  issuesFound.push("Todas properties com mesmo estimated_value ($100k)");
}

if (issuesFound.length === 0) {
  console.log("✅ TUDO PARECE CORRETO!");
  console.log("   - Distâncias calculadas corretamente");
  console.log("   - Preços variados e realistas");
  console.log("   - $/SqFt dentro do esperado");
  console.log("   - Quantidade de comps consistente");
} else {
  console.log("⚠️ PROBLEMAS ENCONTRADOS:\n");
  issuesFound.forEach((issue, idx) => {
    console.log(`   ${idx + 1}. ${issue}`);
  });

  console.log("\n📋 RECOMENDAÇÕES:");

  if (compsWithZeroDistance > 0) {
    console.log("\n   1. Distâncias 0.0 mi:");
    console.log("      - Verificar se coordinates estão sendo salvas");
    console.log("      - Conferir cálculo de distância no código");
    console.log("      - Pode ser problema no PDF export");
  }

  if (uniqueValues.size === 1) {
    console.log("\n   2. Estimated values iguais:");
    console.log("      - Verificar se valores reais estão no banco");
    console.log("      - Pode ser placeholder/default");
    console.log("      - Conferir query de busca das properties");
  }
}

console.log("\n═══════════════════════════════════════════════════════\n");
