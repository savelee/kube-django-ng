source ./properties

if [ -z "$PROJECT_ID" ]; then
  err "Not running in a GCP project. Please run gcloud config set project $PROJECT_ID."
  exit 1
fi

set -e
eval "cat <<EOF
$(<$1)
EOF
" | kubectl apply -f -

bold "Starting deployments..."
kubectl apply -f cloudbuilder/front-end-deployment.yaml;
kubectl apply -f cloudbuilder/django-deployment.yaml;
kubectl apply -f cloudbuilder/chatserver-deployment.yaml;

bold "Create services..."
kubectl apply -f cloudbuilder/services.yaml