from django.shortcuts import render, get_object_or_404,redirect

from rest_framework import viewsets

from .serializers import GameSerializer
from .models import Game
from .forms import GameForm


def overview(request):
    #games = Game.objects.filter(published_date__lte=timezone.now()).order_by('published_date')
    games = Game.objects.all();
    return render(request, 'overview.html', {'games': games})

def game(request, pk):
    game = get_object_or_404(Game, pk=pk)
    return render(request, 'game.html', {'game': game})  

def game_edit(request, pk):
    game = get_object_or_404(Game, pk=pk)
    if request.method == "POST":
        form = GameForm(request.POST, instance=game)
        if form.is_valid():
            game = form.save(commit=False)
            game.author = request.user
            game.save()
            return redirect('game', pk=game.pk)
    else:
        form = GameForm(instance=game)
    return render(request, 'form.html', {'form': form})

def game_remove(request, pk):
    game = get_object_or_404(Game, pk=pk)
    game.delete()
    return redirect('overview')

def game_new(request):
    if request.method == "POST":
        form = GameForm(request.POST)
        if form.is_valid():
            game = form.save(commit=False)
            game.author = request.user
            game.save()
            return redirect('game', pk=game.pk)
    else:
        form = GameForm()

    return render(request, 'form.html', {'form': form})

"""REST FRAMEWORK"""

class GamesViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Game.objects.all().order_by('release_date')
    serializer_class = GameSerializer
