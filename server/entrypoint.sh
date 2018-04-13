#!/bin/bash

echo "Collect Static files"
exec bin/python manage.py collectstatic --noinput
