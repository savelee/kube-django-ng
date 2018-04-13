from django.contrib import admin
from django.conf.urls import url, include

from . import views

urlpatterns = [
    url(r'^$', views.overview, name='overview'),
    url(r'^games/(?P<pk>\d+)/$', views.game, name='game')
   # url(r'^games/new/$', views.game_new, name='game_new'),
   # url(r'^games/(?P<pk>\d+)/edit/$', views.game_edit, name='game_edit'),
   # url(r'^games/(?P<pk>\d+)/remove/$', views.game_remove, name='game_remove'),
]