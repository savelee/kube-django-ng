# How to install Django

This tutorial makes use of Python 2.7 with *pip*, and Django 1.9.
And a running MySQL server.

* https://www.python.org/downloads/

1. Install VirtualEnv:
`pip install virtualenv`

2. Setup virtualenv project:
`python -m virtualenv myenv`

3. Activate
`source myenv/bin/activate .`

4. Install all the requirements:
`pip install -r requirements.txt`

5. Create a inside *dockerextdjango/dockerextdjango* the following file:
*local_settings.py*:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'extdjango',
        'USER': 'mymysqlusername',
        'PASSWORD': 'mymsqlpassword',
        'HOST': '',
        'PORT': '',
        'OPTIONS': { "init_command": "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"}   
    }
}

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'g&mbsv)1yz$qp*&d5g$ym5eu^y0!b&)%kot4eac%2rh6&q*5(e'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
```

6. Executes the following SQL script on your MySQL server, you could
run mysql from the command-line (`mysql -u root -p`), or you can run PhPMyAdmin and run it from there.

```sql
CREATE DATABASE extdjango;
CREATE USER 'mymysqlusername'@'localhost' IDENTIFIED BY 'mymsqlpassword';
GRANT ALL PRIVILEGES ON extdjango.* TO 'mymysqlusername'@'localhost';
FLUSH PRIVILEGES;
```

7. Save the file, and run the following commands from the command-line, to use the database in your Python project:

`python manage.py check`
`python manage.py migrate`

8. Create a superuser account:
`python manage.py createsuperuser`

Now you are good, to go!

# Run Django

`python manage.py runserver 8080`

Test the following endpoint:
http://127.0.0.1:8080/users
and:
http://127.0.0.1:8080/users/?format=json

You should see your superuser account in a JSON feed.

# This application requires the docker ext client

https://github.com/savelee/docker-ext-client

You will need to edit the *client/app/utils/Contants.js* file to:
```javascript
Ext.define('Client.utils.Constants', {
    singleton: true,

    'LIVE_URL': window.location.protocol + "//" + window.location.host + ':8080',

    'TOKEN_PREFIX': 'JWT',
    'DISABLE_TOKEN': false
});
```

