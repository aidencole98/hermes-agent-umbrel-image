FROM ghcr.io/astral-sh/uv:0.11.6-python3.13-trixie@sha256:b3c543b6c4f23a5f2df22866bd7857e5d304b67a564f4feab6ac22044dde719b AS uv_source
FROM debian:13.4

ARG HERMES_REF=v2026.4.13
ARG HERMES_SOURCE_SHA256=5e4529b8cb6e4821eb916b81517e48125109b1764d6d1e68a204a9f0ddf2d98c
ARG IMAGE_VERSION=v2026.4.13-official-webui

ENV DEBIAN_FRONTEND=noninteractive
ENV HERMES_HOME=/opt/data
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/hermes/.playwright
ENV PATH=/opt/hermes/.venv/bin:$PATH

WORKDIR /opt/hermes
ADD https://github.com/NousResearch/hermes-agent/archive/refs/tags/${HERMES_REF}.tar.gz /tmp/hermes-agent.tar.gz
COPY --from=uv_source /usr/local/bin/uv /usr/local/bin/uvx /usr/local/bin/

RUN set -eux; \
    echo "${HERMES_SOURCE_SHA256}  /tmp/hermes-agent.tar.gz" | sha256sum -c -; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        ffmpeg \
        gcc \
        git \
        libffi-dev \
        nodejs \
        npm \
        procps \
        python3 \
        python3-dev \
        ripgrep \
        tar; \
    mkdir -p /opt/hermes /opt/data; \
    tar -xzf /tmp/hermes-agent.tar.gz --strip-components=1 -C /opt/hermes; \
    npm install --prefer-offline --no-audit; \
    cd /opt/hermes/web; \
    npm install --prefer-offline --no-audit; \
    npm run build; \
    cd /opt/hermes; \
    if [ -d /opt/hermes/scripts/whatsapp-bridge ]; then cd /opt/hermes/scripts/whatsapp-bridge && npm install --prefer-offline --no-audit; cd /opt/hermes; fi; \
    npx playwright install --with-deps chromium --only-shell; \
    useradd -u 1000 -m -d /opt/data hermes; \
    chown -R 1000:1000 /opt/hermes /opt/data; \
    chmod +x /opt/hermes/docker/entrypoint.sh; \
    su hermes -s /bin/sh -c 'cd /opt/hermes && uv venv && uv pip install --no-cache-dir -e ".[all]"'; \
    npm cache clean --force; \
    rm -f /tmp/hermes-agent.tar.gz; \
    rm -rf /var/lib/apt/lists/* /root/.npm /home/hermes/.cache/uv

LABEL org.opencontainers.image.title="hermes-agent-umbrel"
LABEL org.opencontainers.image.description="Multi-arch Umbrel image for NousResearch/hermes-agent with the official built-in web dashboard"
LABEL org.opencontainers.image.source="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.url="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.vendor="Umbrel"
LABEL org.opencontainers.image.version="${IMAGE_VERSION}"

VOLUME ["/opt/data"]
ENTRYPOINT ["/opt/hermes/docker/entrypoint.sh"]
