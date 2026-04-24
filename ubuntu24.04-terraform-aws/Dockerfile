FROM ubuntu:26.04 AS cli

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates unzip

WORKDIR /root
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o "aws_cli2.zip"
RUN unzip "aws_cli2.zip" >/dev/null && echo 'Unzipped aws_cli2.zip'
RUN ./aws/install --bin-dir /usr/local/aws-cli-bin --install-dir /usr/local/aws-cli

FROM ubuntu:26.04

RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  openssl \
  unzip \
  lsb-release \
  gnupg \
  git \
  jq \
  zsh \
  mandoc \
  nano
rm -rf /var/lib/apt/lists/*
EOF

# Install Terraform
RUN <<EOF
curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
apt-get update && apt-get install -y terraform
rm -rf /var/lib/apt/lists/*
mkdir -p /terraform-cache
terraform version
EOF

ENV TF_PLUGIN_CACHE_DIR=/terraform-cache

# Install AWS CLI
COPY --from=cli /usr/local/aws-cli /usr/local/aws-cli
COPY --from=cli /usr/local/aws-cli-bin /usr/local/aws-cli-bin
ENV PATH=/usr/local/aws-cli-bin:$PATH
ENV AWS_PAGER=""
RUN aws --version

# Install AWS Session Manager Plugin
RUN <<EOF
case $(uname -m) in
  x86_64)  ARCH="ubuntu_64bit" ;;
  aarch64) ARCH="ubuntu_arm64" ;;
  *)       echo "Unsupported architecture: $(uname -m)"; exit 1 ;;
esac
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/${ARCH}/session-manager-plugin.deb" -o "session-manager-plugin.deb"
dpkg -i session-manager-plugin.deb
rm session-manager-plugin.deb
session-manager-plugin
EOF

LABEL org.opencontainers.image.source="https://github.com/k-kojima-yumemi/docker-images"
LABEL org.opencontainers.image.description="An image with Terraform, AWS CLI, and Session Manager Plugin"
