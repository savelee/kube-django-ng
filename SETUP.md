# Google Cloud - Dialogflow Enterprise Demo

By Lee Boonstra, Google Cloud.

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

. Navigate to the Cloud Console: http://console.cloud.google.com

. Click on **APIs & Services > Dashboard**

. Click on **Enable APIs & Services**

. Enable the following APIS:

* BigQuery API
* Cloud Functions API
* Cloud Natural Language API
* Cloud Pub/Sub API
* Cloud Data Loss Protection API
* Dialogflow API

### Setup the Dialogflow Agent

. (optional) In the cloud console, search for Dialogflow API

. On the left hand side, select **Dialogflow Agent**

. Click on **Open or Create Agent at dialogflow.com**

.  Select your google account

.  Allow the terms & conditions

. Give your agent the name **ContactCenterDemo**

. For language choose: **English**

. For time zone choose: **Europe/Madrid**

. Click **Create**
 
### Configure Dialogflow

. In the left hand menu, click the **Upgrade button**

. Choose **Enterprise Edition Essentials**

. Click on the **gear** icon, in the left menu, next to your project name.

. Enter the following agent description: **Contact Center Demo**

. Click: **Enable beta features & APIs**

. Click **Save**

. Click on **Export & Import**

TODO

. On your hard drive navigate to *chatserver/dialogflow* zip this folder, and then **Import from Zip** in the Dialogflow settings screen.

### Setup Cloud Functions

. Click **Create Function**

. Select Trigger: **Cloud Pub/Sub**

. Choose topic: **user-content**

. Paste the contents of *cloudfunctions/index.js* into the **index.js** textarea

. Paste the contents of *cloudfunctions/package.json* into the **package.json** textarea (tab)

. The function to execute is: **subscribe**

. Click **Create**

### Setup Service Account

Download the Service Account Key

. Open http://console.cloud.google.com, and navigate to *APIs & Services > Credentials*.

. Click **Create Credentials**

. Select **Dialogflow Integrations**

. Give it the name: *contact-center-demo*,  - select for now Project Owner (in production, you might want to fine tune this on least privaliges)

. Select **JSON**

. **Create**

. Download the key, and store it somewhere on your hard drive, and remember the path.

. In the cloud console, click on **IAM & admin**

. Pick the Dialogflow Service Account, and add the following roles to it:

* Dialogflow API Admin
* Logs Writer

 For testing purposes, I might add also the *Owner* role to this service account.
 Though, for production is best to make use of the least privilidges. 

. Navigate to Cloud Functions, and take a note of the service account that is used.

 It might the App Engine service account which is created by default.

. Go back to the **IAM & admin** settings, and make sure the service account used by the Cloud Function,
 has the following roles:

 * BigQuery Admin
 * Pub/Sub Admin

#### Run the code locally

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

http://localhost:4200

## Start ChatServer Container

. Rename the file from the command-line, and edit:

    $ mv chatserver/my-app/env.txt chatserver/my-app/.env
    $ nano .env

 File contents:

  .. code-block:: bash

    GCLOUD_PROJECT=<PROJECT NAME>
    GOOGLE_APPLICATION_CREDENTIALS=<LOCATION OF YOUR SERVICE ACCOUNT FILE>


. Run:

```
cd chatserver/my-app
node app.js
```
