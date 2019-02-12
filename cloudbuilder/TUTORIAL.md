# Google Cloud - Dialogflow Enterprise Demo

**By Lee Boonstra, Customer Engineer @ Google Cloud.**

## Setup Steps

### Setup the Dialogflow Agent

1. (optional) In the cloud console, search for Dialogflow API

2. On the left hand side, select **Dialogflow Agent**

3. Click on **Open or Create Agent at dialogflow.com**

4. Select your google account

5. Allow the terms & conditions

6. Give your agent the name **ContactCenterDemo**

7. For language choose: **English**

8. For time zone choose: **Europe/Madrid**

9. Click **Create**
 
### Configure Dialogflow

1. In the left hand menu, click the **Upgrade button**

1. Choose **Enterprise Edition Essentials**

1. Click on the **gear** icon, in the left menu, next to your project name.

1. Enter the following agent description: **Contact Center Demo**

1. Click: **Enable beta features & APIs**

1. Click **Save**

1. Click on **Export & Import**

1. On your hard drive navigate to *chatserver/dialogflow* zip this folder, and then **Import from Zip** in the Dialogflow settings screen. These are some example chatbot dialogs.

### Setup Chatbase

1. Navigate to http://www.chatbase.com/bots and login

1. Create a new bot

1. Copy the API_KEY to *env.txt* into the **MY_CHATBASE_KEY** variable.

### Prepare the environement variables.

1. Modify Chat Container environment variables

   ```
   cd ../chatserver/my-app/
   nano env.txt
   mv env.txt .env
   ```

1. Modify File Server  Container environment variables

   ```
   cd ../fileserver/my-app/
   nano env.txt
   mv env.txt .env
   ```
   
### Run Setup Script

1. Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

2. Set application version: `VERSION` in `properties` if required (default is 1.0.0)

3. To start installation: `./setup.sh`

Check for the endpoint address after deployment finishes (can take 10-15 mins)

## Uninstall

**WARNING!!** This will delete everything installed during the Install step above

- Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

- To start uninstallation: `./teardown.sh`