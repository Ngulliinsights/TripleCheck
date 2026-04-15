# AI/ML Services

AI and machine learning services for document analysis, fraud detection, and trust scoring.

## Architecture

```
ai/
├── services/              # AI service implementations
│   ├── custom-ml.service.ts           # Custom ML models
│   ├── document-processing-ai.service.ts
│   ├── fraud-detection-ai.service.ts
│   ├── property-analysis-ai.service.ts
│   └── recommendation-ai.service.ts
├── middleware/            # AI-specific middleware
│   ├── ai-cache.ts       # AI response caching
│   ├── ai-deduplication.ts
│   ├── ai-middleware.ts
│   └── ai-rate-limiting.ts
├── ai.controller.ts       # HTTP endpoints
├── ml-business.service.ts # Business logic
└── storage.ts             # Model storage
```

## Strategy (see ADR 009)

**Hybrid Approach**: Custom ML models with API fallback

### Custom Models (Primary)
- **Cost**: $0.001-0.005 per document
- **Use**: High-confidence cases (>80%)
- **Models**: 
  - Document classification (Swin Transformer)
  - Fraud detection (DistilBERT)

### API Fallback (Secondary)
- **Cost**: $0.01-0.05 per document
- **Use**: Low-confidence cases or model unavailable
- **Provider**: Hugging Face Inference API

### Cost Savings
- Break-even: ~75 documents/month
- At 1,000 docs/month: Save $19,200/year

## Services

### Document Processing AI
Analyzes documents for authenticity and fraud indicators.

**Features**:
- PDF document analysis
- Signature verification
- Metadata extraction
- Forgery detection

### Fraud Detection AI
Real-time fraud detection for transactions.

**Features**:
- Transaction pattern analysis
- Network analysis for collusion
- Risk scoring
- Anomaly detection

### Property Analysis AI
Property valuation and risk assessment.

**Features**:
- Automated valuation models
- Market analysis
- Risk assessment
- Price prediction

### Trust Scoring AI
Community trust score calculation.

**Features**:
- Behavioral analysis
- Social network analysis
- Reputation scoring
- Trust prediction

## Model Training

See `/adr/009-ml-training-strategy.md` for full details.

**Quick Start**:
```bash
# Generate synthetic data
python scripts/ml/kenyan_document_generator.py

# Train models
python scripts/ml/train_document_model.py
python scripts/ml/train_fraud_model.py

# Evaluate
python scripts/ml/evaluate_models.py
```

## Usage

```typescript
import { CustomMLService } from './services/custom-ml.service'

const mlService = new CustomMLService()
const result = await mlService.analyzeDocument(imageBuffer)

console.log(result.authentic)      // true/false
console.log(result.confidence)     // 0.0-1.0
console.log(result.riskScore)      // 0-100
console.log(result.source)         // 'custom-ml' or 'api-fallback'
console.log(result.cost)           // Cost in USD
```

## Performance

| Metric | Custom ML | API Fallback |
|--------|-----------|--------------|
| Latency | <100ms | <500ms |
| Cost | $0.001-0.005 | $0.01-0.05 |
| Accuracy | 99.7% target | 95%+ |
| Throughput | 1000+ docs/s | 100+ docs/s |

## Monitoring

Track AI service usage and costs:
```typescript
const stats = mlService.getStats()
console.log(stats.customMLPercentage)  // % using custom models
console.log(stats.savings)             // Cost savings vs API-only
```

## Related Documentation

- `/adr/009-ml-training-strategy.md` - ML strategy and decisions
- `/adr/008-business-model.md` - Cost optimization rationale
