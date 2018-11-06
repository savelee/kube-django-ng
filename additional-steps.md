## Setup AutoML NL

Click this link and enable:
https://pantheon.corp.google.com/flows/enableapi?project=gke-pipeline-savelee-192517&apiid=servicemanagement.googleapis.com,language.googleapis.com,serviceusage.googleapis.com,automl.googleapis.com,storage-component.googleapis.com,storage-api.googleapis.com


gcloud projects add-iam-policy-binding gke-pipeline-savelee-192517 \
>     --member="user:leeboonstra@google.com" \
>     --role="roles/automl.admin"


gcloud projects add-iam-policy-binding gke-pipeline-savelee-192517 \
>     --member="serviceAccount:custom-vision@appspot.gserviceaccount.com" \
>     --role="roles/storage.admin"

gsutil mb -p gke-pipeline-savelee-192517 \
>     -c regional    \
>     -l us-central1 \
>     gs://gke-pipeline-savelee-192517-lcm/

Go to: https://cloud.google.com/automl/ui/text


Click the New Dataset button in the title bar.

Upload the following CSV file:

TIP: Each label should have at least 100 text items for best results. To help put together the best dataset for your use case, read our data guidelines 

```
I want to block my card,cardagent
Please block my debit card,cardagent
Please sent me a new debit card,cardagent
Help my card got stolen,cardagent
My bank pass got stolen,cardagent
Can I get a new debitcard,cardagent
When will my card expire?,cardagent
When do I get a new card,cardagent
When will my debitcard expire?,cardagent
I've lost my debit card,cardagent
My debit card is stolen,cardagent
I want a new bank pass,cardagent
What are the cost for a new bank pass,cardagent
What are the costs for a new debit card,cardagent
I would like to receive a new debitcard,cardagent
Did you already sent me my new pass?,cardagent
Why does it take so long till I receive my new debit card,cardagent
Can I use my debit card overseas?,cardagent
Can I enable my pass for overseas?,cardagent
Can I use my debit card in other countries?,cardagent
I would like to transfer money,generalagent
I like to transfer money,generalagent
Transfer money to Germany,generalagent
IBAN 123213,generalagent
I would like to send money,generalagent
Send money,generalagent
Please send money,generalagent
Please transfer money,generalagent
What are the opening times of the bank?,generalagent
Is the website offline?,generalagent
Your website is down,generalagent
What's your phonenumber?,generalagent
How can I contact you?,generalagent
What is your address,generalagent
Are you located in Amsterdam,generalagent
How can I reach you,generalagent
Are you available on Whatsapp?,generalagent
On what hours can I reach you,generalagent
```
