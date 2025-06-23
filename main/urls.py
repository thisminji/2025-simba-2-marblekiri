from django.urls import path
from .views import *

#media 기초세팅
from django.conf import settings 
from django.conf.urls.static import static

urlpatterns = [
    # opening 
    path('', start_page, name="start"),
    path('game_start/', game_start, name='game_start'),
    
    ########################################################
    #setting
    path('setup/', setup_page, name="setup"),
    
    ########################################################
    #game 
    path('game/', game_page, name="game"),
    path('handle_action/', handle_action, name="handle_action"),
    path('move_player/', move_player, name="move_player"),
    
    #######################################################
    #custom
    path('custom_questions/', custom_questions, name="custom_questions"),
    path("submit_ready/", submit_ready, name="submit_ready"),

    #######################################################
    #result
    path('end_game/', end_game, name="end_game"),
    path('result/', result_page, name="result"),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
