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

ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"

echo $MY_CHATBASE_VERSION;
echo $ACCESS_TOKEN;

bold "Zipping Intents..."
zip -r chatserver/dialogflow/agent/agent.zip chatserver/dialogflow/agent
bold "Uploading Intents to $GCLOUD_STORAGE_BUCKET_NAME..."
gsutil cp chatserver/dialogflow/agent/agent.zip gs://$GCLOUD_STORAGE_BUCKET_NAME/

bold "Create a Dialogflow Agent..."
echo $ACCESS_TOKEN

JSONPROD="{\"defaultLanguageCode\":\"en\",\"displayName\":\"$PROD_AGENT_NAME\",\"parent\":\"projects/$PROJECT_ID\",\"timeZone\":\"America/Los_Angeles\"}"
curl -H "Content-Type: application/json; charset=utf-8"  \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-d $JSONPROD "https://dialogflow.googleapis.com/v2/projects/$PROJECT_ID/agent"

## TODO ITS IN A DIFFERENT PROJECT SO YOU NEED
## THE RIGHTS

JSONTEST="{\"defaultLanguageCode\":\"en\",\"displayName\":\"$TEST_AGENT_NAME\",\"parent\":\"projects/$TEST_AGENT_PROJECT_ID\",\"timeZone\":\"America/Los_Angeles\"}"
curl -H "Content-Type: application/json; charset=utf-8"  \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-d $JSONTEST "https://dialogflow.googleapis.com/v2/projects/$TEST_AGENT_PROJECT_ID/agent"

## TODO ITS IN A DIFFERENT PROJECT SO YOU NEED
## THE RIGHTS
JSONDEV="{\"defaultLanguageCode\":\"en\",\"displayName\":\"$DEV_AGENT_NAME\",\"parent\":\"projects/$DEV_AGENT_PROJECT_ID\",\"timeZone\":\"America/Los_Angeles\"}"
curl -H "Content-Type: application/json; charset=utf-8"  \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-d $JSONDEV "https://dialogflow.googleapis.com/v2/projects/$DEV_AGENT_PROJECT_ID/agent"

bold "Import Intents to Prod"
curl -X POST \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-H "Content-Type: application/json; charset=utf-8" \
-d $IMPORTFILES \
https://dialogflow.googleapis.com/v2/projects/$PROJECT_ID/agent:restore

## TODO ITS IN A DIFFERENT PROJECT SO YOU NEED
## THE RIGHTS
IMPORTFILES="{\"agentUri\":\"gs:\\$GCLOUD_STORAGE_BUCKET_NAME\agent.zip\"}"
bold "Import Intents to Dev"
curl -X POST \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-H "Content-Type: application/json; charset=utf-8" \
-d $IMPORTFILES \
https://dialogflow.googleapis.com/v2/projects/$DEV_AGENT_PROJECT_ID/agent:restore

## TODO ITS IN A DIFFERENT PROJECT SO YOU NEED
## THE RIGHTS
bold "Import Intents to Test"
curl -X POST \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-H "Content-Type: application/json; charset=utf-8" \
-d $IMPORTFILES \
https://dialogflow.googleapis.com/v2/projects/$TEST_AGENT_PROJECT_ID/agent:restore

