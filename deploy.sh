#!/usr/bin/env bash
#
# Build, push, and deploy medical-analysis to Google Cloud Run.
#
# Usage:
#   ./deploy.sh              # full flow (prompts for gcloud login if needed)
#   ./deploy.sh --skip-auth  # skip gcloud auth login (CI or already authenticated)
#
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-ligaments-portal}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-medical-analysis}"
IMAGE_NAME="${IMAGE_NAME:-medical-analysis}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"

IMAGE="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
ANALYZE_API_BASE_URL="${ANALYZE_API_BASE_URL:-https://medical-analysis-backend-2p3fwh332a-uc.a.run.app}"
SKIP_AUTH=false

for arg in "$@"; do
  case "$arg" in
    --skip-auth)
      SKIP_AUTH=true
      ;;
    -h|--help)
      sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 1
      ;;
  esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "→ Project:  ${PROJECT_ID}"
echo "→ Region:   ${REGION}"
echo "→ Service:  ${SERVICE_NAME}"
echo "→ Image:    ${IMAGE}"
echo "→ Analyze:  ${ANALYZE_API_BASE_URL}/api/v1/analyze"
echo ""

if [[ "$SKIP_AUTH" == false ]]; then
  echo "→ Authenticating with Google Cloud (browser may open)..."
  gcloud auth login
fi

echo "→ Setting active gcloud project..."
gcloud config set project "$PROJECT_ID"

echo "→ Building and pushing Docker image (linux/amd64)..."
docker buildx build \
  --platform linux/amd64 \
  -t "$IMAGE" \
  -f "$DOCKERFILE" \
  --build-arg "NEXT_PUBLIC_ANALYZE_API_BASE_URL=${ANALYZE_API_BASE_URL}" \
  --push \
  .

echo "→ Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --platform=managed \
  --region="$REGION" \
  --allow-unauthenticated

echo ""
echo "✓ Deployed ${SERVICE_NAME} (${IMAGE}) to ${REGION}"
