# Google Cloud - Chatbot Platform Demo

**By Lee Boonstra, Developer Advocate @ Google Cloud.**

## Setup Steps

### Setup Chatbase

1. Navigate to http://www.chatbase.com/bots and login

1. Create a new bot

1. Copy the API_KEY to *chatserver/env.txt* into the **MY_CHATBASE_KEY** variable.

### (Optional) prepare the environement variables.

Review *.properties* & *chatserver/.env* and edit if needed.

### Run Setup Script

1. Create the following 3 projects, and assign billing accounts to it:

  - chatbotportal-prod
  - chatbotportal-test
  - chatbotportal-dev

2. Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

3. To start installation: `. setup.sh`

4. Create a Django Super User

First retrieve the pods, to get the podname of Django:

`kubectl get pods`

Then SSH into the Pod:
`kubectl exec -it [podname] -- /bin/bash`

Run the following commands to create a super user:
`python manage.py migrate`
`python manage.py collectstatic`
`python manage.py createsuperuser`
`exit;`


### Uninstall

**WARNING!!** This will delete everything installed during the Install step above

- Make sure `$PROJECT_ID` is set: `gcloud config set project $PROJECT_ID`

- To start uninstallation: `. teardown.sh`