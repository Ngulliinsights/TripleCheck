#!/usr/bin/env tsx
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprehensiveMonitoringSetup = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var cleanup_redundancies_1 = require("../cleanup-redundancies");
var ComprehensiveMonitoringSetup = /** @class */ (function () {
    function ComprehensiveMonitoringSetup(environment) {
        var _a, _b;
        this.config = {
            environment: environment,
            enablePrometheus: true,
            enableGrafana: true,
            enableAlerting: true,
            enablePagerDuty: !!process.env.PAGERDUTY_INTEGRATION_KEY,
            enableSlack: !!process.env.SLACK_WEBHOOK_URL,
            enableEmail: !!process.env.SMTP_HOST,
            enableSMS: !!process.env.TWILIO_ACCOUNT_SID,
            databaseName: process.env.POSTGRES_DB || 'triplecheck',
            grafanaPassword: process.env.GRAFANA_PASSWORD || 'admin',
            slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
            pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
            emailConfig: process.env.SMTP_HOST ? {
                smtpHost: process.env.SMTP_HOST,
                smtpPort: parseInt(process.env.SMTP_PORT || '587'),
                smtpUser: process.env.SMTP_USER || '',
                smtpPassword: process.env.SMTP_PASSWORD || '',
                fromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@triplecheck.com',
                toEmails: ((_a = process.env.ALERT_TO_EMAILS) === null || _a === void 0 ? void 0 : _a.split(',')) || []
            } : undefined,
            smsConfig: process.env.TWILIO_ACCOUNT_SID ? {
                twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
                twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
                twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',
                recipients: ((_b = process.env.ONCALL_PHONES) === null || _b === void 0 ? void 0 : _b.split(',')) || []
            } : undefined
        };
    }
    ComprehensiveMonitoringSetup.prototype.setup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDE80 Setting up comprehensive monitoring for ".concat(this.config.environment, " environment"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 12, , 13]);
                        return [4 /*yield*/, this.createDirectoryStructure()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.generateConfigurations()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.setupPrometheus()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.setupGrafana()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.setupAlerting()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.setupDashboards()];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.generateDockerCompose()];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.startServices()];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, this.validateSetup()];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, this.generateDocumentation()];
                    case 11:
                        _a.sent();
                        console.log('✅ Comprehensive monitoring setup completed successfully');
                        this.printAccessInformation();
                        return [3 /*break*/, 13];
                    case 12:
                        error_1 = _a.sent();
                        console.error('❌ Comprehensive monitoring setup failed:', error_1);
                        throw error_1;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.createDirectoryStructure = function () {
        return __awaiter(this, void 0, void 0, function () {
            var directories;
            return __generator(this, function (_a) {
                console.log('📁 Creating comprehensive monitoring directory structure...');
                directories = [
                    'monitoring/prometheus/data',
                    'monitoring/prometheus/rules',
                    'monitoring/grafana/data',
                    'monitoring/grafana/provisioning/dashboards/database',
                    'monitoring/grafana/provisioning/dashboards/business',
                    'monitoring/grafana/provisioning/dashboards/infrastructure',
                    'monitoring/grafana/provisioning/datasources',
                    'monitoring/alertmanager/data',
                    'monitoring/alertmanager/templates',
                    'monitoring/exporters/postgres',
                    'monitoring/exporters/redis',
                    'monitoring/exporters/node',
                    'monitoring/logs',
                    'monitoring/backups',
                    'monitoring/scripts',
                    'monitoring/docs'
                ];
                directories.forEach(function (dir) {
                    var fullPath = cleanup_redundancies_1.default.join(process.cwd(), dir);
                    if (!(0, fs_1.existsSync)(fullPath)) {
                        (0, fs_1.mkdirSync)(fullPath, { recursive: true });
                        console.log("  Created: ".concat(dir));
                    }
                });
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.generateConfigurations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var prometheusConfig, alertRulesPath, grafanaDataSource, dashboardProvisioning, alertmanagerConfig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('⚙️ Generating comprehensive monitoring configurations...');
                        prometheusConfig = this.generatePrometheusConfig();
                        (0, fs_1.writeFileSync)('monitoring/prometheus/prometheus.yml', prometheusConfig);
                        alertRulesPath = cleanup_redundancies_1.default.join(process.cwd(), 'scripts/deployment/enhanced-alert-rules.yml');
                        if ((0, fs_1.existsSync)(alertRulesPath)) {
                            (0, fs_1.copyFileSync)(alertRulesPath, 'monitoring/prometheus/rules/enhanced-alert-rules.yml');
                        }
                        grafanaDataSource = this.generateGrafanaDataSourceConfig();
                        (0, fs_1.writeFileSync)('monitoring/grafana/provisioning/datasources/prometheus.yml', grafanaDataSource);
                        dashboardProvisioning = this.generateDashboardProvisioningConfig();
                        (0, fs_1.writeFileSync)('monitoring/grafana/provisioning/dashboards/dashboard.yml', dashboardProvisioning);
                        alertmanagerConfig = this.generateAlertmanagerConfig();
                        (0, fs_1.writeFileSync)('monitoring/alertmanager/alertmanager.yml', alertmanagerConfig);
                        // Copy dashboard files
                        return [4 /*yield*/, this.copyDashboards()];
                    case 1:
                        // Copy dashboard files
                        _a.sent();
                        console.log('  Generated all configuration files');
                        return [2 /*return*/];
                }
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.generatePrometheusConfig = function () {
        var targets = this.getServiceTargets();
        return "\nglobal:\n  scrape_interval: 15s\n  evaluation_interval: 15s\n  external_labels:\n    cluster: 'triplecheck-".concat(this.config.environment, "'\n    environment: '").concat(this.config.environment, "'\n\nrule_files:\n  - \"rules/*.yml\"\n\nalerting:\n  alertmanagers:\n    - static_configs:\n        - targets:\n          - alertmanager:9093\n\nscrape_configs:\n  - job_name: 'triplecheck-services'\n    static_configs:\n      - targets: ").concat(JSON.stringify(targets.services), "\n    metrics_path: '/metrics/prometheus'\n    scrape_interval: 30s\n    scrape_timeout: 10s\n    relabel_configs:\n      - source_labels: [__address__]\n        target_label: instance\n      - source_labels: [__address__]\n        regex: '([^:]+):(\\d+)'\n        target_label: service\n        replacement: '${1}'\n\n  - job_name: 'node-exporter'\n    static_configs:\n      - targets: ").concat(JSON.stringify(targets.nodeExporter), "\n    scrape_interval: 15s\n\n  - job_name: 'postgres-exporter'\n    static_configs:\n      - targets: ").concat(JSON.stringify(targets.postgresExporter), "\n    scrape_interval: 30s\n\n  - job_name: 'redis-exporter'\n    static_configs:\n      - targets: ").concat(JSON.stringify(targets.redisExporter), "\n    scrape_interval: 30s\n\n  - job_name: 'prometheus'\n    static_configs:\n      - targets: ['localhost:9090']\n    scrape_interval: 30s\n\n  - job_name: 'grafana'\n    static_configs:\n      - targets: ['grafana:3000']\n    scrape_interval: 60s\n    metrics_path: '/metrics'\n\n  - job_name: 'alertmanager'\n    static_configs:\n      - targets: ['alertmanager:9093']\n    scrape_interval: 30s\n").trim();
    };
    ComprehensiveMonitoringSetup.prototype.getServiceTargets = function () {
        var isProduction = this.config.environment === 'production';
        return {
            services: isProduction ? [
                'triplecheck-api:3001',
                'land-verification-service:3002',
                'fraud-detection-service:3003',
                'document-auth-service:3004'
            ] : [
                'localhost:3001',
                'localhost:3002',
                'localhost:3003',
                'localhost:3004'
            ],
            nodeExporter: ['node-exporter:9100'],
            postgresExporter: ['postgres-exporter:9187'],
            redisExporter: ['redis-exporter:9121']
        };
    };
    ComprehensiveMonitoringSetup.prototype.generateGrafanaDataSourceConfig = function () {
        return "\napiVersion: 1\n\ndatasources:\n  - name: Prometheus\n    type: prometheus\n    access: proxy\n    url: http://prometheus:9090\n    isDefault: true\n    editable: true\n    jsonData:\n      timeInterval: \"15s\"\n      queryTimeout: \"60s\"\n      httpMethod: \"POST\"\n    secureJsonData: {}\n\n  - name: Alertmanager\n    type: alertmanager\n    access: proxy\n    url: http://alertmanager:9093\n    editable: true\n    jsonData:\n      implementation: \"prometheus\"\n".trim();
    };
    ComprehensiveMonitoringSetup.prototype.generateDashboardProvisioningConfig = function () {
        return "\napiVersion: 1\n\nproviders:\n  - name: 'triplecheck-database'\n    orgId: 1\n    folder: 'Database'\n    type: file\n    disableDeletion: false\n    updateIntervalSeconds: 10\n    allowUiUpdates: true\n    options:\n      path: /etc/grafana/provisioning/dashboards/database\n\n  - name: 'triplecheck-business'\n    orgId: 1\n    folder: 'Business Metrics'\n    type: file\n    disableDeletion: false\n    updateIntervalSeconds: 10\n    allowUiUpdates: true\n    options:\n      path: /etc/grafana/provisioning/dashboards/business\n\n  - name: 'triplecheck-infrastructure'\n    orgId: 1\n    folder: 'Infrastructure'\n    type: file\n    disableDeletion: false\n    updateIntervalSeconds: 10\n    allowUiUpdates: true\n    options:\n      path: /etc/grafana/provisioning/dashboards/infrastructure\n".trim();
    };
    ComprehensiveMonitoringSetup.prototype.generateAlertmanagerConfig = function () {
        var _a, _b, _c;
        var routes = [];
        var receivers = [];
        // Default receiver
        receivers.push({
            name: 'default',
            webhook_configs: [{
                    url: 'http://triplecheck-api:3001/metrics/alerts/webhook',
                    send_resolved: true
                }]
        });
        // Slack receiver
        if (this.config.enableSlack && this.config.slackWebhookUrl) {
            receivers.push({
                name: 'slack-critical',
                slack_configs: [{
                        api_url: this.config.slackWebhookUrl,
                        channel: '#alerts-critical',
                        title: 'TripleCheck Critical Alert',
                        text: '{{ range .Alerts }}*{{ .Annotations.summary }}*\n{{ .Annotations.description }}\n*Severity:* {{ .Labels.severity }}\n*Team:* {{ .Labels.team }}{{ end }}',
                        send_resolved: true
                    }]
            });
            receivers.push({
                name: 'slack-general',
                slack_configs: [{
                        api_url: this.config.slackWebhookUrl,
                        channel: '#alerts',
                        title: 'TripleCheck Alert',
                        text: '{{ range .Alerts }}*{{ .Annotations.summary }}*\n{{ .Annotations.description }}{{ end }}',
                        send_resolved: true
                    }]
            });
            routes.push({
                match: { severity: 'critical' },
                receiver: 'slack-critical',
                group_wait: '10s',
                group_interval: '5m',
                repeat_interval: '12h'
            });
            routes.push({
                match: { severity: 'high' },
                receiver: 'slack-general',
                group_wait: '30s',
                group_interval: '10m',
                repeat_interval: '24h'
            });
        }
        // PagerDuty receiver
        if (this.config.enablePagerDuty && this.config.pagerDutyIntegrationKey) {
            receivers.push({
                name: 'pagerduty-critical',
                pagerduty_configs: [{
                        routing_key: this.config.pagerDutyIntegrationKey,
                        description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}',
                        details: {
                            environment: this.config.environment,
                            service: '{{ .Labels.service }}',
                            team: '{{ .Labels.team }}',
                            runbook: '{{ .Annotations.runbook_url }}'
                        }
                    }]
            });
            routes.push({
                match: { severity: 'critical', escalation_level: '1' },
                receiver: 'pagerduty-critical',
                group_wait: '0s',
                group_interval: '1m',
                repeat_interval: '5m'
            });
        }
        // Email receiver
        if (this.config.enableEmail && this.config.emailConfig) {
            receivers.push({
                name: 'email-alerts',
                email_configs: [{
                        to: this.config.emailConfig.toEmails.join(','),
                        from: this.config.emailConfig.fromEmail,
                        smarthost: "".concat(this.config.emailConfig.smtpHost, ":").concat(this.config.emailConfig.smtpPort),
                        auth_username: this.config.emailConfig.smtpUser,
                        auth_password: this.config.emailConfig.smtpPassword,
                        subject: '[{{ .Status | toUpper }}] TripleCheck Alert: {{ .GroupLabels.alertname }}',
                        body: "\n{{ range .Alerts }}\nAlert: {{ .Annotations.summary }}\nDescription: {{ .Annotations.description }}\nSeverity: {{ .Labels.severity }}\nTeam: {{ .Labels.team }}\nStarted: {{ .StartsAt }}\n{{ if .Annotations.runbook_url }}Runbook: {{ .Annotations.runbook_url }}{{ end }}\n{{ end }}\n",
                        html: "\n<h2>TripleCheck Alert</h2>\n{{ range .Alerts }}\n<div style=\"border: 1px solid #ddd; padding: 10px; margin: 10px 0;\">\n  <h3>{{ .Annotations.summary }}</h3>\n  <p><strong>Description:</strong> {{ .Annotations.description }}</p>\n  <p><strong>Severity:</strong> {{ .Labels.severity }}</p>\n  <p><strong>Team:</strong> {{ .Labels.team }}</p>\n  <p><strong>Started:</strong> {{ .StartsAt }}</p>\n  {{ if .Annotations.runbook_url }}<p><strong>Runbook:</strong> <a href=\"{{ .Annotations.runbook_url }}\">{{ .Annotations.runbook_url }}</a></p>{{ end }}\n</div>\n{{ end }}\n"
                    }]
            });
            routes.push({
                match: { severity: 'high' },
                receiver: 'email-alerts',
                group_wait: '5m',
                group_interval: '30m',
                repeat_interval: '24h'
            });
        }
        return "\nglobal:\n  smtp_smarthost: '".concat(((_a = this.config.emailConfig) === null || _a === void 0 ? void 0 : _a.smtpHost) || 'localhost', ":").concat(((_b = this.config.emailConfig) === null || _b === void 0 ? void 0 : _b.smtpPort) || 587, "'\n  smtp_from: '").concat(((_c = this.config.emailConfig) === null || _c === void 0 ? void 0 : _c.fromEmail) || 'alerts@triplecheck.com', "'\n  resolve_timeout: 5m\n\ntemplates:\n  - '/etc/alertmanager/templates/*.tmpl'\n\nroute:\n  group_by: ['alertname', 'cluster', 'service']\n  group_wait: 30s\n  group_interval: 5m\n  repeat_interval: 12h\n  receiver: 'default'\n  routes: ").concat(JSON.stringify(routes, null, 4), "\n\nreceivers: ").concat(JSON.stringify(receivers, null, 2), "\n\ninhibit_rules:\n  - source_match:\n      severity: 'critical'\n    target_match:\n      severity: 'high'\n    equal: ['alertname', 'cluster', 'service']\n  \n  - source_match:\n      severity: 'high'\n    target_match:\n      severity: 'medium'\n    equal: ['alertname', 'cluster', 'service']\n").trim();
    };
    ComprehensiveMonitoringSetup.prototype.copyDashboards = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dashboardSources, _i, dashboardSources_1, dashboard, srcPath, filename, destPath;
            return __generator(this, function (_a) {
                dashboardSources = [
                    { src: 'scripts/deployment/grafana/dashboards/database-health.json', dest: 'monitoring/grafana/provisioning/dashboards/database/' },
                    { src: 'scripts/deployment/grafana/dashboards/query-performance.json', dest: 'monitoring/grafana/provisioning/dashboards/database/' },
                    { src: 'scripts/deployment/grafana/dashboards/business-metrics.json', dest: 'monitoring/grafana/provisioning/dashboards/business/' }
                ];
                for (_i = 0, dashboardSources_1 = dashboardSources; _i < dashboardSources_1.length; _i++) {
                    dashboard = dashboardSources_1[_i];
                    srcPath = cleanup_redundancies_1.default.join(process.cwd(), dashboard.src);
                    if ((0, fs_1.existsSync)(srcPath)) {
                        filename = cleanup_redundancies_1.default.basename(dashboard.src);
                        destPath = cleanup_redundancies_1.default.join(process.cwd(), dashboard.dest, filename);
                        (0, fs_1.copyFileSync)(srcPath, destPath);
                        console.log("  Copied dashboard: ".concat(filename));
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.setupPrometheus = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('📊 Setting up Prometheus...');
                // Prometheus setup is handled by configuration files
                console.log('  Prometheus configuration ready');
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.setupGrafana = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('📈 Setting up Grafana...');
                // Grafana setup is handled by configuration files and Docker
                console.log('  Grafana configuration ready');
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.setupAlerting = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🚨 Setting up comprehensive alerting...');
                // Alerting setup is handled by Alertmanager configuration
                console.log('  Alerting configuration ready');
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.setupDashboards = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('📊 Setting up Grafana dashboards...');
                // Dashboards are provisioned automatically by Grafana
                console.log('  Dashboard provisioning configured');
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.generateDockerCompose = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dockerCompose;
            return __generator(this, function (_a) {
                console.log('🐳 Generating Docker Compose configuration...');
                dockerCompose = this.generateDockerComposeConfig();
                (0, fs_1.writeFileSync)('monitoring/docker-compose.yml', dockerCompose);
                console.log('  Docker Compose configuration generated');
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.generateDockerComposeConfig = function () {
        return "\nversion: '3.8'\n\nnetworks:\n  monitoring:\n    driver: bridge\n  triplecheck:\n    external: true\n\nvolumes:\n  prometheus_data:\n  grafana_data:\n  alertmanager_data:\n\nservices:\n  prometheus:\n    image: prom/prometheus:v2.45.0\n    container_name: prometheus\n    ports:\n      - \"9090:9090\"\n    volumes:\n      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro\n      - ./prometheus/rules:/etc/prometheus/rules:ro\n      - prometheus_data:/prometheus\n    command:\n      - '--config.file=/etc/prometheus/prometheus.yml'\n      - '--storage.tsdb.path=/prometheus'\n      - '--web.console.libraries=/etc/prometheus/console_libraries'\n      - '--web.console.templates=/etc/prometheus/consoles'\n      - '--storage.tsdb.retention.time=30d'\n      - '--web.enable-lifecycle'\n      - '--web.enable-admin-api'\n      - '--web.external-url=http://localhost:9090'\n    restart: unless-stopped\n    networks:\n      - monitoring\n      - triplecheck\n    healthcheck:\n      test: [\"CMD\", \"wget\", \"--quiet\", \"--tries=1\", \"--spider\", \"http://localhost:9090/-/healthy\"]\n      interval: 30s\n      timeout: 10s\n      retries: 3\n\n  grafana:\n    image: grafana/grafana:10.0.0\n    container_name: grafana\n    ports:\n      - \"3000:3000\"\n    environment:\n      - GF_SECURITY_ADMIN_PASSWORD=".concat(this.config.grafanaPassword, "\n      - GF_USERS_ALLOW_SIGN_UP=false\n      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel\n      - GF_FEATURE_TOGGLES_ENABLE=ngalert\n    volumes:\n      - grafana_data:/var/lib/grafana\n      - ./grafana/provisioning:/etc/grafana/provisioning:ro\n    restart: unless-stopped\n    networks:\n      - monitoring\n    depends_on:\n      - prometheus\n    healthcheck:\n      test: [\"CMD-SHELL\", \"curl -f http://localhost:3000/api/health || exit 1\"]\n      interval: 30s\n      timeout: 10s\n      retries: 3\n\n  alertmanager:\n    image: prom/alertmanager:v0.25.0\n    container_name: alertmanager\n    ports:\n      - \"9093:9093\"\n    volumes:\n      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro\n      - ./alertmanager/templates:/etc/alertmanager/templates:ro\n      - alertmanager_data:/alertmanager\n    command:\n      - '--config.file=/etc/alertmanager/alertmanager.yml'\n      - '--storage.path=/alertmanager'\n      - '--web.external-url=http://localhost:9093'\n      - '--cluster.advertise-address=0.0.0.0:9093'\n    restart: unless-stopped\n    networks:\n      - monitoring\n    healthcheck:\n      test: [\"CMD\", \"wget\", \"--quiet\", \"--tries=1\", \"--spider\", \"http://localhost:9093/-/healthy\"]\n      interval: 30s\n      timeout: 10s\n      retries: 3\n\n  node-exporter:\n    image: prom/node-exporter:v1.6.0\n    container_name: node-exporter\n    ports:\n      - \"9100:9100\"\n    volumes:\n      - /proc:/host/proc:ro\n      - /sys:/host/sys:ro\n      - /:/rootfs:ro\n    command:\n      - '--path.procfs=/host/proc'\n      - '--path.rootfs=/rootfs'\n      - '--path.sysfs=/host/sys'\n      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'\n    restart: unless-stopped\n    networks:\n      - monitoring\n\n  postgres-exporter:\n    image: prometheuscommunity/postgres-exporter:v0.13.0\n    container_name: postgres-exporter\n    ports:\n      - \"9187:9187\"\n    environment:\n      - DATA_SOURCE_NAME=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/").concat(this.config.databaseName, "?sslmode=disable\n    restart: unless-stopped\n    networks:\n      - monitoring\n      - triplecheck\n    depends_on:\n      - prometheus\n\n  redis-exporter:\n    image: oliver006/redis_exporter:v1.52.0\n    container_name: redis-exporter\n    ports:\n      - \"9121:9121\"\n    environment:\n      - REDIS_ADDR=redis://redis:6379\n    restart: unless-stopped\n    networks:\n      - monitoring\n      - triplecheck\n    depends_on:\n      - prometheus\n").trim();
    };
    ComprehensiveMonitoringSetup.prototype.startServices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 Starting monitoring services...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        (0, child_process_1.execSync)('cd monitoring && docker-compose up -d', {
                            stdio: 'inherit',
                            cwd: process.cwd()
                        });
                        console.log('  Waiting for services to start...');
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 30000); })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.warn('  Could not start Docker services automatically. Please run manually:');
                        console.warn('  cd monitoring && docker-compose up -d');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.validateSetup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var checks, _loop_1, _i, checks_1, check;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('✅ Validating comprehensive monitoring setup...');
                        checks = [
                            { name: 'Prometheus', url: 'http://localhost:9090/-/healthy', timeout: 5000 },
                            { name: 'Grafana', url: 'http://localhost:3000/api/health', timeout: 10000 },
                            { name: 'Alertmanager', url: 'http://localhost:9093/-/healthy', timeout: 5000 },
                            { name: 'Node Exporter', url: 'http://localhost:9100/metrics', timeout: 5000 },
                            { name: 'Postgres Exporter', url: 'http://localhost:9187/metrics', timeout: 5000 },
                            { name: 'Redis Exporter', url: 'http://localhost:9121/metrics', timeout: 5000 }
                        ];
                        _loop_1 = function (check) {
                            var controller_1, timeoutId, response, error_3;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        controller_1 = new AbortController();
                                        timeoutId = setTimeout(function () { return controller_1.abort(); }, check.timeout);
                                        return [4 /*yield*/, fetch(check.url, {
                                                signal: controller_1.signal,
                                                headers: { 'User-Agent': 'TripleCheck-Monitoring-Setup' }
                                            })];
                                    case 1:
                                        response = _b.sent();
                                        clearTimeout(timeoutId);
                                        if (response.ok) {
                                            console.log("  \u2705 ".concat(check.name, " is healthy"));
                                        }
                                        else {
                                            console.log("  \u26A0\uFE0F ".concat(check.name, " returned status ").concat(response.status));
                                        }
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_3 = _b.sent();
                                        console.log("  \u274C ".concat(check.name, " is not accessible: ").concat(error_3.message));
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, checks_1 = checks;
                        _a.label = 1;
                    case 1:
                        if (!(_i < checks_1.length)) return [3 /*break*/, 4];
                        check = checks_1[_i];
                        return [5 /*yield**/, _loop_1(check)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.generateDocumentation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var documentation, runbook;
            return __generator(this, function (_a) {
                console.log('📚 Generating monitoring documentation...');
                documentation = this.generateMonitoringDocumentation();
                (0, fs_1.writeFileSync)('monitoring/docs/README.md', documentation);
                runbook = this.generateRunbook();
                (0, fs_1.writeFileSync)('monitoring/docs/RUNBOOK.md', runbook);
                console.log('  Documentation generated');
                return [2 /*return*/];
            });
        });
    };
    ComprehensiveMonitoringSetup.prototype.generateMonitoringDocumentation = function () {
        return "\n# TripleCheck Comprehensive Monitoring System\n\n## Overview\n\nThis monitoring system provides comprehensive observability for the TripleCheck platform, including:\n\n- **Database Health Monitoring**: PostgreSQL performance, query analysis, connection pooling\n- **Business Metrics**: Land verification rates, fraud detection, user activity\n- **Infrastructure Monitoring**: System resources, application performance, external APIs\n- **Alerting & Incident Management**: Multi-channel notifications with escalation policies\n\n## Architecture\n\n### Components\n\n1. **Prometheus** (Port 9090): Metrics collection and storage\n2. **Grafana** (Port 3000): Visualization and dashboards\n3. **Alertmanager** (Port 9093): Alert routing and notifications\n4. **Node Exporter** (Port 9100): System metrics\n5. **Postgres Exporter** (Port 9187): Database metrics\n6. **Redis Exporter** (Port 9121): Cache metrics\n\n### Dashboards\n\n- **Database Health**: Connection pools, query performance, transaction rates\n- **Query Performance**: Slow queries, table-specific metrics, cache hit rates\n- **Business Metrics**: Verification success rates, fraud alerts, user activity\n\n### Alert Levels\n\n- **Critical**: Immediate response required (PagerDuty + Slack)\n- **High**: 15-minute response time (Slack + Email)\n- **Medium**: 30-minute response time (Email)\n- **Low**: 2-hour response time (Email)\n\n## Configuration\n\nEnvironment: ".concat(this.config.environment, "\nDatabase: ").concat(this.config.databaseName, "\n\n### Enabled Features\n\n- Prometheus: ").concat(this.config.enablePrometheus ? '✅' : '❌', "\n- Grafana: ").concat(this.config.enableGrafana ? '✅' : '❌', "\n- Alerting: ").concat(this.config.enableAlerting ? '✅' : '❌', "\n- PagerDuty: ").concat(this.config.enablePagerDuty ? '✅' : '❌', "\n- Slack: ").concat(this.config.enableSlack ? '✅' : '❌', "\n- Email: ").concat(this.config.enableEmail ? '✅' : '❌', "\n- SMS: ").concat(this.config.enableSMS ? '✅' : '❌', "\n\n## Access Information\n\n- **Prometheus**: http://localhost:9090\n- **Grafana**: http://localhost:3000 (admin/").concat(this.config.grafanaPassword, ")\n- **Alertmanager**: http://localhost:9093\n\n## Maintenance\n\n### Daily Tasks\n- Check dashboard for anomalies\n- Review active alerts\n- Validate backup completion\n\n### Weekly Tasks\n- Review alert thresholds\n- Update dashboard configurations\n- Check disk usage for metrics storage\n\n### Monthly Tasks\n- Review and update runbooks\n- Conduct alert testing\n- Performance optimization review\n\n## Troubleshooting\n\nSee RUNBOOK.md for detailed troubleshooting procedures.\n").trim();
    };
    ComprehensiveMonitoringSetup.prototype.generateRunbook = function () {
        return "\n# TripleCheck Monitoring Runbook\n\n## Alert Response Procedures\n\n### Database Alerts\n\n#### DatabaseDown\n**Severity**: Critical\n**Response Time**: Immediate\n\n1. Check database container status: `docker ps | grep postgres`\n2. Check database logs: `docker logs postgres`\n3. Verify network connectivity\n4. If container is down, restart: `docker-compose restart postgres`\n5. Validate application connectivity\n\n#### HighDatabaseQueryLatency\n**Severity**: High\n**Response Time**: 15 minutes\n\n1. Check current active queries: `SELECT * FROM pg_stat_activity WHERE state = 'active';`\n2. Identify slow queries: `SELECT query, query_start, state FROM pg_stat_activity WHERE now() - query_start > interval '1 minute';`\n3. Check for blocking queries: `SELECT * FROM pg_locks WHERE NOT granted;`\n4. Consider query optimization or index creation\n5. Monitor connection pool utilization\n\n### Business Alerts\n\n#### HighLandVerificationFailureRate\n**Severity**: High\n**Response Time**: 15 minutes\n\n1. Check external API status (government services)\n2. Review recent error logs for verification service\n3. Validate database connectivity\n4. Check for recent code deployments\n5. Monitor fraud detection patterns\n\n#### CriticalFraudAlertsHigh\n**Severity**: High\n**Response Time**: 15 minutes\n\n1. Review fraud alert patterns in dashboard\n2. Check for potential security incidents\n3. Validate fraud detection algorithm performance\n4. Consider temporary rate limiting if needed\n5. Notify security team\n\n### Infrastructure Alerts\n\n#### HighCPUUsage\n**Severity**: Medium\n**Response Time**: 30 minutes\n\n1. Identify high CPU processes: `top` or `htop`\n2. Check application logs for errors\n3. Review recent traffic patterns\n4. Consider horizontal scaling if sustained\n5. Monitor memory usage correlation\n\n#### HighMemoryUsage\n**Severity**: Medium\n**Response Time**: 30 minutes\n\n1. Check memory usage by process: `ps aux --sort=-%mem`\n2. Look for memory leaks in application logs\n3. Check database connection pool size\n4. Consider restarting high-memory services\n5. Monitor swap usage\n\n## Service Recovery Procedures\n\n### Prometheus Recovery\n1. Check configuration: `promtool check config prometheus.yml`\n2. Validate rules: `promtool check rules rules/*.yml`\n3. Restart service: `docker-compose restart prometheus`\n4. Verify metrics collection: Check /targets endpoint\n\n### Grafana Recovery\n1. Check logs: `docker logs grafana`\n2. Verify datasource connectivity\n3. Restart service: `docker-compose restart grafana`\n4. Re-import dashboards if needed\n\n### Alertmanager Recovery\n1. Check configuration: `amtool check-config alertmanager.yml`\n2. Restart service: `docker-compose restart alertmanager`\n3. Test notification channels\n4. Verify alert routing\n\n## Emergency Contacts\n\n- **On-Call Engineer**: [Configure based on your team]\n- **Database Team**: [Configure based on your team]\n- **Security Team**: [Configure based on your team]\n- **Infrastructure Team**: [Configure based on your team]\n\n## Escalation Matrix\n\n| Time | Severity | Action |\n|------|----------|--------|\n| 0 min | Critical | Slack + PagerDuty |\n| 5 min | Critical | SMS + Email |\n| 15 min | Critical | Manager notification |\n| 30 min | Critical | Executive escalation |\n\n## Common Commands\n\n### Docker Management\n```bash\n# View all monitoring services\ndocker-compose ps\n\n# Restart all services\ndocker-compose restart\n\n# View logs\ndocker-compose logs -f [service_name]\n\n# Update and restart\ndocker-compose pull && docker-compose up -d\n```\n\n### Prometheus Queries\n```promql\n# Database query rate\nrate(database_queries_total[5m])\n\n# High CPU usage\n100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)\n\n# Memory usage\n(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100\n```\n\n### Database Queries\n```sql\n-- Active connections\nSELECT count(*) FROM pg_stat_activity;\n\n-- Slow queries\nSELECT query, query_start, state, wait_event \nFROM pg_stat_activity \nWHERE state = 'active' AND query_start < now() - interval '1 minute';\n\n-- Database size\nSELECT pg_size_pretty(pg_database_size('".concat(this.config.databaseName, "'));\n```\n").trim();
    };
    ComprehensiveMonitoringSetup.prototype.printAccessInformation = function () {
        console.log('\n🌐 Comprehensive Monitoring Access Information:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  📊 Prometheus: http://localhost:9090');
        console.log('  📈 Grafana: http://localhost:3000');
        console.log("     Username: admin");
        console.log("     Password: ".concat(this.config.grafanaPassword));
        console.log('  🚨 Alertmanager: http://localhost:9093');
        console.log('  📡 Node Exporter: http://localhost:9100');
        console.log('  🗄️  Postgres Exporter: http://localhost:9187');
        console.log('  🔄 Redis Exporter: http://localhost:9121');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📚 Next Steps:');
        console.log('  1. Access Grafana and explore the pre-configured dashboards');
        console.log('  2. Test alert notifications by triggering test alerts');
        console.log('  3. Review the generated documentation in monitoring/docs/');
        console.log('  4. Configure additional notification channels as needed');
        console.log('  5. Set up backup procedures for monitoring data');
        console.log('\n🔧 Management Commands:');
        console.log('  • Start services: cd monitoring && docker-compose up -d');
        console.log('  • Stop services: cd monitoring && docker-compose down');
        console.log('  • View logs: cd monitoring && docker-compose logs -f');
        console.log('  • Update services: cd monitoring && docker-compose pull && docker-compose up -d');
        if (this.config.enableSlack) {
            console.log('\n💬 Slack Integration: Configured');
        }
        if (this.config.enablePagerDuty) {
            console.log('📟 PagerDuty Integration: Configured');
        }
        if (this.config.enableEmail) {
            console.log('📧 Email Alerts: Configured');
        }
        if (this.config.enableSMS) {
            console.log('📱 SMS Alerts: Configured');
        }
    };
    return ComprehensiveMonitoringSetup;
}());
exports.ComprehensiveMonitoringSetup = ComprehensiveMonitoringSetup;
// CLI interface
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var environment, setup, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    environment = process.argv[2];
                    if (!environment || !['development', 'staging', 'production'].includes(environment)) {
                        console.error('Usage: npm run setup:monitoring:comprehensive <environment>');
                        console.error('Environment must be one of: development, staging, production');
                        process.exit(1);
                    }
                    setup = new ComprehensiveMonitoringSetup(environment);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, setup.setup()];
                case 2:
                    _a.sent();
                    process.exit(0);
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error('Comprehensive monitoring setup failed:', error_4);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main();
}
