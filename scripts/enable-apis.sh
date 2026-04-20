#!/bin/bash
# scripts/enable-apis.sh
#
# Enables all required Google Cloud APIs for Xstadium.
# Run once per GCP project.
#
# Prerequisites:
#   - gcloud CLI installed: https://cloud.google.com/sdk/docs/install
#   - Authenticated: gcloud auth login
#   - Project set: gcloud config set project YOUR_PROJECT_ID
#
# Usage: bash scripts/enable-apis.sh

set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Xstadium — Enable GCP APIs                  ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Project: $PROJECT_ID"
echo ""

APIS=(
  "generativelanguage.googleapis.com"      # Gemini AI
  "maps-backend.googleapis.com"            # Maps JavaScript API
  "routes.googleapis.com"                  # Routes API (navigation)
  "pubsub.googleapis.com"                  # Cloud Pub/Sub
  "bigquery.googleapis.com"                # BigQuery
  "aiplatform.googleapis.com"              # Vertex AI
  "iam.googleapis.com"                     # IAM (service accounts)
  "cloudresourcemanager.googleapis.com"    # Resource Manager
)

echo "Enabling APIs..."
echo ""

for api in "${APIS[@]}"; do
  echo -n "  Enabling $api ... "
  gcloud services enable "$api" --project="$PROJECT_ID" --quiet
  echo "✅"
done

echo ""
echo "Creating service account: xstadium-backend"
echo ""

SA_EMAIL="xstadium-backend@$PROJECT_ID.iam.gserviceaccount.com"

# Create service account (ignore error if already exists)
gcloud iam service-accounts create xstadium-backend \
  --display-name="Xstadium Backend Service Account" \
  --description="Service account for Xstadium backend server" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  ⟳  Service account already exists"

echo ""
echo "Granting IAM roles..."
echo ""

ROLES=(
  "roles/bigquery.dataEditor"
  "roles/bigquery.jobUser"
  "roles/pubsub.publisher"
  "roles/pubsub.subscriber"
  "roles/aiplatform.user"
  "roles/datastore.user"
)

for role in "${ROLES[@]}"; do
  echo -n "  Granting $role ... "
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role" \
    --quiet > /dev/null
  echo "✅"
done

echo ""
echo "Downloading service account key..."
echo ""

KEY_PATH="backend/service-account-key.json"

gcloud iam service-accounts keys create "$KEY_PATH" \
  --iam-account="$SA_EMAIL" \
  --project="$PROJECT_ID"

echo "  ✅ Key saved to: $KEY_PATH"
echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ GCP setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Copy backend/.env.example → backend/.env"
echo "  2. Set GCP_PROJECT_ID=$PROJECT_ID in backend/.env"
echo "  3. Run: node scripts/setup-pubsub.js"
echo "  4. Run: node scripts/setup-bigquery.js"
echo "  5. Run: node scripts/check-gcp.js"
echo "═══════════════════════════════════════════════"
echo ""
