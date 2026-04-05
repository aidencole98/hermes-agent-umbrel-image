# hermes-agent-umbrel-image

Public image-source repository for:

- `ghcr.io/aidencole98/hermes-agent-umbrel` — multi-arch replacement for the upstream `NousResearch/hermes-agent` container
- `ghcr.io/aidencole98/hermes-agent-web-ui` — multi-arch landing-page image for the Umbrel package
- `ghcr.io/aidencole98/hermes-workspace-umbrel` — multi-arch Hermes Workspace runtime for Umbrel

This package is intentionally kept close to upstream `v2026.4.3` so it can later be swapped back to an official image with minimal compose changes:

- Debian-based image
- source unpacked into `/opt/hermes`
- `pip install -e '.[all]' --break-system-packages`
- `npm install`
- `npx playwright install --with-deps chromium --only-shell`
- `HERMES_HOME=/opt/data`
- `VOLUME /opt/data`
- entrypoint remains `/opt/hermes/docker/entrypoint.sh`
- no custom default command; runtime args stay in compose so the official upstream image can be swapped in later

The main difference is platform support: this image is built for both `linux/amd64` and `linux/arm64`.

## Upstream Source

- Upstream repo: <https://github.com/NousResearch/hermes-agent>
- Upstream tag: `v2026.4.3`
- Source tarball: <https://github.com/NousResearch/hermes-agent/archive/refs/tags/v2026.4.3.tar.gz>
- Source sha256: `80033597933cd76e7604653219c36822b9aabe7644a4abc106e4e26abf14d9ea`
- Base image: `debian:13.4@sha256:55a15a112b42be10bfc8092fcc40b6748dc236f7ef46a358d9392b339e9d60e8`

## Workspace Source

- Upstream repo: <https://github.com/outsourc-e/hermes-workspace>
- Upstream version: `0.1.0`
- Upstream commit: `b4775f8efd530c1257fa1a591718a6a8c3f98da3`
- Source tarball: <https://github.com/outsourc-e/hermes-workspace/archive/b4775f8efd530c1257fa1a591718a6a8c3f98da3.tar.gz>
- Source sha256: `916d6391c45930b48a05242323a9c105691a2474cca4877a5b66e80bf843e6b7`
- Runtime details:
  - built with `pnpm`
  - started with `node server-entry.js`
  - listens on port `3000`
  - runs as uid/gid `1000:1000`
  - includes `python3`, `bash`, `git`, `curl`, and `ripgrep`
  - sets `HOME=/home/hermes`
  - sets `HERMES_HOME=/home/hermes/.hermes`

## Image Tags

- `ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.3`
- `ghcr.io/aidencole98/hermes-agent-umbrel:latest`
- `ghcr.io/aidencole98/hermes-agent-web-ui:v2026.4.3`
- `ghcr.io/aidencole98/hermes-agent-web-ui:latest`
- `ghcr.io/aidencole98/hermes-workspace-umbrel:0.1.0`
- `ghcr.io/aidencole98/hermes-workspace-umbrel:latest`

`v2026.4.3` is the current Hermes Agent release tag. `0.1.0` is the current Hermes Workspace source version. `latest` tracks the default branch build. On repo tag pushes, GitHub Actions also publishes matching `v*` tags for all three images.

## Build

Create and use a buildx builder:

```bash
docker buildx create --name hermes-multiarch --use
docker buildx inspect --bootstrap
```

Build and push the release tag:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg HERMES_VERSION=v2026.4.3 \
  --build-arg HERMES_SOURCE_SHA256=80033597933cd76e7604653219c36822b9aabe7644a4abc106e4e26abf14d9ea \
  -t ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.3 \
  --push \
  .
```

Build and push both the release tag and `latest`:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg HERMES_VERSION=v2026.4.3 \
  --build-arg HERMES_SOURCE_SHA256=80033597933cd76e7604653219c36822b9aabe7644a4abc106e4e26abf14d9ea \
  -t ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.3 \
  -t ghcr.io/aidencole98/hermes-agent-umbrel:latest \
  --push \
  .
```

Build and push the Hermes Workspace image:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg HERMES_WORKSPACE_VERSION=0.1.0 \
  --build-arg HERMES_WORKSPACE_COMMIT=b4775f8efd530c1257fa1a591718a6a8c3f98da3 \
  --build-arg HERMES_WORKSPACE_SOURCE_SHA256=916d6391c45930b48a05242323a9c105691a2474cca4877a5b66e80bf843e6b7 \
  -f workspace/Dockerfile \
  -t ghcr.io/aidencole98/hermes-workspace-umbrel:0.1.0 \
  -t ghcr.io/aidencole98/hermes-workspace-umbrel:latest \
  --push \
  .
```

## Run

Example:

```bash
docker run --rm -it \
  -p 8000:8000 \
  -e API_SERVER_ENABLED=true \
  -e API_SERVER_HOST=0.0.0.0 \
  -e API_SERVER_PORT=8000 \
  -v hermes-data:/opt/data \
  ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.3 \
  gateway run
```

The container preserves the upstream `/opt/data` data volume and entrypoint bootstrap behavior. Runtime configuration continues to happen through the same `API_SERVER_*` and related Hermes environment variables used upstream.

## GitHub Actions

`.github/workflows/build.yml` publishes both images:

- `ghcr.io/aidencole98/hermes-agent-umbrel`
- `ghcr.io/aidencole98/hermes-agent-web-ui`
- `ghcr.io/aidencole98/hermes-workspace-umbrel`

Tags published:

- `latest` on pushes to the default branch
- exact `v*` tags on tag pushes

Pull requests build the image for validation without pushing to GHCR.
