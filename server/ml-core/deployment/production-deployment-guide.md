# Production Deployment Guide for TripleCheck ML Core

## Overview

This guide provides comprehensive instructions for deploying the advanced ML system in production environments, with specific considerations for Kenyan real estate operations.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 8 cores (Intel Xeon or AMD EPYC)
- RAM: 32GB
- Storage: 500GB SSD
- Network: 1Gbps connection
- OS: Ubuntu 20.04 LTS or CentOS 8

**Recommended Requirements:**
- CPU: 16 cores with AVX2 support
- RAM: 64GB
- Storage: 1TB NVMe SSD
- Network: 10Gbps connection
- GPU: NVIDIA Tesla T4 or better (for deep learning models)

### Software Dependencies

```bash
# Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python for ML training
sudo apt-get install python3.9 python3.9-pip python3.9-venv

# TensorFlow dependencies
sudo apt-get install libhdf5-dev pkg-config

# Redis for caching
sudo apt-get install redis-server

# PostgreSQL for data storage
sudo apt-get install postgresql postgresql-contrib
```

## Deployment Architecture

### Production Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (HAProxy)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐       ┌───▼────┐       ┌───▼────┐
│ ML API │       │ ML API │       │ ML API │
│Node 1  │       │Node 2  │       │Node 3  │
└───┬────┘       └───┬────┘       └───┬────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
    ┌─────────────────▼─────────────────┐
    │          Model Registry           │
    │         (Shared Storage)          │
    └─────────────────┬─────────────────┘
                      │
    ┌─────────────────▼─────────────────┐
    │         Database Cluster          │
    │    (PostgreSQL with Replication)  │
    └───────────────────────────────────┘
```

### Service Components

1. **ML API Nodes**: Handle inference requests
2. **Model Registry**: Centralized model storage and versioning
3. **Training Pipeline**: Continuous learning and model updates
4. **Monitoring Stack**: Performance and health monitoring
5. **Data Pipeline**: Real-time data processing and feature engineering

## Step-by-Step Deployment

### 1. Environment Setup

```bash
# Create deployment directory
sudo mkdir -p /opt/triplecheck-ml
cd /opt/triplecheck-ml

# Clone repository
git clone https://github.com/your-org/triplecheck.git
cd triplecheck

# Install dependencies
npm install
npm run build
```

### 2. Database Configuration

```sql
-- Create ML-specific database
CREATE DATABASE triplecheck_ml;
CREATE USER ml_service WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE triplecheck_ml TO ml_service;

-- Create required tables
\c triplecheck_ml;

-- Model registry tables
CREATE TABLE model_registry (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Training datasets table
CREATE TABLE training_datasets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    statistics JSONB,
    quality JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback data table
CREATE TABLE model_feedback (
    id VARCHAR(255) PRIMARY KEY,
    model_id VARCHAR(255) NOT NULL,
    prediction_id VARCHAR(255) NOT NULL,
    feedback JSONB NOT NULL,
    context JSONB,
    features JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE model_performance (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### 3. Redis Configuration

```bash
# Configure Redis for ML caching
sudo nano /etc/redis/redis.conf

# Add ML-specific configuration
maxmemory 8gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis-server
```

### 4. Environment Variables

```bash
# Create production environment file
cat > /opt/triplecheck-ml/.env.production << EOF
# Database Configuration
DATABASE_URL=postgresql://ml_service:secure_password_here@localhost:5432/triplecheck_ml

# Redis Configuration
REDIS_URL=redis://localhost:6379

# ML Service Configuration
ML_MODEL_REGISTRY_PATH=/opt/triplecheck-ml/models
ML_ENABLE_GPU=true
ML_MAX_CONCURRENT_PREDICTIONS=100
ML_CACHE_TTL=3600

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Security Configuration
ML_API_KEY=your_secure_api_key_here
JWT_SECRET=your_jwt_secret_here

# Kenya-specific Configuration
KENYA_MARKET_DATA_API=https://api.kenyanmarketdata.com
GOVERNMENT_API_ENDPOINT=https://api.lands.go.ke

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
EOF
```

### 5. Model Deployment

```bash
# Create model storage directory
sudo mkdir -p /opt/triplecheck-ml/models
sudo chown -R $USER:$USER /opt/triplecheck-ml/models

# Download pre-trained models
cd /opt/triplecheck-ml/models

# Fraud detection models
wget https://releases.triplecheck.com/models/fraud-detection-v2.1.tar.gz
tar -xzf fraud-detection-v2.1.tar.gz

# Property valuation models
wget https://releases.triplecheck.com/models/property-valuation-v1.8.tar.gz
tar -xzf property-valuation-v1.8.tar.gz

# Trust analysis models
wget https://releases.triplecheck.com/models/trust-analysis-v1.5.tar.gz
tar -xzf trust-analysis-v1.5.tar.gz

# Document authentication models
wget https://releases.triplecheck.com/models/document-auth-v2.0.tar.gz
tar -xzf document-auth-v2.0.tar.gz
```

### 6. Service Configuration

```bash
# Create systemd service file
sudo cat > /etc/systemd/system/triplecheck-ml.service << EOF
[Unit]
Description=TripleCheck ML Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=triplecheck
WorkingDirectory=/opt/triplecheck-ml
Environment=NODE_ENV=production
EnvironmentFile=/opt/triplecheck-ml/.env.production
ExecStart=/usr/bin/node dist/server/ml-core/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=triplecheck-ml

# Resource limits
LimitNOFILE=65536
LimitNPROC=32768

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable triplecheck-ml
sudo systemctl start triplecheck-ml
```

### 7. Load Balancer Configuration

```bash
# Install HAProxy
sudo apt-get install haproxy

# Configure HAProxy
sudo cat > /etc/haproxy/haproxy.cfg << EOF
global
    daemon
    maxconn 4096
    log stdout local0

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog

frontend ml_api_frontend
    bind *:8080
    default_backend ml_api_backend

backend ml_api_backend
    balance roundrobin
    option httpchk GET /health
    server ml_node1 127.0.0.1:3001 check
    server ml_node2 127.0.0.1:3002 check
    server ml_node3 127.0.0.1:3003 check

frontend ml_admin_frontend
    bind *:8081
    default_backend ml_admin_backend

backend ml_admin_backend
    balance roundrobin
    server ml_admin1 127.0.0.1:3004 check
EOF

# Start HAProxy
sudo systemctl enable haproxy
sudo systemctl start haproxy
```

### 8. Monitoring Setup

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar -xzf prometheus-2.40.0.linux-amd64.tar.gz
sudo mv prometheus-2.40.0.linux-amd64 /opt/prometheus

# Configure Prometheus
cat > /opt/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'triplecheck-ml'
    static_configs:
      - targets: ['localhost:3001', 'localhost:3002', 'localhost:3003']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
EOF

# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Start monitoring services
sudo systemctl enable prometheus
sudo systemctl start prometheus
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

### 9. Security Configuration

```bash
# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8080/tcp  # ML API
sudo ufw allow 8081/tcp  # ML Admin
sudo ufw allow 3000/tcp  # Grafana
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw enable

# SSL/TLS Configuration
sudo apt-get install certbot
sudo certbot certonly --standalone -d ml-api.triplecheck.com

# Configure nginx for SSL termination
sudo apt-get install nginx
sudo cat > /etc/nginx/sites-available/triplecheck-ml << EOF
server {
    listen 443 ssl http2;
    server_name ml-api.triplecheck.com;

    ssl_certificate /etc/letsencrypt/live/ml-api.triplecheck.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ml-api.triplecheck.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name ml-api.triplecheck.com;
    return 301 https://\$server_name\$request_uri;
}
EOF

sudo ln -s /etc/nginx/sites-available/triplecheck-ml /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Performance Optimization

### 1. Model Optimization

```bash
# Optimize TensorFlow models
python3 << EOF
import tensorflow as tf

# Load and optimize models
for model_path in ['fraud-detection', 'property-valuation', 'trust-analysis']:
    model = tf.keras.models.load_model(f'/opt/triplecheck-ml/models/{model_path}')
    
    # Convert to TensorFlow Lite for faster inference
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    
    with open(f'/opt/triplecheck-ml/models/{model_path}/model.tflite', 'wb') as f:
        f.write(tflite_model)
EOF
```

### 2. Caching Strategy

```javascript
// Redis caching configuration
const cacheConfig = {
  // Model predictions cache
  predictions: {
    ttl: 3600, // 1 hour
    maxSize: 10000
  },
  
  // Feature cache
  features: {
    ttl: 1800, // 30 minutes
    maxSize: 50000
  },
  
  // Market data cache
  marketData: {
    ttl: 7200, // 2 hours
    maxSize: 1000
  }
};
```

### 3. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_model_registry_status ON model_registry(status);
CREATE INDEX idx_model_registry_type ON model_registry(type);
CREATE INDEX idx_feedback_model_id ON model_feedback(model_id);
CREATE INDEX idx_feedback_created_at ON model_feedback(created_at);
CREATE INDEX idx_performance_model_timestamp ON model_performance(model_id, timestamp);

-- Partition large tables
CREATE TABLE model_feedback_2024 PARTITION OF model_feedback
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

## Monitoring and Alerting

### 1. Key Metrics to Monitor

- **Model Performance**: Accuracy, latency, throughput
- **System Resources**: CPU, memory, disk usage
- **API Metrics**: Request rate, error rate, response time
- **Business Metrics**: Fraud detection rate, valuation accuracy

### 2. Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: ml_service_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: ModelLatencyHigh
        expr: histogram_quantile(0.95, rate(model_prediction_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Model prediction latency is high"
          
      - alert: ModelAccuracyDrop
        expr: model_accuracy < 0.8
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Model accuracy has dropped below threshold"
```

## Backup and Disaster Recovery

### 1. Database Backup

```bash
# Create backup script
cat > /opt/triplecheck-ml/scripts/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/triplecheck-ml/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U ml_service triplecheck_ml > $BACKUP_DIR/db_backup_$DATE.sql

# Backup models
tar -czf $BACKUP_DIR/models_backup_$DATE.tar.gz /opt/triplecheck-ml/models

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/triplecheck-ml/scripts/backup.sh

# Schedule daily backups
echo "0 2 * * * /opt/triplecheck-ml/scripts/backup.sh" | crontab -
```

### 2. Model Versioning

```bash
# Model versioning script
cat > /opt/triplecheck-ml/scripts/model-version.sh << EOF
#!/bin/bash
MODEL_NAME=$1
VERSION=$2

# Create versioned model directory
mkdir -p /opt/triplecheck-ml/models/$MODEL_NAME/versions/$VERSION

# Copy current model to versioned directory
cp -r /opt/triplecheck-ml/models/$MODEL_NAME/current/* /opt/triplecheck-ml/models/$MODEL_NAME/versions/$VERSION/

# Update model registry
psql -h localhost -U ml_service -d triplecheck_ml -c "
INSERT INTO model_registry (id, name, version, type, status, created_at) 
VALUES ('${MODEL_NAME}_${VERSION}', '$MODEL_NAME', '$VERSION', 'production', 'active', NOW());"
EOF
```

## Scaling Considerations

### 1. Horizontal Scaling

```bash
# Docker configuration for scaling
cat > /opt/triplecheck-ml/docker-compose.yml << EOF
version: '3.8'
services:
  ml-api:
    image: triplecheck/ml-api:latest
    ports:
      - "3001-3010:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./models:/app/models
    deploy:
      replicas: 5
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: triplecheck_ml
      POSTGRES_USER: ml_service
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF
```

### 2. Auto-scaling Configuration

```bash
# Kubernetes auto-scaling (if using K8s)
cat > /opt/triplecheck-ml/k8s/hpa.yaml << EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF
```

## Troubleshooting

### Common Issues and Solutions

1. **High Memory Usage**
   ```bash
   # Monitor memory usage
   free -h
   ps aux --sort=-%mem | head
   
   # Optimize Node.js memory
   export NODE_OPTIONS="--max-old-space-size=8192"
   ```

2. **Model Loading Failures**
   ```bash
   # Check model file integrity
   find /opt/triplecheck-ml/models -name "*.json" -exec json_verify {} \;
   
   # Verify TensorFlow installation
   python3 -c "import tensorflow as tf; print(tf.__version__)"
   ```

3. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U ml_service -d triplecheck_ml -c "SELECT 1;"
   ```

4. **Performance Issues**
   ```bash
   # Monitor system resources
   htop
   iotop
   
   # Check API response times
   curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8080/health"
   ```

## Maintenance

### Regular Maintenance Tasks

1. **Weekly Tasks**
   - Review system logs
   - Check model performance metrics
   - Update security patches

2. **Monthly Tasks**
   - Retrain models with new data
   - Review and optimize database queries
   - Update monitoring dashboards

3. **Quarterly Tasks**
   - Conduct security audit
   - Review and update disaster recovery procedures
   - Performance benchmarking

### Health Checks

```bash
# Create health check script
cat > /opt/triplecheck-ml/scripts/health-check.sh << EOF
#!/bin/bash

# Check API health
curl -f http://localhost:8080/health || exit 1

# Check database connection
psql -h localhost -U ml_service -d triplecheck_ml -c "SELECT 1;" || exit 1

# Check Redis connection
redis-cli ping || exit 1

# Check model files
ls /opt/triplecheck-ml/models/*/model.json || exit 1

echo "All health checks passed"
EOF
```

This production deployment guide provides a comprehensive foundation for deploying the TripleCheck ML system in a production environment with proper monitoring, security, and scalability considerations.