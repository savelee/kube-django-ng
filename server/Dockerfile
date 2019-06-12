# https://cloud.google.com/python/django/kubernetes-engine

FROM gcr.io/google_appengine/python

LABEL maintainer="Lee Boonstra"

RUN virtualenv /env -p python3.6
ENV PATH /env/bin:$PATH

ADD ./requirements.txt ./
RUN pip install -r requirements.txt
RUN python manage.py migrate

ADD . /app

RUN chmod +x ./entrypoint.sh
CMD ./entrypoint.sh

CMD gunicorn -b :$PORT mysite.wsgi