# hermes-agent-umbrel-image

Public image-source repository for:

- `ghcr.io/aidencole98/hermes-agent-umbrel` — multi-arch Umbrel image built from the official `NousResearch/hermes-agent` source, including the official built-in web dashboard
- `ghcr.io/aidencole98/hermes-workspace-umbrel` — legacy multi-arch Hermes Workspace runtime for Umbrel

The current Umbrel build tracks the official upstream `v2026.4.13` release, which introduced Hermes Agent's built-in local web dashboard. The older custom `hermes-agent-web-ui` preview path is stale and is no longer used by the Umbrel package.

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
- Current packaged upstream release: `v2026.4.13` (`Hermes Agent v0.9.0`)
- Release URL: <https://github.com/NousResearch/hermes-agent/releases/tag/v2026.4.13>
- Source tarball: <https://github.com/NousResearch/hermes-agent/archive/refs/tags/v2026.4.13.tar.gz>
- Source sha256: `5e4529b8cb6e4821eb916b81517e48125109b1764d6d1e68a204a9f0ddf2d98c`
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

- `ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.13-official-webui`
- `ghcr.io/aidencole98/hermes-agent-umbrel:latest`
- `ghcr.io/aidencole98/hermes-workspace-umbrel:0.1.0`
- `ghcr.io/aidencole98/hermes-workspace-umbrel:latest`

`v2026.4.13-official-webui` is the current Hermes Agent Umbrel image tag and packages the official upstream `v2026.4.13` release with the built-in dashboard. `0.1.0` is the current Hermes Workspace source version. `latest` tracks the default branch build. On repo tag pushes, GitHub Actions also publishes matching `v*` tags for the maintained images.

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
  --build-arg HERMES_REF=v2026.4.13 \
  --build-arg HERMES_SOURCE_SHA256=5e4529b8cb6e4821eb916b81517e48125109b1764d6d1e68a204a9f0ddf2d98c \
  --build-arg IMAGE_VERSION=v2026.4.13-official-webui \
  -t ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.13-official-webui \
  --push \
  .
```

Build and push both the release tag and `latest`:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg HERMES_REF=v2026.4.13 \
  --build-arg HERMES_SOURCE_SHA256=5e4529b8cb6e4821eb916b81517e48125109b1764d6d1e68a204a9f0ddf2d98c \
  --build-arg IMAGE_VERSION=v2026.4.13-official-webui \
  -t ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.13-official-webui \
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

The old custom Hermes web UI image is no longer part of the supported build flow. The Umbrel package now uses the official dashboard that ships from the main Hermes Agent image.

## Run

Example:

```bash
docker run --rm -it \
  -p 9119:9119 \
  -v hermes-data:/opt/data \
  ghcr.io/aidencole98/hermes-agent-umbrel:v2026.4.13-official-webui \
  /opt/hermes/.venv/bin/python -m hermes_cli.main dashboard --host 0.0.0.0 --port 9119 --no-open
```

The container preserves the upstream `/opt/data` data volume and entrypoint bootstrap behavior. In Umbrel, the same image is used twice: one container runs `gateway run` and the other runs the official dashboard command.

## Official Hermes Dashboard

The official dashboard ships from the Hermes Agent source tree itself.

- Frontend source: `/opt/hermes/web`
- Built assets: `/opt/hermes/hermes_cli/web_dist`
- Backend server: `hermes_cli/web_server.py`
- Runtime command: `/opt/hermes/.venv/bin/python -m hermes_cli.main dashboard --host 0.0.0.0 --port 9119 --no-open`
- Reuses the same `/opt/data` volume as the gateway container
- Runs correctly as uid/gid `1000:1000` in Umbrel

## GitHub Actions

`.github/workflows/build.yml` publishes the maintained images:

- `ghcr.io/aidencole98/hermes-agent-umbrel`
- `ghcr.io/aidencole98/hermes-workspace-umbrel`

Tags published:

- `latest` on pushes to the default branch
- exact `v*` tags on tag pushes

Pull requests build the image for validation without pushing to GHCR.
