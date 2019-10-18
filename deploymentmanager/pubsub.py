'''

$ gcloud deployment-manager deployments create my-test-deployment --template=pubsub.py 
The fingerprint of the deployment is QDKI-RiACSd3vWsoGsFnFw==
Waiting for create [operation-1561647524470-58c4f65f5df01-6059d922-42566d0c]...done.
Create operation operation-1561647524470-58c4f65f5df01-6059d922-42566d0c completed successfully.
NAME          TYPE                    STATE      ERRORS  INTENT
my-topic      pubsub.v1.topic         COMPLETED  []
my-topic-sub  pubsub.v1.subscription  COMPLETED  []


The fingerprint of the deployment is npYMjl8wLIyDiRtFhXhkxA==
Waiting for create [operation-1562836490144-58d6439d6491d-d0955efe-067ca1fe]...
failed.                                                                        
ERROR: (gcloud.deployment-manager.deployments.create) Error in Operation [operation-1562836490144-58d6439d6491d-d0955efe-067ca1fe]: errors:
- code: RESOURCE_ERROR
  location: /deployments/my-test-deployment/resources/my-topic-sub
  message: "{\"ResourceType\":\"pubsub.v1.subscription\",\"ResourceErrorCode\":\"\
    400\",\"ResourceErrorMessage\":{\"code\":400,\"message\":\"The supplied HTTP URL\
    \ is not registered in the subscription's parent project (url=\\\"https://europe-west1-my-project.cloudfunctions.net/some-cloud-func/?token=secret\\\
    \", project_id=\\\"998076246070\\\"). Please see https://cloud.google.com/pubsub/docs/push#domain_ownership_validation.\"\
    ,\"status\":\"INVALID_ARGUMENT\",\"details\":[],\"statusMessage\":\"Bad Request\"\
    ,\"requestPath\":\"https://pubsub.googleapis.com/v1/projects/gke-pipeline-savelee-192517/subscriptions/my-topic-sub\"\
    ,\"httpMethod\":\"PUT\"}}"


{
  "name": string,
  "topic": "$(ref.my-topic.name)",
  "pushConfig": {
    object (PushConfig)
  },
  "ackDeadlineSeconds": 60,
  "retainAckedMessages": boolean,
  "messageRetentionDuration": string,
  "labels": {
    string: string,
    ...
  },
  "expirationPolicy": {
    object (ExpirationPolicy)
  }
}

$ gcloud deployment-manager deployments update my-test-deployment --template=pubsub.py 
The fingerprint of the deployment is jom0R3FJzsFDHg1NmKHufg==
Waiting for update [operation-1561647730282-58c4f723a4f47-befb81a3-5a757621]...failed.
ERROR: (gcloud.deployment-manager.deployments.update) Error in Operation [operation-1561647730282-58c4f723a4f47-befb81a3-5a757621]: errors:
- code: NO_METHOD_TO_UPDATE_FIELD
  message: No method found to update field 'pushConfig' on resource 'my-topic-sub'
    of type 'pubsub.v1.subscription'. The resource may need to be recreated with the
    new field.

Kun jij aangeven wat we kunnen doen om dit werkend te krijgen of wanneer dit wordt opgelost?
Onze huidige work-around is: deployment of topics en subscriptions via deployment manager, vervolgens gebruiken we Google Pubsub API om de pushConfig te updaten. 
Voor de app engine deployment hebben we nu een gcloud app create commando in de cloudbuild.
Het liefst zou ik dit allemaal willen doen via deployment manager.

# grant Cloud Pub/Sub the permission to create tokens


gcloud projects add-iam-policy-binding gke-pipeline-savelee-192517\
     --member=serviceAccount:service-998076246070@gcp-sa-pubsub.iam.gserviceaccount.com \
     --role=roles/iam.serviceAccountTokenCreator

gcloud beta pubsub subscriptions create my-topic-sub \
 --topic=my-topic \
 --push-endpoint=https://us-central1-gke-pipeline-savelee-192517.cloudfunctions.net/some-cloud-func \
 --impersonate-service-account=gke-pipeline-savelee-192517@appspot.gserviceaccount.com

https://console.developers.google.com/apis/api/iamcredentials.googleapis.com/overview?project=998076246070

https://stackoverflow.com/questions/51093792/can-i-use-google-cloud-pub-sub-across-different-google-cloud-projects

gcloud deployment-manager deployments create my-test-deployment2 --config pubsubgcp.yaml

# Add serviceAccountTokenCreator to service account
'''

def generate_config(context):
    resources = [
        {
            "name": "my-topic",
            "type": "pubsub.v1.topic",
            "properties": {
                "topic": "my-topic"
            },
        },
        {
            "name": "my-topic-sub",
            "type": "pubsub.v1.subscription",
            "properties": {
                "topic": "$(ref.my-topic.name)",
                "subscription": "my-topic-sub",
                "ackDeadlineSeconds": 60,
                "expirationPolicy": {},
                
            }
        }
    ]

    return {'resources': resources}


