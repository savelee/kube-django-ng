#!/bin/bash

bold() {
  echo ". $(tput bold)" "$*" "$(tput sgr0)";
}

err() {
  echo "$*" >&2;
}

source ./properties

if [ -z "$PROJECT_ID" ]; then
  err "Not running in a GCP project. Exiting."
  exit 1
fi

if [ -z "$CLOUD_BUILD_EMAIL" ]; then
  err "Cloud Build email is empty. Exiting."
  exit 1
fi

if [ -z "$SA_EMAIL" ]; then
  err "Service Account email is empty. Exiting."
  exit 1
fi

bold "Deleting Cloud Functions"
gcloud functions delete $CF_ANALYTICS \ 
--region=europe-west1
gcloud functions delete $CF_FILES \ 
--region=europe-west1
gcloud functions delete $CF_PDF \ 
--region=europe-west1

bold "Deleting service account $SERVICE_ACCOUNT_NAME..."
gcloud iam service-accounts delete $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --quiet

bold "Deleting GKE cluster $GKE_CLUSTER in zone $ZONE"
gcloud beta container clusters delete $GKE_CLUSTER --zone $ZONE --quiet

bold "Deleting GCR images"
gcloud container images delete gcr.io/$PROJECT_ID/django-image --force-delete-tags --quiet
gcloud container images delete gcr.io/$PROJECT_ID/front-end-image --force-delete-tags --quiet
gcloud container images delete gcr.io/$PROJECT_ID/chatserver-image --force-delete-tags --quiet

bold "Remove network addresses"
gcloud compute --project=$PROJECT_ID addresses delete $GKE_CLUSTER

bold "Deleting GCS bucket $BUCKET_URI"
gsutil rm -r $BUCKET_URI

bold "Deleting Pub/Sub Topics"
gcloud pubsub topics delete $TOPIC_FILES
gcloud pubsub topics delete $TOPIC_ANALYTICS

bold "Deleting BigQuery dataset futurebank..."
bq rm -r --force $DATASET_FILES
bq rm -r --force $DATASET_ANALYTICS

bold "Removing Kuberentes Admin role from $CLOUD_BUILD_EMAIL..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member=serviceAccount:$CLOUD_BUILD_EMAIL \
    --role=roles/container.admin

bold "Removing roles from $SA_EMAIL..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.dataViewer
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.dataViewer
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.jobUser
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/pubsub.editor
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/pubsub.viewer
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/storage.objectCreator
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/storage.objectViewer
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.editor
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.reader
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/clouddebugger.agent
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/errorreporting.admin
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/logging.logWriter

bold "Deleting git clone dir..."
rm -rf kube-django-ng

bold "Uninstallation complete!"