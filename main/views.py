from django.shortcuts import render

# Create your views here.

def opening_page(request):
    return render(request, 'main/opening_page.html')