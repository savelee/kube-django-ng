# Google Cloud - Dialogflow Enterprise Demo

**By Lee Boonstra, Customer Engineer @ Google Cloud.**

## Setup Steps

- Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

- Set application version: `VERSION` in `properties` if required (default is 1.0.0)

- To start installation: `./setup.sh`

Check for the endpoint address after deployment finishes (can take 10-15 mins)

### Setup the Dialogflow Agent

1. (optional) In the cloud console, search for Dialogflow API

1. On the left hand side, select **Dialogflow Agent**

1. Click on **Open or Create Agent at dialogflow.com**

1. Select your google account

1. Allow the terms & conditions

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

## Uninstall

**WARNING!!** This will delete everything installed during the Install step above

- Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

- To start uninstallation: `./teardown.sh`