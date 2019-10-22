

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Google Cloud / Dialogflow - Banking Portal Demo

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

Everytime a message comes in, the message will be passed to the NLP API to detect the sentiment, DLP API to remove sensitive information
and to BigQuery. We run the BigQuery queries in a real-time dashboard on the front-end.
The **bq** folder contains sample the queries.

On top of this, this project contains an continious integration flow. Conversational designers can work in a **Dev Dialogflow Agent**.
Changes made, can be pushed to a **Test Dialogflow Agent**, by copying the contents in **Cloud Storage**, which will show the differences in a test screen on the front-end. From there, you
can run *unit tests* on the conversations, before
deploying it to the **Production Dialogflow Agent.**


[![Banking Portal Demo](https://img.youtube.com/vi/KhB0hwlyZkg/3.jpg)](https://youtu.be/KhB0hwlyZkg?t=298)

* [Video Banking Portal Demo](https://youtu.be/KhB0hwlyZkg?t=298)

**Disclaimer: This example is made by Lee Boonstra. Written code can be used as a baseline, it's not meant for production usage.**

**Copyright 2018 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreements with Google.**  

### Automatic Setup on Google Cloud Platform:

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fsavelee%2Fkube-django-ng&cloudshell_tutorial=cloudbuilder/TUTORIAL.md)

Guided one click installation from Google Cloud Shell. No client tooling required.

### Manual Setup / Run Locally

#### Setup Google Cloud

1.  Download and install the [Google Cloud
    SDK](https://cloud.google.com/sdk/docs/), which includes the
    [gcloud](https://cloud.google.com/sdk/gcloud/) command-line tool.

2. Open the Google Cloud Console: http://console.cloud.google.com

3. Make sure a Billing Account is setup & linked. (Select Billing in Main Menu)

4.  Create a [new Google Cloud Platform project from the Cloud
    Console](https://console.cloud.google.com/project) or use an existing one.

    Click the + icon in the top bar.
    Enter an unique project name. For example: *yourname-examples*.
    It will take a few minutes till everything is ready.

5. Initialize the Cloud SDK:
    

        $ gcloud init
        2 (Create a new configuration)
        yourname-examples
        (login)
        list
        #number-of-choice
        y

6. Install Kubectl: `gcloud components install kubectl`

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

2. Install Python3.6: `brew install python3`
3. Install pip: `sudo easy_install pip3`
4. Install virtualenv: `sudo pip3 install virtualenv`

5. Install [Angular CLI](http://cli.angular.io) - 
`npm install -g @angular-cli`

### Setup Chatbase

1. Navigate to http://www.chatbase.com/bots and login
2. Create a new bot
3. Copy the API_KEY to *env.txt* into the **MY_CHATBASE_KEY** variable.

### Setup Cloud Resources

1. (Optional) In case you only want to run the demo locally, you can comment out the part of GKE in the **setup.sh** script.
2. Create a Google Cloud Project, and assign a Billig Account to it.
3. Run: `gcloud config set project <cloud project id>`
4. Run: `. setup.sh`
   
## Run the code locally

### Run Django CMS

In case you want to run this for the first time:

```
virtualenv -p python3 myenv
source myenv/bin/activate .
chmod +x /usr/local/bin/django-admin.py
pip3 install -r requirements.txt
python3 manage.py migrate
python3 manage.py createsuperuser
```

Run on the command-line:

```
cd server/
source myenv/bin/activate .
python3 manage.py runserver 8080
```

SSH into the Django POD and run the following commands:

`kubectl exec -it [podname] -- /bin/bash`
`python manage.py migrate`
`python manage.py collectstatic`
`python manage.py createsuperuser`
`exit;`

For example: kubectl exec -it django-585776b9f-wx52b  -- /bin/bash
kubectl exec -it front-end-79bb7f4f45-jw7p9-- /bin/bash

Django can be reached via http://localhost:8080

### Run the Front-end Container

Run on the command-line:

```
cd front-end
npm install
ng serve
```

The Front-end can be reached via http://localhost:4200

### Run the ChatServer Container

In case you want to run this for the first time:

1. Rename the file from the command-line, and edit:

   ```
   cd ../chatserver/my-app/
   npm install
   mv env.txt .env
   nano .env
   ```

2. Modify the code:

   ```
   GCLOUD_PROJECT=<PROJECT NAME>
   GOOGLE_APPLICATION_CREDENTIALS=<LOCATION OF YOUR SERVICE ACCOUNT FILE>
   ```

3. Then run on the command-line:

   ```
   npm start
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

