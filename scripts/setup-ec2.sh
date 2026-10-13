#!/usr/bin/env bash
# ==============================================================================
# DevCollab - EC2 Initial Instance Setup Script
# Run this once on your newly created Ubuntu EC2 instance:
#   chmod +x scripts/setup-ec2.sh && ./scripts/setup-ec2.sh
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting EC2 Provisioning for DevCollab..."
echo "=========================================================="

# 1. Update and upgrade packages
echo "Updating apt packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Setup 2GB Swap space (Essential for t2.micro/t3.micro 1GB RAM instances)
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file to prevent out-of-memory errors..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap created successfully."
else
    echo "Swap file already exists, skipping."
fi

# 3. Install prerequisites
echo "Installing prerequisites (curl, git, ufw, ca-certificates)..."
sudo apt-get install -y curl git ufw ca-certificates gnupg lsb-release

# 4. Install Docker and Docker Compose plugin
if ! command -v docker &> /dev/null; then
    echo "Installing Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker

    # Add current user to docker group
    sudo usermod -aG docker "$USER"
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

# 5. Configure firewall (UFW)
echo "Configuring firewall for SSH, HTTP, HTTPS, API, Grafana, and Prometheus..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 5000/tcp || true
sudo ufw allow 3000/tcp || true   # Grafana
sudo ufw allow 9090/tcp || true   # Prometheus
sudo ufw --force enable || true

echo "=========================================================="
echo " EC2 Instance Setup Completed!"
echo " Please log out and log back in (or run 'newgrp docker')"
echo " for the docker group permissions to take effect."
echo "=========================================================="
