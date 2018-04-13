from django import forms
from .models import Game

class GameForm(forms.ModelForm):
    class Meta:
        model = Game
        fields = ('author', 'id', 'name', 'platform', 'genre', 'publisher', 'release_date', 'description', 'image', 'rating', 'on_wish_list')
