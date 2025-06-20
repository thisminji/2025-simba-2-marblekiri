from django.shortcuts import render  # ✅ 반드시 있어야 함

def base_view(request):
    tile_numbers = range(1, 21)
    return render(request, 'shared/base.html', {'tile_numbers': tile_numbers})
