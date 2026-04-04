FROM python:3.12-alpine@sha256:7747d47f92cfca63a6e2b50275e23dba8407c30d8ae929a88ddd49a5d3f2d331

LABEL org.opencontainers.image.title="hermes-agent-web-ui"
LABEL org.opencontainers.image.description="Minimal landing page for the Hermes Agent Umbrel package"
LABEL org.opencontainers.image.source="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.url="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.vendor="Umbrel"
LABEL org.opencontainers.image.version="v2026.4.3"

RUN addgroup -g 1000 -S hermes \
    && adduser -S -D -H -u 1000 -G hermes hermes \
    && mkdir -p /srv/site \
    && chown -R 1000:1000 /srv/site

COPY --chown=1000:1000 web-ui/site/ /srv/site/

USER 1000:1000
EXPOSE 8080

CMD ["python", "-m", "http.server", "8080", "--directory", "/srv/site"]
