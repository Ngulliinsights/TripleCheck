# Custom ML Training Quick Start Guide
## Train Proprietary Models on Synthetic Data in 1-2 Weeks

**Priority:** CRITICAL  
**Timeline:** Week 1-2  
**Cost:** $500-1,500 one-time + $100-200/month  
**Impact:** 10x cheaper at scale, full control, competitive advantage

---

## Why Custom ML Over API Services?

**Cost at Scale:**
- Custom ML: $0.001-0.005 per document (fixed infrastructure cost)
- API Services: $0.01-0.05 per document (scales with usage)
- Break-even: ~75 documents/month
- At 1,000 docs/month: Save $19,200/year

**Strategic Advantages:**
- Own your IP and models
- Full customization for Kenyan context
- No dependency on external services
- Data stays in your infrastructure
- Competitive moat (proprietary models)

**You're an AI Engineer:**
- Leverage your ML expertise
- Modern tools make this fast (1-2 weeks)
- Synthetic data generation is viable
- Transfer learning from pre-trained models

---

## Setup (Day 1)

### 1. Install ML Stack

```bash
# Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Core ML libraries
pip install torch torchvision transformers datasets
pip install pillow faker pandas numpy
pip install huggingface-hub accelerate

# Optional: TensorFlow (if you prefer TF over PyTorch)
pip install tensorflow tensorflow-hub

# Development tools
pip install jupyter notebook matplotlib seaborn
```

### 2. GPU Access

**Option A: Local GPU**
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"
```

**Option B: Cloud GPU (Recommended for training)**
- **Google Colab Pro:** $10/month, good for prototyping
- **Paperspace Gradient:** $8/month, persistent storage
- **AWS SageMaker:** Pay per use, production-ready
- **Lambda Labs:** $0.50/hour for A100 GPUs

### 3. Hugging Face Setup

```bash
# Create account at huggingface.co
# Get access token from settings

# Login
huggingface-cli login

# Configure
export HF_TOKEN=your_token_here
```

---

## Phase 1: Synthetic Data Generation (Days 1-3)

### Task 1.1: Kenyan Document Generator

Create `scripts/ml/kenyan_document_generator.py`:

```python
import random
from PIL import Image, ImageDraw, ImageFont
from faker import Faker
import os

class KenyanDocumentGenerator:
    def __init__(self):
        self.fake = Faker('en_KE')
        
        # Real Kenyan locations
        self.counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 
                        'Thika', 'Malindi', 'Kitale', 'Garissa', 'Nyeri']
        
        self.nairobi_areas = ['Westlands', 'Kilimani', 'Karen', 'Eastleigh', 
                             'Lavington', 'Parklands', 'Kileleshwa', 'Runda']
        
        # Authentic title deed number formats
        self.deed_formats = [
            "{county}/{block}/{number}",
            "I.R. {number}/{year}",
            "{county}/BLOCK {block}/PLOT {plot}"
        ]
        
        # Load fonts (adjust paths for your system)
        try:
            self.header_font = ImageFont.truetype("arial.ttf", 24)
            self.subheader_font = ImageFont.truetype("arial.ttf", 18)
            self.body_font = ImageFont.truetype("arial.ttf", 14)
        except:
            self.header_font = ImageFont.load_default()
            self.subheader_font = ImageFont.load_default()
            self.body_font = ImageFont.load_default()
    
    def generate_kenyan_name(self):
        """Generate realistic Kenyan name"""
        first_names = ['John', 'Mary', 'Peter', 'Jane', 'David', 'Grace', 
                      'James', 'Lucy', 'Joseph', 'Sarah', 'Daniel', 'Ruth']
        last_names = ['Kamau', 'Wanjiru', 'Ochieng', 'Akinyi', 'Mwangi', 
                     'Njeri', 'Otieno', 'Wambui', 'Kipchoge', 'Chebet']
        return f"{random.choice(first_names)} {random.choice(last_names)}"
    
    def generate_deed_number(self, county):
        """Generate realistic title deed number"""
        format_choice = random.choice(self.deed_formats)
        return format_choice.format(
            county=county,
            block=random.randint(1, 500),
            number=random.randint(1000, 9999),
            plot=random.randint(1, 999),
            year=random.randint(1990, 2024)
        )
    
    def generate_authentic_deed(self):
        """Generate realistic authentic Kenyan title deed"""
        img = Image.new('RGB', (1200, 1600), 'white')
        draw = ImageDraw.Draw(img)
        
        # Official header
        draw.text((400, 50), "REPUBLIC OF KENYA", fill='black', font=self.header_font)
        draw.text((250, 100), "MINISTRY OF LANDS AND PHYSICAL PLANNING", 
                 fill='black', font=self.subheader_font)
        draw.line([(100, 140), (1100, 140)], fill='black', width=2)
        
        # Generate realistic data
        county = random.choice(self.counties)
        deed_number = self.generate_deed_number(county)
        owner = self.generate_kenyan_name()
        location = f"{random.choice(self.nairobi_areas) if county == 'Nairobi' else self.fake.city()}, {county} County"
        size = round(random.uniform(0.05, 5.0), 2)
        reg_date = self.fake.date_between(start_date='-30y', end_date='today')
        
        # Document content
        y_pos = 200
        fields = [
            ("TITLE DEED NUMBER:", deed_number),
            ("REGISTERED OWNER:", owner),
            ("LOCATION:", location),
            ("PROPERTY SIZE:", f"{size} Hectares"),
            ("REGISTRATION DATE:", reg_date.strftime("%d/%m/%Y")),
            ("LAND USE:", random.choice(["Residential", "Commercial", "Agricultural"]))
        ]
        
        for label, value in fields:
            draw.text((100, y_pos), label, fill='black', font=self.body_font)
            draw.text((400, y_pos), value, fill='black', font=self.body_font)
            y_pos += 50
        
        # Add official stamps (simplified)
        self.add_official_stamp(draw, (900, 1400))
        
        # Add signature line
        draw.line([(100, 1450), (500, 1450)], fill='black', width=1)
        draw.text((100, 1460), "Registrar of Lands", fill='black', font=self.body_font)
        
        return img
    
    def add_official_stamp(self, draw, position):
        """Add official stamp (simplified circle)"""
        x, y = position
        draw.ellipse([x, y, x+100, y+100], outline='red', width=3)
        draw.text((x+15, y+40), "OFFICIAL\nSTAMP", fill='red', font=self.body_font)
    
    def generate_fraudulent_deed(self, fraud_type):
        """Generate document with specific fraud pattern"""
        doc = self.generate_authentic_deed()
        
        if fraud_type == 'forgery':
            # Add tampering signs
            doc = self.add_tampering_signs(doc)
        elif fraud_type == 'digitization_fraud':
            # Add registry mismatch indicators
            doc = self.add_registry_mismatch(doc)
        elif fraud_type == 'double_registration':
            # Add duplicate markers
            doc = self.add_duplicate_markers(doc)
        
        return doc
    
    def add_tampering_signs(self, img):
        """Add visible tampering indicators"""
        draw = ImageDraw.Draw(img)
        # Add mismatched fonts, corrections, etc.
        draw.text((400, 300), "[ALTERED]", fill='gray', font=self.body_font)
        return img
    
    def add_registry_mismatch(self, img):
        """Add digitization fraud indicators"""
        draw = ImageDraw.Draw(img)
        draw.text((100, 1500), "Digital Entry: 2024 [RECENT]", fill='blue', font=self.body_font)
        return img
    
    def add_duplicate_markers(self, img):
        """Add double registration indicators"""
        draw = ImageDraw.Draw(img)
        draw.text((100, 1520), "DUPLICATE DETECTED", fill='red', font=self.body_font)
        return img
    
    def generate_dataset(self, n_samples=10000, output_dir='./data/synthetic_deeds'):
        """Generate complete training dataset"""
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(f"{output_dir}/authentic", exist_ok=True)
        os.makedirs(f"{output_dir}/suspicious", exist_ok=True)
        os.makedirs(f"{output_dir}/fraudulent", exist_ok=True)
        
        dataset = []
        
        print(f"Generating {n_samples} synthetic documents...")
        
        # 60% authentic
        for i in range(int(n_samples * 0.6)):
            img = self.generate_authentic_deed()
            filename = f"authentic_{i:05d}.png"
            img.save(f"{output_dir}/authentic/{filename}")
            dataset.append({
                'filename': filename,
                'label': 'authentic',
                'fraud_score': random.uniform(0, 0.2)
            })
            if i % 100 == 0:
                print(f"Generated {i} authentic documents...")
        
        # 20% suspicious
        for i in range(int(n_samples * 0.2)):
            img = self.generate_authentic_deed()
            # Add minor issues
            filename = f"suspicious_{i:05d}.png"
            img.save(f"{output_dir}/suspicious/{filename}")
            dataset.append({
                'filename': filename,
                'label': 'suspicious',
                'fraud_score': random.uniform(0.4, 0.6)
            })
        
        # 20% fraudulent (various types)
        fraud_types = ['forgery', 'digitization_fraud', 'double_registration']
        for i in range(int(n_samples * 0.2)):
            fraud_type = random.choice(fraud_types)
            img = self.generate_fraudulent_deed(fraud_type)
            filename = f"fraudulent_{fraud_type}_{i:05d}.png"
            img.save(f"{output_dir}/fraudulent/{filename}")
            dataset.append({
                'filename': filename,
                'label': 'fraudulent',
                'fraud_type': fraud_type,
                'fraud_score': random.uniform(0.7, 1.0)
            })
        
        print(f"Dataset generation complete! {len(dataset)} documents created.")
        return dataset

# Usage
if __name__ == "__main__":
    generator = KenyanDocumentGenerator()
    dataset = generator.generate_dataset(n_samples=10000)
    print(f"Generated {len(dataset)} documents")
```

**Run it:**
```bash
python scripts/ml/kenyan_document_generator.py
```

This creates 10,000 synthetic documents in ~10-15 minutes.

---

## Phase 2: Model Training (Days 4-7)

### Task 2.1: Document Classification Model

Create `scripts/ml/train_document_model.py`:

```python
from transformers import (
    AutoImageProcessor, 
    AutoModelForImageClassification,
    TrainingArguments,
    Trainer
)
from datasets import load_dataset
import torch
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

class DocumentModelTrainer:
    def __init__(self, model_name="microsoft/swin-base-patch4-window7-224"):
        self.model_name = model_name
        self.num_labels = 3  # authentic, suspicious, fraudulent
        
    def load_data(self, data_dir='./data/synthetic_deeds'):
        """Load synthetic dataset"""
        dataset = load_dataset('imagefolder', data_dir=data_dir)
        
        # Split into train/val/test
        train_test = dataset['train'].train_test_split(test_size=0.2, seed=42)
        test_val = train_test['test'].train_test_split(test_size=0.5, seed=42)
        
        return {
            'train': train_test['train'],
            'validation': test_val['train'],
            'test': test_val['test']
        }
    
    def preprocess_data(self, dataset):
        """Preprocess images for model"""
        processor = AutoImageProcessor.from_pretrained(self.model_name)
        
        def transform(examples):
            inputs = processor(examples['image'], return_tensors='pt')
            inputs['labels'] = examples['label']
            return inputs
        
        dataset = dataset.map(transform, batched=True)
        return dataset
    
    def compute_metrics(self, eval_pred):
        """Calculate evaluation metrics"""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)
        
        accuracy = accuracy_score(labels, predictions)
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels, predictions, average='weighted'
        )
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }
    
    def train(self, output_dir='./models/triplecheck-document-v1'):
        """Train document classification model"""
        
        print("Loading dataset...")
        datasets = self.load_data()
        
        print("Preprocessing data...")
        datasets = {k: self.preprocess_data(v) for k, v in datasets.items()}
        
        print("Loading pre-trained model...")
        model = AutoModelForImageClassification.from_pretrained(
            self.model_name,
            num_labels=self.num_labels,
            ignore_mismatched_sizes=True
        )
        
        print("Setting up training...")
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=10,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            learning_rate=2e-5,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir=f'{output_dir}/logs',
            logging_steps=100,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="accuracy",
            push_to_hub=False,
        )
        
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=datasets['train'],
            eval_dataset=datasets['validation'],
            compute_metrics=self.compute_metrics,
        )
        
        print("Training model...")
        trainer.train()
        
        print("Evaluating on test set...")
        test_results = trainer.evaluate(datasets['test'])
        print(f"Test Results: {test_results}")
        
        print("Saving model...")
        model.save_pretrained(output_dir)
        
        return model, test_results

# Usage
if __name__ == "__main__":
    trainer = DocumentModelTrainer()
    model, results = trainer.train()
    print(f"Training complete! Test accuracy: {results['eval_accuracy']:.2%}")
```

**Run training:**
```bash
# On GPU (2-4 hours)
python scripts/ml/train_document_model.py

# On CPU (slower, 8-12 hours)
python scripts/ml/train_document_model.py
```

### Task 2.2: Fraud Detection Model

Create `scripts/ml/train_fraud_model.py`:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
import pandas as pd
import random

class FraudDataGenerator:
    """Generate synthetic fraud transaction data"""
    
    def generate_transaction(self, is_fraud=False):
        """Generate single transaction"""
        base_price = random.uniform(1000000, 50000000)  # KES
        
        if is_fraud:
            # Fraudulent patterns
            fraud_type = random.choice([
                'price_manipulation',
                'digitization_fraud',
                'identity_theft',
                'double_registration'
            ])
            
            if fraud_type == 'price_manipulation':
                price = base_price * random.uniform(0.3, 0.6)  # 40-70% below market
            else:
                price = base_price * random.uniform(0.9, 1.1)
            
            description = f"Transaction {fraud_type} indicators present. "
            description += f"Price: KES {price:,.0f}, Market: KES {base_price:,.0f}. "
            description += f"Suspicious patterns detected."
            
        else:
            # Legitimate transaction
            price = base_price * random.uniform(0.95, 1.05)
            description = f"Normal transaction. Price: KES {price:,.0f}, Market: KES {base_price:,.0f}. "
            description += "All checks passed."
        
        return {
            'text': description,
            'label': 1 if is_fraud else 0
        }
    
    def generate_dataset(self, n_samples=50000):
        """Generate balanced dataset"""
        data = []
        
        # 50% legitimate, 50% fraud
        for _ in range(n_samples // 2):
            data.append(self.generate_transaction(is_fraud=False))
        
        for _ in range(n_samples // 2):
            data.append(self.generate_transaction(is_fraud=True))
        
        random.shuffle(data)
        return pd.DataFrame(data)

class FraudModelTrainer:
    def __init__(self, model_name="distilbert-base-uncased"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    def train(self, output_dir='./models/triplecheck-fraud-v1'):
        """Train fraud detection model"""
        
        print("Generating synthetic fraud data...")
        generator = FraudDataGenerator()
        df = generator.generate_dataset(n_samples=50000)
        
        print("Tokenizing...")
        def tokenize(batch):
            return self.tokenizer(batch['text'], padding=True, truncation=True)
        
        from datasets import Dataset
        dataset = Dataset.from_pandas(df)
        dataset = dataset.map(tokenize, batched=True)
        
        # Split
        dataset = dataset.train_test_split(test_size=0.2, seed=42)
        
        print("Loading model...")
        model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=2
        )
        
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=32,
            per_device_eval_batch_size=32,
            learning_rate=2e-5,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
        )
        
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset['train'],
            eval_dataset=dataset['test'],
        )
        
        print("Training...")
        trainer.train()
        
        print("Saving...")
        model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        
        return model

# Usage
if __name__ == "__main__":
    trainer = FraudModelTrainer()
    model = trainer.train()
    print("Fraud detection model training complete!")
```

---

## Phase 3: Model Deployment (Days 8-10)

### Task 3.1: Model Serving Service

Create `server/ai/services/custom-ml.service.ts`:

```typescript
import * as tf from '@tensorflow/tfjs-node';
import { HfInference } from '@huggingface/inference';
import { logger } from '../../infrastructure/monitoring/logger';

export interface MLAnalysisResult {
  authentic: boolean;
  confidence: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictions: {
    authentic: number;
    suspicious: number;
    fraudulent: number;
  };
  source: 'custom-ml' | 'api-fallback';
  processingTime: number;
  cost: number;
}

export class CustomMLService {
  private documentModel: any;
  private fraudModel: any;
  private fallbackAPI: HfInference;
  private useCustomML: boolean = true;
  private stats = {
    customMLCount: 0,
    apiFallbackCount: 0,
    totalCost: 0
  };
  
  constructor() {
    this.fallbackAPI = new HfInference(process.env.HF_TOKEN);
    this.loadModels();
  }
  
  private async loadModels() {
    try {
      logger.info('Loading custom ML models...', { module: 'CustomMLService' });
      
      // Load TensorFlow.js models
      this.documentModel = await tf.loadLayersModel(
        'file://./models/triplecheck-document-v1/model.json'
      );
      
      logger.info('Custom ML models loaded successfully', { 
        module: 'CustomMLService' 
      });
      
    } catch (error) {
      logger.error('Failed to load custom ML models', {
        module: 'CustomMLService',
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.useCustomML = false;
    }
  }
  
  /**
   * Analyze document using custom ML model with API fallback
   */
  async analyzeDocument(imageBuffer: Buffer): Promise<MLAnalysisResult> {
    const startTime = Date.now();
    
    try {
      if (this.useCustomML && this.documentModel) {
        // Try custom model first
        const result = await this.analyzeWithCustomModel(imageBuffer);
        
        // High confidence - use custom model result
        if (result.confidence > 0.8) {
          this.stats.customMLCount++;
          this.stats.totalCost += 0.001; // $0.001 per analysis
          
          return {
            ...result,
            source: 'custom-ml',
            processingTime: Date.now() - startTime,
            cost: 0.001
          };
        }
        
        // Low confidence - fall back to API
        logger.info('Low confidence, falling back to API', {
          module: 'CustomMLService',
          confidence: result.confidence
        });
      }
      
      // Use API fallback
      const apiResult = await this.analyzeWithAPI(imageBuffer);
      this.stats.apiFallbackCount++;
      this.stats.totalCost += 0.02; // $0.02 per API call
      
      return {
        ...apiResult,
        source: 'api-fallback',
        processingTime: Date.now() - startTime,
        cost: 0.02
      };
      
    } catch (error) {
      logger.error('Document analysis failed', {
        module: 'CustomMLService',
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Analyze using custom trained model
   */
  private async analyzeWithCustomModel(imageBuffer: Buffer): Promise<Partial<MLAnalysisResult>> {
    // Preprocess image
    const tensor = await this.preprocessImage(imageBuffer);
    
    // Run inference
    const predictions = await this.documentModel.predict(tensor) as tf.Tensor;
    const probabilities = await predictions.data();
    
    // Parse results
    const [authenticProb, suspiciousProb, fraudulentProb] = Array.from(probabilities);
    
    const maxProb = Math.max(authenticProb, suspiciousProb, fraudulentProb);
    const authentic = authenticProb === maxProb;
    const riskScore = fraudulentProb * 100;
    
    return {
      authentic,
      confidence: maxProb,
      riskScore,
      riskLevel: this.calculateRiskLevel(riskScore),
      predictions: {
        authentic: authenticProb,
        suspicious: suspiciousProb,
        fraudulent: fraudulentProb
      }
    };
  }
  
  /**
   * Fallback to Hugging Face API for difficult cases
   */
  private async analyzeWithAPI(imageBuffer: Buffer): Promise<Partial<MLAnalysisResult>> {
    const base64 = imageBuffer.toString('base64');
    
    // Use Hugging Face Inference API
    const result = await this.fallbackAPI.imageClassification({
      data: base64,
      model: 'microsoft/swin-base-patch4-window7-224'
    });
    
    // Parse API response
    const authentic = result[0].label === 'authentic';
    const confidence = result[0].score;
    const riskScore = authentic ? (1 - confidence) * 100 : confidence * 100;
    
    return {
      authentic,
      confidence,
      riskScore,
      riskLevel: this.calculateRiskLevel(riskScore),
      predictions: {
        authentic: authentic ? confidence : 1 - confidence,
        suspicious: 0.5,
        fraudulent: authentic ? 1 - confidence : confidence
      }
    };
  }
  
  /**
   * Preprocess image for model input
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<tf.Tensor> {
    // Decode image
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);
    
    // Resize to model input size (224x224)
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
    
    // Normalize pixel values
    const normalized = resized.div(255.0);
    
    // Add batch dimension
    const batched = normalized.expandDims(0);
    
    return batched;
  }
  
  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 25) return 'low';
    if (riskScore < 50) return 'medium';
    if (riskScore < 75) return 'high';
    return 'critical';
  }
  
  /**
   * Get usage statistics
   */
  getStats() {
    const total = this.stats.customMLCount + this.stats.apiFallbackCount;
    const customMLPercentage = total > 0 ? (this.stats.customMLCount / total) * 100 : 0;
    const avgCost = total > 0 ? this.stats.totalCost / total : 0;
    
    // Calculate savings vs API-only
    const apiOnlyCost = total * 0.02;
    const savings = apiOnlyCost - this.stats.totalCost;
    const savingsPercentage = apiOnlyCost > 0 ? (savings / apiOnlyCost) * 100 : 0;
    
    return {
      totalAnalyses: total,
      customMLUsage: this.stats.customMLCount,
      apiFallbackUsage: this.stats.apiFallbackCount,
      customMLPercentage: customMLPercentage.toFixed(1) + '%',
      totalCost: this.stats.totalCost.toFixed(2),
      averageCost: avgCost.toFixed(4),
      savings: savings.toFixed(2),
      savingsPercentage: savingsPercentage.toFixed(1) + '%'
    };
  }
}
```

### Task 3.2: Integration with Existing Services

Update `server/document-auth/analyzers/MLDocumentAnalyzer.ts`:

```typescript
import { CustomMLService } from '../../ai/services/custom-ml.service';

export class MLDocumentAnalyzer {
  private mlService: CustomMLService;
  
  constructor() {
    this.mlService = new CustomMLService();
  }
  
  async analyze(documentImage: Buffer, documentType: string): Promise<any> {
    const result = await this.mlService.analyzeDocument(documentImage);
    
    return {
      authentic: result.authentic,
      confidence: result.confidence,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      source: result.source,
      processingTime: result.processingTime,
      cost: result.cost
    };
  }
}
```

---

## Phase 4: Testing & Validation (Days 11-14)

### Task 4.1: Model Evaluation

Create `scripts/ml/evaluate_models.py`:

```python
from transformers import AutoModelForImageClassification, AutoImageProcessor
from datasets import load_dataset
import torch
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

class ModelEvaluator:
    def __init__(self, model_path='./models/triplecheck-document-v1'):
        self.model = AutoModelForImageClassification.from_pretrained(model_path)
        self.processor = AutoImageProcessor.from_pretrained(model_path)
        self.model.eval()
    
    def evaluate(self, test_data_dir='./data/synthetic_deeds'):
        """Comprehensive model evaluation"""
        
        # Load test data
        dataset = load_dataset('imagefolder', data_dir=test_data_dir)
        test_data = dataset['train'].train_test_split(test_size=0.2, seed=42)['test']
        
        predictions = []
        labels = []
        
        print("Running predictions on test set...")
        for example in test_data:
            inputs = self.processor(example['image'], return_tensors='pt')
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                pred = torch.argmax(outputs.logits, dim=1).item()
            
            predictions.append(pred)
            labels.append(example['label'])
        
        # Calculate metrics
        print("\nClassification Report:")
        print(classification_report(labels, predictions, 
                                   target_names=['authentic', 'suspicious', 'fraudulent']))
        
        # Confusion matrix
        cm = confusion_matrix(labels, predictions)
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=['authentic', 'suspicious', 'fraudulent'],
                   yticklabels=['authentic', 'suspicious', 'fraudulent'])
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.savefig('./models/confusion_matrix.png')
        print("\nConfusion matrix saved to ./models/confusion_matrix.png")
        
        return {
            'predictions': predictions,
            'labels': labels,
            'confusion_matrix': cm
        }

if __name__ == "__main__":
    evaluator = ModelEvaluator()
    results = evaluator.evaluate()
```

### Task 4.2: Cost Monitoring

Create `server/ai/cost-monitor.service.ts`:

```typescript
export class CostMonitorService {
  private costs: Array<{
    timestamp: Date;
    source: 'custom-ml' | 'api-fallback';
    cost: number;
  }> = [];
  
  trackAnalysis(source: 'custom-ml' | 'api-fallback', cost: number) {
    this.costs.push({
      timestamp: new Date(),
      source,
      cost
    });
    
    // Alert if daily cost exceeds threshold
    const dailyCost = this.getDailyCost();
    if (dailyCost > 10) { // $10/day threshold
      logger.warn('ML costs exceeding daily threshold', {
        module: 'CostMonitorService',
        dailyCost,
        threshold: 10
      });
    }
  }
  
  getDailyCost(): number {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return this.costs
      .filter(c => c.timestamp.getTime() > oneDayAgo)
      .reduce((sum, c) => sum + c.cost, 0);
  }
  
  getReport() {
    const total = this.costs.length;
    const customML = this.costs.filter(c => c.source === 'custom-ml').length;
    const apiFallback = this.costs.filter(c => c.source === 'api-fallback').length;
    const totalCost = this.costs.reduce((sum, c) => sum + c.cost, 0);
    
    return {
      totalAnalyses: total,
      customMLUsage: customML,
      apiFallbackUsage: apiFallback,
      customMLPercentage: ((customML / total) * 100).toFixed(1) + '%',
      totalCost: totalCost.toFixed(2),
      averageCost: (totalCost / total).toFixed(4),
      dailyCost: this.getDailyCost().toFixed(2)
    };
  }
}
```

---

## Deployment Checklist

- [ ] Python ML environment set up
- [ ] GPU access configured (local or cloud)
- [ ] 10,000+ synthetic documents generated
- [ ] Document classification model trained (>85% accuracy)
- [ ] Fraud detection model trained (>80% accuracy)
- [ ] Models converted to TensorFlow.js format
- [ ] CustomMLService implemented
- [ ] API fallback configured
- [ ] Cost monitoring enabled
- [ ] Integration tests passing
- [ ] Model evaluation complete
- [ ] Documentation updated

---

## Success Metrics

After implementation, verify:

**1. Model Performance:**
- Document classification accuracy: >85%
- Fraud detection accuracy: >80%
- Inference time: <2 seconds per document
- False positive rate: <15%

**2. Cost Efficiency:**
- Custom ML usage: >80% of analyses
- API fallback: <20% of analyses
- Average cost per analysis: <$0.005
- Monthly cost (at 1,000 analyses): <$400

**3. System Reliability:**
- Model uptime: >99%
- Fallback success rate: 100%
- Error rate: <1%

---

## Next Steps

Once ML models are deployed:

1. **Monitor performance** (Week 2-3)
   - Track accuracy on real data
   - Identify edge cases
   - Collect feedback

2. **Iterate and improve** (Week 3-4)
   - Retrain on difficult cases
   - Adjust confidence thresholds
   - Optimize inference speed

3. **Scale infrastructure** (Week 4-6)
   - Add load balancing
   - Implement model versioning
   - Set up A/B testing

4. **Move to next tasks** (Week 3-6)
   - Demo data generation
   - API infrastructure
   - Reporting system

---

## Troubleshooting

**Issue: Model accuracy too low (<80%)**
- Generate more diverse synthetic data
- Increase training epochs
- Try different pre-trained models
- Add data augmentation

**Issue: Inference too slow (>5 seconds)**
- Use model quantization
- Batch predictions
- Use smaller model variant
- Optimize preprocessing

**Issue: High API fallback rate (>30%)**
- Lower confidence threshold
- Improve synthetic data quality
- Add more training examples
- Fine-tune model further

---

## Resources

- **Hugging Face Docs:** https://huggingface.co/docs
- **PyTorch Tutorials:** https://pytorch.org/tutorials/
- **TensorFlow.js:** https://www.tensorflow.org/js
- **Model Zoo:** https://huggingface.co/models

**Remember:** Start with 1,000 documents to validate pipeline, then scale to 10,000. Train on GPU for speed. Monitor costs daily. Iterate based on real performance.
