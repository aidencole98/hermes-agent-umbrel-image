ARG HERMES_BASE_IMAGE=ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.7-b2f477a
FROM ${HERMES_BASE_IMAGE}

ARG IMAGE_VERSION=v2026.4.7-b2f477a

LABEL org.opencontainers.image.title="hermes-agent-web-ui"
LABEL org.opencontainers.image.description="Hermes Agent browser terminal UI for Umbrel"
LABEL org.opencontainers.image.source="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.url="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.vendor="Umbrel"
LABEL org.opencontainers.image.version="${IMAGE_VERSION}"

WORKDIR /app

RUN set -eux; \
    groupadd --gid 1000 hermes || true; \
    useradd --uid 1000 --gid 1000 --create-home --home-dir /home/hermes --shell /bin/bash hermes || true; \
    mkdir -p /app /opt/data; \
    chown -R 1000:1000 /app /home/hermes /opt/data

COPY web-ui/package.json /app/package.json

RUN set -eux; \
    npm install --omit=dev; \
    npm cache clean --force

COPY --chown=1000:1000 web-ui/server.cjs /app/server.cjs
COPY --chown=1000:1000 web-ui/site/ /app/site/
COPY --chown=1000:1000 web-ui/bin/hermes /app/bin/hermes

RUN chmod +x /app/bin/hermes

ENV HOME=/home/hermes
ENV HERMES_HOME=/opt/data
ENV PORT=8080
ENV SHELL=/bin/bash

USER 1000:1000
EXPOSE 8080
VOLUME ["/opt/data"]

ENTRYPOINT []
CMD ["node", "/app/server.cjs"]
