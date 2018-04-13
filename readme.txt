virtualenv -p python3 myenv
source myenv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8080

(remove deployment and service)
gcloud container builds submit --config cloud.yaml .
kubectl expose deployment my-app --type="LoadBalancer"

https://dialogflow.com/docs/reference/v2-auth-setup
https://cloud.google.com/docs/authentication/production
https://github.com/kelseyhightower/gke-service-accounts-tutorial