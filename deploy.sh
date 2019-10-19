source ./properties

if [ -z "$PROJECT_ID" ]; then
  err "Not running in a GCP project. Please run gcloud config set project $PROJECT_ID."
  exit 1
fi

if [ -z "$CLOUD_BUILD_EMAIL" ]; then
  err "Cloud Build email is empty. Exiting."
  exit 1
fi

bold "Starting deployments..."
gcloud builds submit --config cloudbuilder/deploy.yaml \
--substitutions _REGION=$REGION,_GKE_CLUSTER=$GKE_CLUSTER
bold "Create services..."
kubectl apply -f cloudbuilder/services.yaml