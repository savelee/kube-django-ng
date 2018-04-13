from .models import Game
from rest_framework import serializers

class GameSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Game
        fields = ('author', 'id', 'name', 'platform', 'genre', 'publisher', 'release_date', 'description', 'image', 'rating', 'on_wish_list')
