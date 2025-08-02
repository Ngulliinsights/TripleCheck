# Request Deduplication System - Operations Quick Start Guide

## 🚀 Getting Started

This guide helps operations teams quickly understand and manage the Request Deduplication System in production.

## 📊 Monitoring Dashboard

### Accessing the Dashboard
```bash
# Local development
http://localhost:3000/api/monitoring/dashboard

# Production
https://triplecheck.co.ke/api/monitoring/dashboard
```

### Key Metrics to Monitor
- **Cache Hit Rate**: Should be >70% (target: >80%)
- **Memory Usage**: Should be <100MB (alert at 80MB)
- **Response Time**: Should be <100ms for cache hits
- **Error Rate**: Should be <0.1% (alert at 0.5%)
- **Deduplication Savings**: Tracks duplicate requests prevented

## 🔧 Common Operations

### Check System Health
```bash
# Health check endpoint
curl https://triplecheck.co.ke/health

# Detailed system status
curl https://triplecheck.co.ke/api/monitoring/stats
```

### View Performance Metrics
```bash
# Current metrics
curl https://triplecheck.co.ke/api/monitoring/current

# Historical metrics (last 24 hours)
curl https://triplecheck.co.ke/api/monitoring/history?hours=24

# Performance report
curl https://triplecheck.co.ke/api/monitoring/report
```

### Clear Cache (Emergency)
```bash
# Clear all cache
curl -X POST https://triplecheck.co.ke/api/cache/clear

# Clear specific pattern
curl -X POST https://triplecheck.co.ke/api/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"pattern": "user-*"}'
```

## 🚨 Alert Response Procedures

### High Memory Usage Alert
**Trigger**: Memory usage >80MB for >5 minutes

**Response Steps**:
1. Check current memory usage: `curl /api/monitoring/stats`
2. Review memory trends in dashboard
3. If >90%, clear cache: `curl -X POST /api/cache/clear`
4. Monitor for 10 minutes to ensure memory decreases
5. If issue persists, restart application

### Low Cache Hit Rate Alert
**Trigger**: Hit rate <70% for >10 minutes

**Response Steps**:
1. Check current hit rate: `curl /api/monitoring/stats`
2. Review recent cache clear operations in logs
3. Check if TTL settings are appropriate
4. Review application logs for errors
5. Consider increasing TTL if appropriate

### High Error Rate Alert
**Trigger**: Error rate >0.5% for >5 minutes

**Response Steps**:
1. Check application logs for errors
2. Verify Redis connectivity: `redis-cli ping`
3. Check system resources (CPU, memory, disk)
4. Review recent deployments or changes
5. If Redis is down, system will fallback to memory-only

### Response Time Degradation Alert
**Trigger**: Average response time >500ms for >5 minutes

**Response Steps**:
1. Check current performance metrics
2. Verify cache hit rate (low hit rate = slower responses)
3. Check system load and resources
4. Review database performance
5. Consider clearing cache if corrupted

## 🔄 Routine Maintenance

### Daily Checks
- [ ] Review dashboard for any anomalies
- [ ] Check error logs for any issues
- [ ] Verify backup systems are working
- [ ] Monitor resource usage trends

### Weekly Tasks
- [ ] Generate performance report
- [ ] Review optimization recommendations
- [ ] Check system capacity and scaling needs
- [ ] Update documentation if needed

### Monthly Tasks
- [ ] Comprehensive performance analysis
- [ ] Review and update alert thresholds
- [ ] Capacity planning assessment
- [ ] Security review and updates

## 📝 Log Analysis

### Important Log Locations
```bash
# Application logs
tail -f /var/log/triplecheck/app.log

# Request deduplication logs
grep "RequestDeduplicator" /var/log/triplecheck/app.log

# Performance monitoring logs
grep "CachePerformanceMonitor" /var/log/triplecheck/app.log

# Error logs
grep "ERROR" /var/log/triplecheck/app.log | tail -20
```

### Key Log Messages
- `Cache hit for key: [key]` - Successful cache retrieval
- `Cache miss for key: [key]` - Cache miss, operation executed
- `Redis cache lookup failed` - Redis connection issue (fallback to memory)
- `Performance Alert: [message]` - Performance threshold exceeded
- `Optimization applied: [description]` - Automatic optimization applied

## 🛠️ Troubleshooting

### System Not Responding
1. Check if application is running: `ps aux | grep node`
2. Check system resources: `top`, `free -h`, `df -h`
3. Check network connectivity: `ping redis-server`
4. Review recent logs: `tail -100 /var/log/triplecheck/app.log`
5. Restart application if necessary

### Cache Not Working
1. Verify Redis connection: `redis-cli ping`
2. Check Redis memory usage: `redis-cli info memory`
3. Review cache configuration in environment variables
4. Check for cache clear operations in logs
5. Verify cache keys are being generated correctly

### Performance Issues
1. Check cache hit rate (should be >70%)
2. Review memory usage (should be <100MB)
3. Check for memory leaks in trends
4. Verify cleanup processes are running
5. Consider applying optimization recommendations

### High Error Rate
1. Check application error logs
2. Verify external service connectivity (database, Redis)
3. Check for recent code deployments
4. Review system resource usage
5. Check for any configuration changes

## 📞 Escalation Procedures

### Level 1: Operations Team
- Monitor alerts and basic troubleshooting
- Apply standard procedures from this guide
- Clear cache if necessary
- Restart services if required

### Level 2: Development Team
- Complex performance issues
- Code-related problems
- Configuration changes needed
- Optimization recommendations

### Level 3: Architecture Team
- System design issues
- Scaling decisions
- Infrastructure changes
- Major performance problems

## 🔐 Security Considerations

### Access Control
- Dashboard access requires authentication
- Cache clear operations require admin privileges
- Log access restricted to operations team
- Configuration changes require approval

### Data Protection
- Cache contains no sensitive user data
- All communications encrypted in transit
- Redis password authentication enabled
- Regular security updates applied

## 📈 Performance Optimization

### Automatic Optimizations
The system automatically generates optimization recommendations:
- TTL adjustments based on usage patterns
- Memory cleanup optimizations
- Cache key pattern improvements
- Performance threshold adjustments

### Manual Optimizations
Operations team can:
- Adjust cache TTL values
- Clear specific cache patterns
- Modify alert thresholds
- Apply recommended optimizations

## 🆘 Emergency Procedures

### Complete System Failure
1. Check system status: `systemctl status triplecheck`
2. Review system logs: `journalctl -u triplecheck -f`
3. Restart application: `systemctl restart triplecheck`
4. Verify health: `curl /health`
5. Notify development team if restart fails

### Redis Failure
1. System automatically falls back to memory-only cache
2. Performance may be reduced but system remains functional
3. Fix Redis connection as soon as possible
4. Monitor memory usage closely during Redis outage
5. Clear memory cache after Redis recovery

### Database Issues
1. Request deduplication continues to work
2. New requests may fail but cached requests succeed
3. Monitor cache hit rate (should increase during DB issues)
4. Coordinate with database team for resolution
5. Clear cache after database recovery if needed

---

## 📚 Additional Resources

- **API Documentation**: `/docs/api/request-deduplication.md`
- **Deployment Guide**: `/docs/deployment/production-checklist.md`
- **Architecture Overview**: `/docs/architecture/system-design.md`
- **Troubleshooting Guide**: `/docs/troubleshooting/common-issues.md`

## 📞 Contact Information

- **Operations Team**: ops@triplecheck.co.ke
- **Development Team**: dev@triplecheck.co.ke
- **Emergency Hotline**: +254-XXX-XXXX
- **Slack Channel**: #triplecheck-ops