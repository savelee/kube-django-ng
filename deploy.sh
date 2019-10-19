 #!/bin/bash

source ./properties

bold "Eval the templates..."
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