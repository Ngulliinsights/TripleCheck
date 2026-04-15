# ADR 009: ML Training and Deployment Strategy

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Technical Team

## Context

Need ML models for document verification and fraud detection. Two options:
1. Use API services (Hugging Face, OpenAI) - $0.01-0.05 per document
2. Train custom models - $500-1,500 one-time + $100-200/month

## Decision

**Train Custom ML Models** with API fallback

**Rationale**:
- Cost at scale: $0.001-0.005 per document (custom) vs $0.01-0.05 (API)
- Break-even: ~75 documents/month
- At 1,000 docs/month: Save $19,200/year
- Own IP and models (competitive moat)
- Full customization for Kenyan context
- Data stays in infrastructure

**Implementation Strategy**:

1. **Synthetic Data Generation** (Days 1-3)
   - Generate 10,000 synthetic Kenyan documents
   - 60% authentic, 20% suspicious, 20% fraudulent
   - Realistic title deed formats and patterns

2. **Model Training** (Days 4-7)
   - Document classification: Swin Transformer (microsoft/swin-base)
   - Fraud detection: DistilBERT
   - Transfer learning from pre-trained models
   - Target: 99.7% fraud detection accuracy

3. **Hybrid Deployment** (Days 8-10)
   - Custom model for high-confidence cases (>80%)
   - API fallback for low-confidence cases
   - Cost monitoring and optimization

4. **Testing & Validation** (Days 11-14)
   - Comprehensive evaluation
   - Cost monitoring
   - Performance benchmarking

## Consequences

### Positive
- 10x cheaper at scale
- Full control over models
- Competitive advantage (proprietary models)
- No dependency on external services
- Data privacy maintained

### Negative
- Initial development time (1-2 weeks)
- Need GPU infrastructure
- Model maintenance required
- Complexity of hybrid system

## Cost Analysis

**Custom ML**:
- One-time: $500-1,500 (training)
- Monthly: $100-200 (infrastructure)
- Per document: $0.001-0.005

**API Services**:
- Per document: $0.01-0.05
- At 1,000 docs/month: $10,000-50,000/year

**Savings**: $19,200/year at 1,000 docs/month

## Technical Stack
- PyTorch / TensorFlow
- Hugging Face Transformers
- TensorFlow.js for deployment
- GPU: Google Colab Pro / Paperspace / AWS SageMaker

## Related Decisions
- ADR 008: Business Model (cost optimization supports margins)
- Links to infrastructure and deployment decisions
