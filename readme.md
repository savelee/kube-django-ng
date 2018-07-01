# Help instructions

## Server

### When first time:
`virtualenv -p python3 myenv`
`pip install -r requirements.txt`

### Run
`cd server/`
`source myenv/bin/activate`
`python manage.py runserver 8080`

## Client

### Run
`cd client/my-app`
`Ng serve`

## Chat Server

### Run
`cd clientserver/my-app`
`node app.js`


## Deploy

First remove deployment and service from the console. 
From the root directory, run the following build script:

`gcloud container builds submit --config cloud.yaml .`

Now setup the services and loadbalancer:

`kubectl expose deployment my-app --type="LoadBalancer"`


## Links

https://dialogflow.com/docs/reference/v2-auth-setup
https://cloud.google.com/docs/authentication/production
https://github.com/kelseyhightower/gke-service-accounts-tutorial

