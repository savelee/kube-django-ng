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
bold "Set all .env vars..."
set -a
  source chatserver/.env
  set +a

SA_EMAIL=$(gcloud iam service-accounts list \
  --filter="displayName:$SERVICE_ACCOUNT_NAME" \
  --format='value(email)')

if [ -z "$PROJECT_ID" ]; then
  err "Not running in a GCP project. Exiting."
fi

if [ -z "$CLOUD_BUILD_EMAIL" ]; then
  err "Cloud Build email is empty. Exiting."
fi

bold "Removing Storage"
gsutil rm -r gs://$GCLOUD_STORAGE_BUCKET_NAME/

bold "Deleting Cloud Functions"
gcloud functions delete $CF_ANALYTICS \
--region=$REGION_ALTERNATIVE

bold "Deleting GKE cluster $GKE_CLUSTER in zone $REGION"
gcloud beta container clusters delete $GKE_CLUSTER --zone $REGION --quiet

bold "Deleting GCR images"
gcloud container images delete gcr.io/$PROJECT_ID/django-image --force-delete-tags --quiet
gcloud container images delete gcr.io/$PROJECT_ID/front-end-image --force-delete-tags --quiet
gcloud container images delete gcr.io/$PROJECT_ID/chatserver-image --force-delete-tags --quiet

bold "Remove network addresses"
gcloud compute --project=$PROJECT_ID addresses delete $GKE_CLUSTER --global

bold "Deleting Pub/Sub Topics"
PTOPIC=projects/$PROJECT_ID/topics/$TOPIC 
gcloud pubsub topics delete $PTOPIC

bold "Deleting BigQuery datasets..."
bq rm -r -f -d $PROJECT_ID:$DATASET
bq rm -r -f -d $PROJECT_ID:$DATASET_TEST_METRICS

bold "Removing All Dialogflow Agents..."
ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"
curl -H "Content-Type: application/json; charset=utf-8"  \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-X "DELETE" "https://dialogflow.googleapis.com/v2/projects/$PROJECT_ID/agent"

curl -H "Content-Type: application/json; charset=utf-8"  \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-X "DELETE" "https://dialogflow.googleapis.com/v2/projects/$DEV_AGENT_PROJECT_ID/agent"

curl -H "Content-Type: application/json; charset=utf-8"  \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-X "DELETE" "https://dialogflow.googleapis.com/v2/projects/$TEST_AGENT_PROJECT_ID/agent"

bold "Disable APIs..."
gcloud services disable \
  automl.googleapis.com \
  bigquery-json.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  container.googleapis.com \
  cloudtrace.googleapis.com \
  dialogflow.googleapis.com \
  dlp.googleapis.com \
  language.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  pubsub.googleapis.com \
  sourcerepo.googleapis.com \
  translate.googleapis.com

gcloud projects delete $DEV_AGENT_PROJECT_ID
gcloud projects delete $TEST_AGENT_PROJECT_ID
gcloud projects delete $PROJECT_ID

bold "Removing Kuberentes Admin role from $CLOUD_BUILD_EMAIL..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member=serviceAccount:$CLOUD_BUILD_EMAIL \
    --role=roles/container.admin

bold "Removing roles from $SA_EMAIL..."
gcloud projects remove-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.dataViewer

bold "Deleting service account $SERVICE_ACCOUNT_NAME..."
gcloud iam service-accounts delete $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --quiet

bold "Deleting git clone dir..."
cd ..
rm -rf kube-django-ng
bold "Deleting key..."
rm master.json

bold "Uninstallation complete!"