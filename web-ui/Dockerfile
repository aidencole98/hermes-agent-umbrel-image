FROM nginxinc/nginx-unprivileged:1.27@sha256:f9dfa9c20b2b0b7c5cc830374f22f23dee3f750b6c5291ca7e0330b5c88e6403

LABEL org.opencontainers.image.title="hermes-agent-web-ui"
LABEL org.opencontainers.image.description="Minimal landing page for the Hermes Agent Umbrel package"
LABEL org.opencontainers.image.source="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.url="https://github.com/aidencole98/hermes-agent-umbrel-image"
LABEL org.opencontainers.image.vendor="Umbrel"
LABEL org.opencontainers.image.version="v2026.4.3"

COPY web-ui/site/ /usr/share/nginx/html/
