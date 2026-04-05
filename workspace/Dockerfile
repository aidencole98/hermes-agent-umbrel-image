FROM node:22-bookworm-slim@sha256:80fdb3f57c815e1b638d221f30a826823467c4a56c8f6a8d7aa091cd9b1675ea

ARG HERMES_WORKSPACE_VERSION=0.1.0
ARG HERMES_WORKSPACE_COMMIT=b4775f8efd530c1257fa1a591718a6a8c3f98da3
ARG HERMES_WORKSPACE_SOURCE_SHA256=916d6391c45930b48a05242323a9c105691a2474cca4877a5b66e80bf843e6b7

ENV DEBIAN_FRONTEND=noninteractive
ENV HOME=/home/hermes
ENV HERMES_HOME=/home/hermes/.hermes
ENV PORT=3000

WORKDIR /opt/hermes-workspace

ADD https://github.com/outsourc-e/hermes-workspace/archive/${HERMES_WORKSPACE_COMMIT}.tar.gz /tmp/hermes-workspace.tar.gz

RUN set -eux; \
    echo "${HERMES_WORKSPACE_SOURCE_SHA256}  /tmp/hermes-workspace.tar.gz" | sha256sum -c -; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        curl \
        git \
        python3 \
        ripgrep \
        tar; \
    tar -xzf /tmp/hermes-workspace.tar.gz --strip-components=1 -C /opt/hermes-workspace; \
    corepack enable; \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi; \
    pnpm build; \
    rm -rf /home/hermes; \
    ln -s /home/node /home/hermes; \
    mkdir -p /home/node/.hermes; \
    chown -R 1000:1000 /home/node /opt/hermes-workspace; \
    rm -f /tmp/hermes-workspace.tar.gz; \
    rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.title="hermes-workspace-umbrel"
LABEL org.opencontainers.image.description="Multi-arch Umbrel image for outsourc-e/hermes-workspace"
LABEL org.opencontainers.image.source="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.url="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.vendor="Umbrel"
LABEL org.opencontainers.image.version="${HERMES_WORKSPACE_VERSION}"
LABEL org.opencontainers.image.revision="${HERMES_WORKSPACE_COMMIT}"

ENV NODE_ENV=production

USER 1000:1000
EXPOSE 3000

CMD ["node", "server-entry.js"]
