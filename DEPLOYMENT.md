# 🚀 Amazon EC2 CI/CD Deployment Guide for DevCollab

This project includes a production-ready **GitHub Actions CI/CD pipeline** that automatically builds, tests, and deploys DevCollab to an **Amazon EC2** instance whenever code is pushed to `master` (or `main`).

---

## 🏗️ Architecture Overview

- **CI (Continuous Integration)**:
  - Runs on every push and pull request.
  - Installs dependencies and runs syntax/type checks on `Backend`.
  - Installs dependencies and compiles the production Vite bundle on `Frontend`.
- **CD (Continuous Deployment)**:
  - Runs on push to `master` / `main` (or manual trigger via GitHub Actions `workflow_dispatch`).
  - Securely connects to your EC2 instance via SSH.
  - Automatically clones or pulls the latest code.
  - Injects environment variables from GitHub Secrets into `.env`.
  - Builds and starts Docker containers using `docker-compose.yml`.
  - Serves Frontend via **Nginx** (handling SPA routing, `/api/` reverse-proxy, and `/socket.io/` WebSocket connections).
  - Serves Backend on Node.js 20.
  - Runs automated health check validation.

---

## 📋 Step 1: AWS EC2 Instance Setup

### 1.1 Launch an EC2 Instance
1. Open the [AWS Management Console](https://console.aws.amazon.com/ec2/).
2. Click **Launch Instance**:
   - **Name**: `DevCollab-Server`
   - **AMI**: **Ubuntu Server 22.04 LTS** or **Ubuntu Server 24.04 LTS**
   - **Instance Type**: `t2.micro` or `t3.micro` (Free tier eligible)
   - **Key pair**: Create or select an existing key pair (e.g. `devcollab-key.pem`). Save the `.pem` file safely.
   - **Storage**: 15–20 GB gp3 recommended.

### 1.2 Configure Security Group (Firewall Rules)
In the EC2 Security Group, open the following **Inbound rules**:

| Type | Protocol | Port Range | Source | Purpose |
|------|----------|------------|--------|---------|
| **SSH** | TCP | `22` | `0.0.0.0/0` (or your IP) | SSH access & GitHub Actions deployment |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Web application access |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | SSL/TLS (if domain configured) |
| **Custom TCP** | TCP | `5000` | `0.0.0.0/0` | Direct backend API / Health checks |
| **Custom TCP** | TCP | `3000` | `0.0.0.0/0` (or your IP) | Grafana SRE & Observability Dashboards |
| **Custom TCP** | TCP | `9090` | `0.0.0.0/0` (or internal) | Prometheus Metrics & Alerting Engine |

---

## ⚙️ Step 2: One-Time Server Initialization

Connect to your EC2 instance via SSH from your terminal:

```bash
ssh -i /path/to/devcollab-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Once connected, run the automated provisioning script:

```bash
# Clone the repository
git clone https://github.com/sanket7338jadhav/DevCollab.git ~/DevCollab
cd ~/DevCollab

# Make the setup script executable and run it
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh
```

> **Why is this script important?**
> - It installs **Docker** and **Docker Compose**.
> - It allocates a **2 GB Swap file**, preventing `t2.micro` (1GB RAM) from freezing or running out of memory during builds.
> - Configures user group permissions so Docker runs without `sudo`.

After running the script, log out and reconnect:
```bash
exit
ssh -i /path/to/devcollab-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## 🔐 Step 3: Configure GitHub Repository Secrets

Go to your GitHub repository:
**Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **New repository secret**.

Add the following secrets:

| Secret Name | Description | Example / Value |
|-------------|-------------|-----------------|
| `EC2_HOST` | Public IPv4 Address or Public DNS of your EC2 | `54.210.123.45` or `ec2-54-210-123-45.compute-1.amazonaws.com` |
| `EC2_USER` | Default SSH user for the instance | `ubuntu` |
| `EC2_SSH_KEY` | Entire content of your `.pem` private key file | Open `devcollab-key.pem` with a text editor and paste the full text (including `-----BEGIN RSA PRIVATE KEY-----`) |
| `MONGO_URI` | MongoDB Connection String (e.g. MongoDB Atlas) | `mongodb+srv://user:pass@cluster0.mongodb.net/devcollab?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `your_long_random_jwt_secret_string` |
| `JWT_EXPIRES_IN` *(Optional)* | Expiration duration for auth tokens | `7d` |
| `CLIENT_URL` *(Optional)* | Allowed CORS origin for Backend | `http://<YOUR_EC2_PUBLIC_IP>` (defaults to `http://<EC2_HOST>`) |
| `EC2_PORT` *(Optional)* | Custom SSH port if not default | `22` |

---

## 🚀 Step 4: Trigger Deployment

### Automatic Trigger
Every time you push code to `master` (or `main`):
```bash
git add .
git commit -m "Configure CI/CD with GitHub Actions and Docker"
git push origin master
```

### Manual Trigger
1. Go to your GitHub repository ➔ **Actions** tab.
2. Select **DevCollab CI/CD Pipeline**.
3. Click **Run workflow** ➔ Select branch `master` ➔ Click **Run workflow**.

---

## 🔍 Step 5: Verification & Monitoring

Once the workflow run completes with green checkmarks:
1. Open your browser and navigate to:
   ```
   http://<YOUR_EC2_PUBLIC_IP>
   ```
2. Verify API health endpoint:
   ```
   http://<YOUR_EC2_PUBLIC_IP>/api/health
   # or
   http://<YOUR_EC2_PUBLIC_IP>:5000/api/health
   ```
   Expected response:
   ```json
   { "status": "ok", "message": "DevCollab API is running 🚀" }
   ```

### Helpful Server Commands (on EC2)

```bash
# View running containers
docker compose ps

# View live application logs
docker compose logs -f

# View only Backend logs
docker compose logs -f backend

# Restart services
docker compose restart
```
