#!/bin/bash

echo "Collect Static files"
exec bin/python manage.py collectstatic --noinput

# Apply database migrations
echo "Apply database migrations"
exec bin/python manage.py migrate