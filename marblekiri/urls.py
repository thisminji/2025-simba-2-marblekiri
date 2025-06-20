"""
URL configuration for marblekiri project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from main import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.start_page, name="start"),
    path('setup/', views.setup_page, name="setup"),
    path('game_start/', views.game_start, name='game_start'),
    path('game/', views.game_page, name="game"),
    path('game/page/', views.game_page, name="game_page"),
    path('custom_questions/', views.custom_questions, name="custom_questions"),
    path('result/', views.result_page, name="result")
]
