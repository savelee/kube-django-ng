 #!/bin/bash
bold() {
  echo ". $(tput bold)" "$*" "$(tput sgr0)";
}

err() {
  echo "$*" >&2;
}

bold "Set all vars..."
set -a
  source ./properties
  set +a

bold "Eval the templates & deploy..."
envsubst < cloudbuilder/front-end-deployment.yaml | kubectl apply -f -
envsubst < cloudbuilder/django-deployment.yaml | kubectl apply -f -
envsubst < cloudbuilder/chatserver-deployment.yaml | kubectl apply -f -

bold "Starting deployments..."
kubectl apply -f cloudbuilder/django-deployment.yaml;
kubectl apply -f cloudbuilder/chatserver-deployment.yaml;

bold "Create services..."
kubectl apply -f cloudbuilder/services.yaml