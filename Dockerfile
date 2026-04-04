FROM debian:13.4@sha256:55a15a112b42be10bfc8092fcc40b6748dc236f7ef46a358d9392b339e9d60e8

ARG HERMES_VERSION=v2026.4.3
ARG HERMES_SOURCE_SHA256=80033597933cd76e7604653219c36822b9aabe7644a4abc106e4e26abf14d9ea

ENV DEBIAN_FRONTEND=noninteractive
ENV HERMES_HOME=/opt/data
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /opt/hermes

ADD https://github.com/NousResearch/hermes-agent/archive/refs/tags/${HERMES_VERSION}.tar.gz /tmp/hermes-agent.tar.gz

RUN set -eux; \
    echo "${HERMES_SOURCE_SHA256}  /tmp/hermes-agent.tar.gz" | sha256sum -c -; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        ffmpeg \
        gcc \
        libffi-dev \
        nodejs \
        npm \
        python3 \
        python3-dev \
        python3-pip \
        ripgrep \
        tar; \
    mkdir -p /opt/hermes /opt/data; \
    tar -xzf /tmp/hermes-agent.tar.gz --strip-components=1 -C /opt/hermes; \
    chmod +x /opt/hermes/docker/entrypoint.sh; \
    python3 -m pip install --no-cache-dir -e '.[all]' --break-system-packages; \
    npm install; \
    if [ -d /opt/hermes/scripts/whatsapp-bridge ]; then cd /opt/hermes/scripts/whatsapp-bridge && npm install; cd /opt/hermes; fi; \
    npx playwright install --with-deps chromium --only-shell; \
    npm cache clean --force; \
    rm -f /tmp/hermes-agent.tar.gz; \
    rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.title="hermes-agent-umbrel"
LABEL org.opencontainers.image.description="Multi-arch Umbrel image for NousResearch/hermes-agent"
LABEL org.opencontainers.image.source="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.url="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.vendor="Umbrel"
LABEL org.opencontainers.image.version="${HERMES_VERSION}"

VOLUME ["/opt/data"]

ENTRYPOINT ["/opt/hermes/docker/entrypoint.sh"]
