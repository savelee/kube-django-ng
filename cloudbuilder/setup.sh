#!/bin/bash

bold() {
  echo ". $(tput bold)" "$*" "$(tput sgr0)";
}

err() {
  echo "$*" >&2;
}

source ./properties
source ./chatserver/my-app/.env

if [ -z "$PROJECT_ID" ]; then
  err "Not running in a GCP project. Please run gcloud config set project $PROJECT_ID."
  exit 1
fi

if [ -z "$CLOUD_BUILD_EMAIL" ]; then
  err "Cloud Build email is empty. Exiting."
  exit 1
fi

bold "Starting the setup process in project $PROJECT_ID..."
bold "Enable APIs..."
gcloud services enable \
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

bold "Creating a service account $SERVICE_ACCOUNT_NAME..."

gcloud iam service-accounts create \
  $SERVICE_ACCOUNT_NAME \
  --display-name $SERVICE_ACCOUNT_NAME

SA_EMAIL=$(gcloud iam service-accounts list \
  --filter="displayName:$SERVICE_ACCOUNT_NAME" \
  --format='value(email)')
  
if [ -z "$SA_EMAIL" ]; then
  err "Service Account email is empty. Exiting."
  exit 1
fi

bold "Adding policy binding to $SERVICE_ACCOUNT_NAME email: $SA_EMAIL..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.dataViewer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.jobUser
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/clouddebugger.agent
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.reader
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/errorreporting.admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/logging.logWriter
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/pubsub.editor
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/pubsub.viewer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/storage.objectCreator
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/storage.objectViewer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/iam.serviceAccountKeyAdmin

bold "Saving the key..."
gcloud iam service-accounts keys create ~/master.json \
  --iam-account $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com

bold "Creating Storage bucket..."
gsutil mb gs://$GCLOUD_STORAGE_BUCKET_NAME/

bold "Create PubSub Topic..."
gcloud pubsub topics create $TOPIC

bold "Creating Cloud Functions..."
gcloud functions deploy $CF_ANALYTICS --region=$REGION_ALTERNATIVE \
--memory=512MB \
--trigger-topic=$TOPIC \
--runtime=nodejs8 \
--source=../cloudfunctions/chatanalytics \
--stage-bucket=$GCLOUD_STORAGE_BUCKET_NAME \
--timeout=60s \
--entry-point=subscribe \
--set-env-vars DATASET=$DATASET,TABLE=$TABLE

bold "Creating BQ dataset..."
bq --location=$BQ_LOCATION mk \
$DATASET

bold "Creating Test Metrics BQ dataset..."
bq --location=$BQ_LOCATION mk \
$DATASET_TEST_METRICS

bold "Creating BQ table..."
bq mk \
$DATASET.$TABLE \
$SCHEMA

bold "Creating Test Metrics BQ table..."
bq mk \
$DATASET.$TABLE \
$SCHEMA_TEST_METRICS

bold "Creating cluster..."
gcloud container clusters create $GKE_CLUSTER \
  --region $REGION \
  --enable-autoscaling \
  --enable-autoupgrade \
  --enable-autorepair \
  --enable-stackdriver-kubernetes \
  --num-nodes $MIN_NODES --enable-autoscaling \
  --min-nodes $MIN_NODES --max-nodes $MAX_NODES

bold "Get credentials..."
gcloud container clusters get-credentials $GKE_CLUSTER --zone $REGION

bold "Create a secret from your service account..."
kubectl create secret generic credentials --from-file=~/master.json

bold "Create GKE Configmap..."
kubectl create configmap chatserver-config \
  --from-literal "GCLOUD_PROJECT=$PROJECT_ID"\
  --from-literal "DEV_AGENT_PROJECT_ID=$DEV_AGENT_PROJECT_ID" \
  --from-literal "TEST_AGENT_PROJECT_ID=$TEST_AGENT_PROJECT_ID" \
  --from-literal "LANGUAGE_CODE=$LANGUAGE_CODE" \
  --from-literal "TOPIC=$TOPIC" \
  --from-literal "BQ_LOCATION=$BQ_LOCATION"\
  --from-literal "DATASET=$DATASET"\
  --from-literal "TABLE=$TABLE" \
  --from-literal "DATASET_TEST_METRICS=$DATASET_TEST_METRICS" \
  --from-literal "TABLE_TEST_METRICS=$TABLE_TEST_METRICS" \
  --from-literal "MY_CHATBASE_KEY=$MY_CHATBASE_KEY" 
  --from-literal "MY_CHATBASE_BOT_NAME=$MY_CHATBASE_BOT_NAME" \
  --from-literal "MY_CHATBASE_VERSION=$MY_CHATBASE_VERSION" \
  --from-literal "GCLOUD_STORAGE_BUCKET_NAME=$GCLOUD_STORAGE_BUCKET_NAME"

bold "Starting deployments..."
gcloud builds submit --config setup.yaml \
--substitutions PROJECT_ID=$PROJECT_ID, REGION=$REGION, GKE_CLUSTER=$GKE_CLUSTER

kubectl apply -f ingress.yaml

bold "Setup network addresses"
gcloud compute --project=$PROJECT_ID addresses create $GKE_CLUSTER --global --network-tier=PREMIUM

bold "Deployment complete!"