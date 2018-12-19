

# Google Cloud - Dialogflow Enterprise Demo

**By Lee Boonstra, Customer Engineer @ Google Cloud.**

![alt text](https://github.com/savelee/kube-django-ng/blob/master/images/architecture1.png "Containers")

This demo, showcases a dummy banking portal.
It exists of the following containers:

* Web Front-end - An Angular app (**front-end** folder)
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


**Disclaimer: This example is made by Lee Boonstra. Written code can be used as a baseline, it's not meant for production usage.**

**Copyright 2018 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreements with Google.**  

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

1. You can create a `Service Account key file`. This file can be used to
   authenticate to Google Cloud Platform services from any environment. To use
   the file, set the ``GOOGLE_APPLICATION_CREDENTIALS`` environment variable to
   the path to the key file, for example:

        export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json

* [Application Default Credentials]( https://cloud.google.com/docs/authentication#getting_credentials_for_server-centric_flow)
* [Additional scopes](https://cloud.google.com/compute/docs/authentication#using)
* [Service Account key file](https://developers.google.com/identity/protocols/OAuth2ServiceAccount#creatinganaccount)


### Install Dependencies

1. Install [Node](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/get-npm) if you do not already have them.

1. (optional) Install Python 2.7

1. Install [Angular CLI](http://cli.angular.io) - 
`npm install -g @angular-cli`

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


### Setup Storage Bucket

1. Choose in the left hand menu: **Storage**

1. Click **Create Bucket**

1. Give the bucket a unique name, for example: `myname-futurebank`

1. Choose **Regional**

1. Set a **location**

1. Click **Create**


### Setup Cloud Functions

1. Choose in the left hand menu: **Cloud Functions**

1. Click **Create Function**

1. Name: **chatanalytics**

1. Select Trigger: **Cloud Pub/Sub**

1. Choose topic: **user-content**

1. Runtime: Node JS 8 (beta)

1. Paste the contents of *cloudfunctions/chatanalytics/index.js* into the **index.js** textarea

1. Paste the contents of *cloudfunctions/chatanalytics/package.json* into the **package.json** textarea (tab)

1. The function to execute is: **subscribe**

1. Set the following environment variables:

```
DATASET=chatanalytics
TABLE=chatmessages
```

1. Click **Create**

### Setup Service Account

1. Download the Service Account Key

1. Open http://console.cloud.google.com, and navigate to *APIs & Services > Credentials*.

1. Click **Create Credentials**

1. Select **Dialogflow Integrations**

1. Give it the name: *master.json*,  - select for now Project Owner (in production, you might want to fine tune this on least privaliges)

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
cd front-end
npm install
ng serve
```

The Front-end can be reached via http://localhost:4200

### Start ChatServer Container

In case you want to run this for the first time:

1. Rename the file from the command-line, and edit:

   ```
   cd ../chatserver/my-app/
   npm install
   mv env.txt .env
   nano .env
   ```

1. Modify the code:

   ```
   GCLOUD_PROJECT=<PROJECT NAME>
   GOOGLE_APPLICATION_CREDENTIALS=<LOCATION OF YOUR SERVICE ACCOUNT FILE>
   ```

1. Then run on the command-line:

   ```
   node app.js
   ```

## Dialogflow Demo flow:

1. First explain the concepts of Dialogflow: http://console.dialogflow.com

 Dialogflow has Natural Language Understanding (Machine Learning). The chatbots work through
 intent matching. The user trains user trained phrases. As soon as Dialogflow detects a match
 with the intent with the highest confidence level, it returns the answer.

 Show the **Use Case 1 - transfer money intent** and explain how to setup:

 * Intents (User phrases & Responses)
 * Entities
 * Fulfillments
 * Integrations

1. Open http://localhost:4200

1. Navigate to the **Support** tab.

1. Use the following chatflow:

   ```
   U: I would like to transfer money
   > To which bank account number?
   U: IBAN1233435
   > How much would you like to tranfer?
   U: 100 euro
   > To which country?
   U: Germany
   > Alright! I will tranfer 100 euro to IBAN1233435 Germany.
   ```
    
1. Now navigate to the **Dashboard** and explain the following:

    * We have collected x amount of messages over time.
    * x amount of these messages contained negative user sentiment.
    * Explain that we will optimize our chatbot based on the feedback of our users.
    * Let's query on the session id, to figure out what went wrong, and read the transcript.
    * Explain how this was built, by showing the architecture, and mentioning all the GCP components.

1. In case you want to demonstrate the Knowledge Base Connector:

    * Show http://localhost:4200/faq/faq.html explain you want to import these FAQs in Dialogflow
    * Make sure you enabled **Enable Beta features & API** in the Dialogflow Settings panel.
    * Click on the **Knowledge** menu item.
    * Create a new Knowledge Base: **Future Bank**
    * Click **Create the first one**.
    * Document name: **Bank FAQ**, Knowledge type: **FAQ**, Mime type: **text/html**
    * See the below note, or use this URL: http://www.futurebank.nl/assets/html/faq/faq.html
    * Click **Save**, Dialogflow will crawl your page, and index Question & Answer pairs.
    * Click **Add response**
    * Give it the following reponse: `$Knowledge.Answer[1]`
    * Click **Save**, wait till it got trained, and test with the following question:


    ```
    U: When did they form the Future Bank?
    >The Future Bank is a conceptional demo project. 
    If Google were to start a bank, what would it look like?
    ```

*NOTE: In order to make the KB Connector work with your own FAQ pages, you will need a public available HTML website with (server generated) HTML. The website will need to allow Google Robots, and needs to be added to the Google search engine. (pages.github won't work.) 
You will need more than one Q&A pair and not more than 200.
It helps when you use valid HTML5 markup for your Q&As, and base it on schema.org notations.
See the markup of: https://github.com/savelee/kube-django-ng/blob/master/front-end/src/assets/html/faq/faq.html for a good overview.*

## AutoML Demo flow:

TODO



## File Server OCR demo

A common use case for every business, is the digitalization of documents.
Scanned Documents as PDF, JPG, TIFF. To get text from these documents or images,
and process it, we can make use of the OCR detection of the Vision API.
An architecture could look like this diagram:

![alt text](https://github.com/savelee/kube-django-ng/blob/master/images/fileananalytics-architecture.png "File Server")

### Start Fileserver Container

In case you want to run this for the first time:

1. Go to your Google Cloud console: http://console.cloud.google.com
Navigate to **Storage** and create a new bucket.

1. Enable the Vision API: https://console.cloud.google.com/flows/enableapi?apiid=vision.googleapis.com

1. Rename the file from the command-line, and edit:

   ```
   cd ../fileserver/
   npm install
   mv env.txt .env
   nano .env
   ```

1. Modify the code:

   ```
    GCLOUD_PROJECT=<PROJECT NAME>
    GOOGLE_APPLICATION_CREDENTIALS=<LOCATION OF YOUR SERVICE ACCOUNT FILE>
    GCLOUD_STORAGE_BUCKET=<NAME_OF_MY_STORAGE_BUCKET>
    TOPIC=file-content
    DATASET=fileanalytics
    TABLE=fileresults
   ```

1. Then run on the command-line:

   ```
   node app.js
   ```
   
### Setup Cloud Functions

1. Click **Create Function**

1. Name: **fileanalytics**

1. Select Trigger: **Cloud Pub/Sub**

1. Choose topic: **file-content**

1. Runtime: Node JS 8 (beta)

1. Paste the contents of *cloudfunctions/filestorage/fileanalytics/index.js* into the **index.js** textarea

1. Paste the contents of *cloudfunctions/filestorage/fileanalytics/package.json* into the **package.json** textarea (tab)

1. The function to execute is: **subscribe**

1. Set the following environment variables:

```
DATASET=fileanalytics
TABLE=fileresults
```

1. Click **Create**

1. Click **Create Function**

1. Name: **pdfcontents**

1. Select Trigger: **Cloud Storage**

1. Choose bucket: **myname-futurebank**

1. Runtime: Node JS 8 (beta)

1. Paste the contents of *cloudfunctions/filestorage/pdfcontents/index.js* into the **index.js** textarea

1. Paste the contents of *cloudfunctions/filestorage/pdfcontents/package.json* into the **package.json** textarea (tab)

1. The function to execute is: **onFileStorage**

1. Set the following environment variables:

```
TOPIC=file-content
GCLOUD_STORAGE_BUCKET = myname-futurebank
```
1. Click **Create**

### Fileserver Demo flow:

1. In the front-end website, navigate to the **Transfer** tab

1. Choose: **Upload Receipt**

1. Upload, PDF, TIFF or JPEG files. (See the *fileserver/testfiles/* folder for example files)

1. After the upload process, have a look into the Cloud Storage bucket **myname-futurebank**,
you should see the uploaded asset, as well a JSON representation retrieved through the DOCUMENT DETECTION of the Vision API.

1. Navigate to https://bigquery.cloud.google.com and query the fileresults table, to get the insights:

`SELECT * from `fileanalytics.fileresults` where PATH filename LIMIT 10`


## Deploy your code to GKE with Cloud Builder

1. Create a GKE Cluster:

    `gcloud container clusters create futurebank --region europe-west1-c --num-nodes 1 --enable-autoscaling --min-nodes 1 --max-nodes 4`

1. Set your **PROJECT_ID** variable, which points to your GCP project id. For example:

    `export PROJECT_ID=gke-pipeline-savelee-192517`
    `export GCLOUD_STORAGE_BUCKET=leeboonstra-visionocr`

1. Navigate to the root of this repository.

1. Create a secret from your service account **master.json** key

    `kubectl create configmap chatserver-config --from-literal "GCLOUD_PROJECT=${PROJECT_ID}" --from-literal "TOPIC=user-content" --from-literal "DATASET=chatanalytics" --from-literal "TABLE=chatmessages"`
    `kubectl create configmap fileserver-config --from-literal "GCLOUD_PROJECT=${PROJECT_ID}" --from-literal "TOPIC=file-content" --from-literal "DATASET=fileanalytics" --from-literal "TABLE=fileresults" --from-literal "GCLOUD_STORAGE_BUCKET=${GCLOUD_STORAGE_BUCKET}"`
    `kubectl create secret generic credentials --from-file=master.json`

1. Fix paths to your images of the **-deployment.yaml** & **setup** files (in the cloudbuilder folder) to match the container names in your Container Registry.

1. When you setup your cluster for the first time, you can run this command from the root directory:

    `gcloud builds submit --config cloudbuilder/setup.yaml`

1. In case you want to re-deploy individual containers, run the following build scripts:

   `gcloud builds submit --config cloudbuilder/chatserver.yaml`

   `gcloud builds submit --config cloudbuilder/front-end.yaml`

   `gcloud builds submit --config cloudbuilder/django.yaml`

1. To delete deployments use:

   `kubectl delete deployment front-end`

1. To deploy another deployment:

   `kubectl apply -f cloudbuilder/front-end-deployment.yaml`

1. Get a static IP:

  A domain name is needed for an SSL certificate. We also want to create a fixed ‘A record’ for it on the name registrar. With an Ingress, the external IP keeps changing as it is deleted and created. We can solve this problem on GCP by reserving an external IP address which we can then assign to the Ingress each time.

  https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address

  `gcloud beta compute --project=${PROJECT_ID} addresses create futurebank --global --network-tier=PREMIUM`

1. Now setup the services and ingress loadbalancer:

    `kubectl apply -f cloudbuilder/ingress.yaml`

    *NOTE: The important thing here is specifying the type of the Service as NodePort . This allocates a high port on each node in the cluster which will proxy requests to the Service.
    Google’s Load Balancer performs health checks on the associated backend service. The service must return a status of 200. If it does not, the load balancer marks the instance as unhealthy and does not send it any traffic until the health check shows that it is healthy again.*


1. Attach a domain name:

  To have browsers querying your domain name (such as example.com) or subdomain name (such as blog.example.com) point to the static IP address you reserved, you must update the DNS (Domain Name Server) records of your domain name. You must create an **A (Address) type DNS record** for your domain or subdomain name and have its value configured **with the reserved external IP address**.
