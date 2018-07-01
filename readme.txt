## Server

## When first time:
virtualenv -p python3 myenv
pip install -r requirements.txt

## Run
cd server/
source myenv/bin/activate
python manage.py runserver 8080

## Client

## Run
cd client/my-app
Ng serve 
to start angular app from my-app

## Chat Server

## Run
cd clientserver/my-app
node app.js 
to start chatclient from my-app

## Client

(remove deployment and service)
gcloud container builds submit --config cloud.yaml .
kubectl expose deployment my-app --type="LoadBalancer"

https://dialogflow.com/docs/reference/v2-auth-setup
https://cloud.google.com/docs/authentication/production
https://github.com/kelseyhightower/gke-service-accounts-tutorial

