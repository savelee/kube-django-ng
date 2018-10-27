# Google Cloud - Dialogflow Enterprise Demo

**By Lee Boonstra, Customer Engineer @ Google Cloud.**

![alt text](https://github.com/savelee/kube-django-ng/blob/master/images/architecture1.png "Containers")

This demo, showcases a dummy banking portal.
It exists of the following containers:

* Web Front-end - An Angular app (**client** folder)
* Dialogflow SDK - A Node JS app (**chatserver** folder)
* CMS - A Python/Django app (**server** folder)

When a customer writes text into the chatbot, the Dialogflow agent matches the answer.
It also pushes the contents to Pub/Sub.

![alt text](https://github.com/savelee/kube-django-ng/blob/master/images/architecture2.png "Cloud Function")


A cloud function has a subscription on the Pub/Sub channel.
See also the **cloudfunctions** folder.

Everytime a message comes in, the message will be passed to the NLP API to detect the sentiment,
and to BigQuery. We run the BigQuery queries in a dashboard.
The **bq** folder contains the queries.


**Disclaimer: This is not an officially supported Google product. Written code can be used as a baseline, it's not meant for production usage.**


### Setup

#### Setup Google Cloud

1.  Download and install the [Google Cloud
    SDK](https://cloud.google.com/sdk/docs/), which includes the
    [gcloud](https://cloud.google.com/sdk/gcloud/) command-line tool.

1. Open the Google Cloud Console: http://console.cloud.google.com

1. Make sure a Billing Account is setup & linked. (Select Billing in Main Menu)

1.  Create a [new Google Cloud Platform project from the Cloud
    Console](https://console.cloud.google.com/project) or use an existing one.

    Click the + icon in the top bar.
    Enter an unique project name. For example: *yourname-examples*.
    It will take a few minutes till everything is ready.

1. Initialize the Cloud SDK:
    

        $ gcloud init
        2 (Create a new configuration)
        yourname-examples
        (login)
        list
        #number-of-choice
        y

#### Authentication

Authentication is typically done through `Application Default Credentials`,
which means you do not have to change the code to authenticate as long as
your environment has credentials. You have a few options for setting up
authentication:

1. When running locally, use the `Google Cloud SDK`

        gcloud auth application-default login


    Note that this command generates credentials for client libraries. To authenticate the CLI itself, use:
    
        gcloud auth login

1. When running on App Engine or Compute Engine, credentials are already
   set-up. However, you may need to configure your Compute Engine instance
   with `additional scopes`_.

1. You can create a `Service Account key file`_. This file can be used to
   authenticate to Google Cloud Platform services from any environment. To use
   the file, set the ``GOOGLE_APPLICATION_CREDENTIALS`` environment variable to
   the path to the key file, for example:

        export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json

* [Application Default Credentials]( https://cloud.google.com/docs/authentication#getting_credentials_for_server-centric_flow)
* [Additional scopes](https://cloud.google.com/compute/docs/authentication#using)
* [Service Account key file](https://developers.google.com/identity/protocols/OAuth2ServiceAccount#creatinganaccount)


### Install Dependencies

1. Install [Node](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/get-npm) if you do not already have them.

1. TODO steps for Python

1. TODO steps for setting up Angular / CLI

### Enable the APIs

1. Navigate to the Cloud Console: http://console.cloud.google.com

1. Click on **APIs & Services > Dashboard**

1. Click on **Enable APIs & Services**

1. Enable the following APIS:

* BigQuery API
* Cloud Functions API
* Cloud Natural Language API
* Cloud Pub/Sub API
* Cloud Data Loss Protection API
* Dialogflow API

### Setup the Dialogflow Agent

1. (optional) In the cloud console, search for Dialogflow API

1. On the left hand side, select **Dialogflow Agent**

1. Click on **Open or Create Agent at dialogflow.com**

1.  Select your google account

1.  Allow the terms & conditions

1. Give your agent the name **ContactCenterDemo**

1. For language choose: **English**

1. For time zone choose: **Europe/Madrid**

1. Click **Create**
 
### Configure Dialogflow

1. In the left hand menu, click the **Upgrade button**

1. Choose **Enterprise Edition Essentials**

1. Click on the **gear** icon, in the left menu, next to your project name.

1. Enter the following agent description: **Contact Center Demo**

1. Click: **Enable beta features & APIs**

1. Click **Save**

1. Click on **Export & Import**

1. On your hard drive navigate to *chatserver/dialogflow* zip this folder, and then **Import from Zip** in the Dialogflow settings screen. These are some example chatbot dialogs.

### Setup Cloud Functions

1. Click **Create Function**

1. Select Trigger: **Cloud Pub/Sub**

1. Choose topic: **user-content**

1. Paste the contents of *cloudfunctions/index.js* into the **index.js** textarea

1. Paste the contents of *cloudfunctions/package.json* into the **package.json** textarea (tab)

1. The function to execute is: **subscribe**

1. Click **Create**

### Setup Service Account

1. Download the Service Account Key

1. Open http://console.cloud.google.com, and navigate to *APIs & Services > Credentials*.

1. Click **Create Credentials**

1. Select **Dialogflow Integrations**

1. Give it the name: *contact-center-demo*,  - select for now Project Owner (in production, you might want to fine tune this on least privaliges)

1. Select **JSON**

1. **Create**

1. Download the key, and store it somewhere on your hard drive, and remember the path.

1. In the cloud console, click on **IAM & admin**

1. Pick the Dialogflow Service Account, and add the following roles to it:

   NOTE: For testing purposes, I might add also the *Owner* role to this service account. Though, for production is best to make use of the least privilidges. 

   * Dialogflow API Admin
   * Logs Writer

1. Navigate to Cloud Functions, and take a note of the service account that is used.

    It might the App Engine service account which is created by default.

1. Go back to the **IAM & admin** settings, and make sure the service account used by the Cloud Function,
 has the following roles:

 * BigQuery Admin
 * Pub/Sub Admin

## Run the code locally

### Django CMS

In case you want to run this for the first time:

```
virtualenv -p python3 myenv
pip install -r requirements.txt
```

Run on the command-line:

```
cd server/
source myenv/bin/activate
python manage.py runserver 8080
```

Django can be reached via http://localhost:8080

### Start Client Container

Run on the command-line:

```
cd client/my-app
ng serve
```

The Front-end can be reached via http://localhost:4200

### Start ChatServer Container

In case you want to run this for the first time:

1. Rename the file from the command-line, and edit:

```
$ mv chatserver/my-app/env.txt chatserver/my-app/.env
$ nano .env
```

1. Modify the code:

```
GCLOUD_PROJECT=<PROJECT NAME>
GOOGLE_APPLICATION_CREDENTIALS=<LOCATION OF YOUR SERVICE ACCOUNT FILE>
```

1. Then run on the command-line:

```
cd chatserver/my-app
node app.js
```

## Demo flow:

1. Open http://localhost:4200

1. Navigate to the **Support** tab.

1. Use the following chatflow:

U: I would like to transfer money
> To which bank account number?
U: IBAN1233435
> How much would you like to tranfer?
U: 100 euro
> To which country?
U: Germany
> Alright! I will tranfer 100 euro to IBAN1233435 Germany.

1. Now navigate to the **Dashboard** and explain the following:

* We have collected x amount of messages over time.
* x amount of these messages contained negative user sentiment.
* Explain that we will optimize our chatbot based on the feedback of our users.
* Let's query on the session id, to figure out what went wrong, and read the transcript.
* Explain how this was built, by showing the architecture, and mentioning all the GCP components.

## Deploy your code to GKE with Cloud Builder

1. TODO Steps on creating a GKE cluster

1. (optional) In case you have deployed to this cluser before, remove deployment and service from the console.

1. From the root directory, run the following build script:

`gcloud container builds submit --config cloud.yaml .`

1. Now setup the services and loadbalancer:

`kubectl expose deployment my-app --type="LoadBalancer"`
