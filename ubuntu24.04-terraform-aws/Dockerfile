FROM ubuntu:24.04 AS cli

RUN apt-get update && apt-get install -y curl unzip

WORKDIR /root
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o "aws_cli2.zip"
RUN unzip "aws_cli2.zip" >/dev/null && echo 'Unziped aws_cli2.zip'
RUN ./aws/install --bin-dir /usr/local/aws-cli-bin --install-dir /usr/local/aws-cli

FROM ubuntu:24.04

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
  jq
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
RUN aws --version

LABEL org.opencontainers.image.source="https://github.com/k-kojima-yumemi/docker-images"
LABEL org.opencontainers.image.description="An image with Terraform and AWS CLI"
