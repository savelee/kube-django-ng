from django.conf import settings
from django.db import models

class Game(models.Model):
    PLATFORMS = (
        (0, 'Choose'),
        (1, 'PS4'),
        (2, 'PS3'),
        (3, 'PS Vita'),
        (4, 'WII U'),
        (5, 'WII'),
        (6, '3DS'),
        (7, 'PC'),
        (8, 'XBONE'),
        (9, 'XBOX 360'),
        (10, 'iOS'),
        (11, 'Android'),
    )

    GENRES = (
        (0, 'Choose'),
        (1, 'Adventure'),
        (2, 'Action'),
        (3, 'Fighter'),
        (4, 'Music'),
        (5, 'Platformer'),
        (6, 'Puzzle'),
        (7, 'Racing'),
        (8, 'RPG'),
        (9, 'Sports'),
        (10, 'Strategy'),
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    
    name = models.CharField(max_length=200)
    publisher = models.CharField(max_length=200, blank=True, null=True)
    image = models.CharField(max_length=200, blank=True, null=True)
    platform = models.IntegerField(choices=PLATFORMS)
    genre = models.IntegerField(choices=GENRES)

    rating = models.IntegerField(blank=True, null=True)
    on_wish_list = models.BooleanField(blank=True)
    description = models.TextField(blank=True, null=True)

    release_date = models.DateField(
            blank=True, null=True)

    def publish(self):
        self.save()

    def getGenre(self):
        return self.GENRES[self.genre][1]

    def getPlatform(self):
        return self.PLATFORMS[self.platform][1]

    def __str__(self):
        return self.name
