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

if [ -z "$PROJECT_ID" ]; then
  err "Not running in a GCP project. Exiting."
fi

if [ -z "$CLOUD_BUILD_EMAIL" ]; then
  err "Cloud Build email is empty. Exiting."
fi

if [ -z "$SA_EMAIL" ]; then
  err "Service Account email is empty. Exiting."
fi

bold "Deleting Cloud Functions"
gcloud functions delete $CF_ANALYTICS \ 
--region=europe-west1

bold "Deleting GKE cluster $GKE_CLUSTER in zone $ZONE"
gcloud beta container clusters delete $GKE_CLUSTER --zone $ZONE --quiet

bold "Deleting GCR images"
gcloud container images delete gcr.io/$PROJECT_ID/django-image --force-delete-tags --quiet
gcloud container images delete gcr.io/$PROJECT_ID/front-end-image --force-delete-tags --quiet
gcloud container images delete gcr.io/$PROJECT_ID/chatserver-image --force-delete-tags --quiet

bold "Remove network addresses"
gcloud compute --project=$PROJECT_ID addresses delete $GKE_CLUSTER

bold "Deleting Pub/Sub Topics"
gcloud pubsub topics delete $TOPIC

bold "Deleting BigQuery datasets futurebank..."
bq rm -r --force $DATASET
bq rm -r --force $DATASET_TEST_METRICS

bold "Removing Kuberentes Admin role from $CLOUD_BUILD_EMAIL..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member=serviceAccount:$CLOUD_BUILD_EMAIL \
    --role=roles/container.admin

bold "Removing roles from $SA_EMAIL..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.dataViewer

bold "Removing Storage"
gsutil rm -r gs://$GCLOUD_STORAGE_BUCKET_NAME/

bold "Deleting service account $SERVICE_ACCOUNT_NAME..."
gcloud iam service-accounts delete $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --quiet

bold "Deleting git clone dir..."
rm -rf kube-django-ng

bold "Uninstallation complete!"