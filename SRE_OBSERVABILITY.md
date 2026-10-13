# 📊 DevCollab: Monitoring, Observability & Site Reliability Engineering (SRE)

**Course Unit Alignment**: Unit 3 (Monitoring & Observability) & Unit 4 (Site Reliability Engineering, Alerting & Incident Management)

---

## 🎯 1. Unique Problem Statement

> **Problem Statement**:
> *"Designing and implementing an end-to-end Observability, Continuous Monitoring, and Site Reliability Engineering (SRE) framework for DevCollab — a distributed real-time collaborative development platform. The system establishes comprehensive observability across the Three Pillars (Metrics, Logs, Tracing), quantifies reliability using Google's Four Golden Signals (Latency, Traffic, Errors, Saturation), defines actionable SLIs/SLOs with automated error budget tracking, and integrates proactive multi-channel alerting with Prometheus, Grafana, and Docker on Amazon EC2."*

### Challenges Addressed:
1. **Real-time State Drift**: Traditional HTTP monitoring fails to capture stateful WebSocket connection health, socket disconnection churn, and message transit latency.
2. **Microservice Blindspots**: Uncorrelated distributed errors make root-cause analysis slow during outages.
3. **SRE Compliance**: Absence of quantitative Service Level Objectives (SLOs) and Error Budgets leads to unmeasured downtime and reactive incident response.

---

## 🏛️ 2. Architectural Overview

```
                      ┌──────────────────────────────────────────────┐
                      │                 Client Tier                  │
                      │       (React 19 SPA on Port 80 Nginx)        │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP / WS Requests
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │              DevCollab Backend               │
                      │            (Express / Node.js 20)            │
                      │  ┌────────────────────┬────────────────────┐ │
                      │  │  X-Request-Id &    │  Prometheus Metrics│ │
                      │  │  Winston JSON Logs │  Engine & Registry │ │
                      │  └────────────────────┴────────────────────┘ │
                      └─────────────┬──────────────────┬─────────────┘
                                    │ /metrics         │
                                    │ (Pull Scrape 5s) │
                                    ▼                  ▼
┌──────────────────────────┐  ┌─────────────┐    ┌───────────────────────────┐
│     Prometheus Engine    │◄─┤ MongoDB      │    │      Grafana (Port 3000)  │
│        (Port 9090)       │  │ (Atlas M0)   │    │  - Golden Signals Board   │
│  - Time-series TSDB      │  └─────────────┘    │  - SLI / SLO Gauges       │
│  - Alert Rules Evaluator │─────────────────────►│  - WebSocket Telemetry    │
└──────────────────────────┘      Data Query      └───────────────────────────┘
```

---

## 🔍 3. The Three Pillars of Observability

### Pillar 1: Metrics (Prometheus Engine)
The application natively exposes `/metrics` powered by `prom-client` in Prometheus OpenMetrics text format.

| Metric Identifier | Type | Labels | Description / Signal |
|-------------------|------|--------|----------------------|
| `devcollab_http_requests_total` | Counter | `method`, `route`, `status_code` | **Traffic & Errors**: Total HTTP throughput. |
| `devcollab_http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | **Latency**: Request latency distribution (10 buckets from 10ms to 10s). |
| `devcollab_http_requests_in_flight` | Gauge | — | **Saturation**: Active concurrent HTTP requests. |
| `devcollab_socket_active_connections` | Gauge | — | **Saturation**: Active connected WebSocket users. |
| `devcollab_socket_messages_sent_total` | Counter | — | **Traffic**: Volume of real-time messages transmitted. |
| `devcollab_database_connected` | Gauge | — | **Availability**: MongoDB connectivity (1 = UP, 0 = DOWN). |
| `devcollab_nodejs_heap_size_used_bytes` | Gauge | — | **Saturation**: Node.js V8 memory heap consumed. |
| `devcollab_nodejs_eventloop_lag_seconds` | Gauge | — | **Saturation**: Node.js asynchronous event loop delay. |

### Pillar 2: Logs (Structured Contextual Logging)
DevCollab utilizes **Winston** for high-performance structured logging:
- In production, logs are output in machine-readable **JSON format** containing timestamps, severity levels, service tag (`devcollab-backend`), HTTP method, URL, status code, IP, and duration.
- **Trace Context**: Every request is assigned a unique `X-Request-Id` (UUID v4) that propagates through HTTP response headers and every correlated log entry.

### Pillar 3: Tracing & Synthetic Health Probes
- **`/api/health`**: Comprehensive health status reporting uptime, memory RSS/heap, database state, and socket count.
- **`/api/health/live`**: Liveness probe ensuring the Node.js runtime process is responsive.
- **`/api/health/ready`**: Readiness probe checking whether MongoDB is connected and ready to process traffic before traffic is routed.

---

## 📈 4. The Four Golden Signals (Google SRE Framework)

| Golden Signal | Implementation in DevCollab | PromQL Query |
|---------------|-----------------------------|--------------|
| **1. Latency** | Request duration percentiles (p50, p95, p99) | `histogram_quantile(0.95, sum(rate(devcollab_http_request_duration_seconds_bucket[2m])) by (le))` |
| **2. Traffic** | Total HTTP requests per second & Socket throughput | `sum(rate(devcollab_http_requests_total[1m])) by (method, route)` |
| **3. Errors** | Ratio of HTTP 5xx errors to total requests | `(sum(rate(devcollab_http_requests_total{status_code=~"5.."}[2m])) or vector(0)) / (sum(rate(devcollab_http_requests_total[2m])) > 0) * 100` |
| **4. Saturation** | Memory utilization %, Event loop lag, Socket concurrency | `(devcollab_nodejs_heap_size_used_bytes / devcollab_nodejs_heap_size_total_bytes) * 100` |

---

## 🎯 5. Site Reliability Engineering (SRE): SLIs, SLOs & Error Budgets

### Service Level Definitions

| Service Level Term | Formal Definition | DevCollab Specification |
|--------------------|-------------------|--------------------------|
| **SLI (Indicator)** | A quantifiable measure of service performance. | Percentage of HTTP requests returning `< 500` status codes over 30 days. |
| **SLO (Objective)** | The target reliability level committed by engineering. | **99.5% Availability** per rolling 30-day window.<br>**95.0% Latency < 300ms** for API routes. |
| **SLA (Agreement)** | Contractual agreement with users/clients. | **99.0% Uptime** guarantee. |
| **Error Budget** | Maximum allowable unreliability: `100% - SLO`. | **0.5%** failure budget per month (~3.6 hours of permitted downtime per 30 days). |

### Error Budget Calculation Formula:
$$\text{Remaining Error Budget (\%)} = \left( 1 - \frac{\text{Actual Error Rate}}{\text{Allowed Unreliability (0.5\%)}} \right) \times 100$$

When the error budget drops below 20%, feature releases are frozen, and engineering focus switches strictly to reliability and bug fixes.

---

## 🚨 6. Prometheus Alerting Matrix

Alert rules are defined in [`monitoring/prometheus/alert.rules.yml`](file:///c:/Users/sanke/OneDrive/Desktop/code/DevCollab/monitoring/prometheus/alert.rules.yml):

| Alert Name | Severity | Condition / Threshold | Duration | SRE Impact |
|------------|----------|-----------------------|----------|------------|
| `DevCollabBackendDown` | **Critical** | `up{job="devcollab-backend"} == 0` | 30s | Complete service outage |
| `MongoDBConnectionLost` | **Critical** | `devcollab_database_connected == 0` | 30s | Database disconnection |
| `HighHttpErrorRate5xx` | **Critical** | 5xx Error Rate > 1% | 1m | Severe SLO breach |
| `HighLatencyP95` | **Warning** | P95 Latency > 500ms | 2m | Performance degradation |
| `HighMemorySaturation` | **Warning** | Heap Memory > 85% | 2m | Risk of Out-Of-Memory (OOM) |
| `HighEventLoopLag` | **Warning** | Event Loop Lag > 100ms | 1m | Node.js process thread blocking |

---

## 🖥️ 7. Grafana Dashboard Provisioning

Grafana is pre-configured with **zero manual configuration required**:
- **Datasource**: Automatically connects to `http://prometheus:9090`.
- **Dashboards**: The dashboard is auto-imported from [`monitoring/grafana/dashboards/devcollab-sre.json`](file:///c:/Users/sanke/OneDrive/Desktop/code/DevCollab/monitoring/grafana/dashboards/devcollab-sre.json).
- **Accessing Grafana**:
  - URL: `http://<YOUR_EC2_IP>:3000` (or `http://localhost:3000` locally)
  - Default Username: `admin`
  - Default Password: `admin`

### Dashboard Visual Panels:
1. **Service Status & Database Health** (Real-time Up/Down status indicators)
2. **Active WebSocket Users** (Live gauge of active chat and collaboration participants)
3. **Availability SLI Gauge** (Live compliance against 99.5% goal)
4. **Remaining Error Budget Gauge** (Real-time depletion tracker)
5. **Traffic Panel** (Requests per second segmented by endpoint and HTTP method)
6. **Latency Percentiles Panel** (p50 Median, p95, and p99 curve)
7. **Error Rate Distribution** (2xx, 4xx, 5xx status distribution)
8. **Memory & CPU Saturation** (Heap Used vs Heap Total vs RSS memory bytes)
9. **Event Loop Telemetry & In-flight Requests**

---

## 🛠️ 8. How to Run and Verify the Observability Stack

### Step 1: Start All Services via Docker Compose
```bash
docker compose up -d --build
```

### Step 2: Verify Running Containers
```bash
docker compose ps
```
You should see:
- `devcollab-backend` (Port 5000)
- `devcollab-frontend` (Port 80)
- `devcollab-prometheus` (Port 9090)
- `devcollab-grafana` (Port 3000)

### Step 3: Verify Metrics Scraping
Open in your browser:
- Backend Metrics: `http://localhost:5000/metrics`
- Backend Health: `http://localhost:5000/api/health`
- Prometheus UI: `http://localhost:9090` (Check **Status ➔ Targets** to see `devcollab-backend` state is **UP**)
- Grafana SRE Dashboard: `http://localhost:3000` (Log in with `admin`/`admin` to view the live dashboard)

### Step 4: Simulate Traffic to Demonstrate SRE Metrics in Action
Run traffic generation from your terminal:
```bash
# Generate 50 HTTP requests
for i in {1..50}; do curl -s http://localhost:5000/api/health > /dev/null; sleep 0.1; done
```
Watch the **Traffic**, **Latency**, and **In-flight** graphs in Grafana update live every 5 seconds!

---

## 🚑 9. Incident Runbook

When an alert triggers in Prometheus/Grafana:

1. **`DevCollabBackendDown`**:
   - Check container status: `docker compose ps`
   - Inspect backend logs: `docker compose logs --tail=100 backend`
   - Restart container: `docker compose restart backend`
2. **`HighMemorySaturation`**:
   - Check heap usage: Look at Grafana **Saturation: Node.js Memory** panel.
   - Inspect whether unclosed WebSocket listeners or memory leaks exist.
   - Run garbage collection or restart process if memory exceeds threshold.
3. **`MongoDBConnectionLost`**:
   - Check MongoDB Atlas network access / IP whitelist.
   - Test connectivity: `curl -s http://localhost:5000/api/health/ready`
   - Verify `MONGO_URI` in `.env`.
