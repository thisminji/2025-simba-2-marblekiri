from django.urls import path
from .views import *

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
    
    #######################################################
    #custom
    path('custom_questions/', custom_questions, name="custom_questions"),
    
    #######################################################
    #result
    path('result/', result_page, name="result"),
    
]
