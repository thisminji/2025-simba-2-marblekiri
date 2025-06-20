from django.urls import path
from .views import base_view

urlpatterns = [
    path('', base_view, name='home'),        
    path('base/', base_view, name='base'),
]
