# Google Cloud - Dialogflow Enterprise Demo

![alt text](https://github.com/savelee/kube-django-ng/blob/master/images/architecture1.png "Containers")

This demo, showcases a dummy banking portal.
It exists of the following containers:

* Web Front-end - An Angular app (**client**)
* Dialogflow SDK - A Node JS app (**chatserver**)
* CMS - A Python/Django app (**server**)

When a customer writes text into the chatbot, the Dialogflow agent matches the answer.
It also pushes the contents to Pub/Sub.

![alt text](https://github.com/savelee/kube-django-ng/blob/master/images/architecture2.png "Cloud Function")


A cloud function has a subscription on the Pub/Sub channel.
See also the **cloudfunctions** folder.

Everytime a message comes in, the message will be passed to the NLP API to detect the sentiment,
and to BigQuery. We run the BigQuery queries in a dashboard.
The **bq** contains the queries.

# Setup instructions

## Start Server Container

When first time:

```
virtualenv -p python3 myenv
pip install -r requirements.txt
```

Run:

```
cd server/
source myenv/bin/activate
python manage.py runserver 8080
```

## Start Client Container

Run:

```
cd client/my-app
ng serve
```

```
cd googlebank/my-app
ng serve
```

## Start ChatServer Container

Run:

```
cd clientserver/my-app
node app.js
```

## Deploy the containers with Cloud Builder

First remove deployment and service from the console. 
From the root directory, run the following build script:

`gcloud container builds submit --config cloud.yaml .`

Now setup the services and loadbalancer:

`kubectl expose deployment my-app --type="LoadBalancer"`


## Handy Links

1. https://dialogflow.com/docs/reference/v2-auth-setup
2. https://cloud.google.com/docs/authentication/production
3. https://github.com/kelseyhightower/gke-service-accounts-tutorial

