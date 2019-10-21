# Google Cloud - Chatbot Platform Demo

**By Lee Boonstra, Developer Advocate @ Google Cloud.**

## Setup Steps

### Setup Chatbase

1. Navigate to http://www.chatbase.com/bots and login

1. Create a new bot

1. Copy the API_KEY to *env.txt* into the **MY_CHATBASE_KEY** variable.

### (Optional) prepare the environement variables.

Review *.properties* & *chatserver/.env* and edit if needed.

### Run Setup Script

1. Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

2. To start installation: `. setup.sh`

Check for the endpoint address after deployment finishes (can take 10-15 mins)

## Uninstall

**WARNING!!** This will delete everything installed during the Install step above

- Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

- To start uninstallation: `. teardown.sh`