from django.shortcuts import render, redirect
from .models import GameRoom, PlayerInRoom, User, Question, Tile
from django.http import JsonResponse

import random


def start_page(request):
    return render(request, 'main/start.html')

def setup_page(request):
    return render(request, 'main/setup.html')

def get_random_questions(theme, count):
    questions = Question.objects.filter(theme=theme)
    question_list = list(questions)
    return random.sample(question_list, min(count, len(question_list)))

def game_start(request):
    if request.method == "POST":
        player_names = request.POST.getlist('players[]')
        theme = request.POST.get('theme')
        max_turns = request.POST.get('max_turns')

        room = GameRoom.objects.create(
                theme=theme,
                max_turns=max_turns if max_turns else None,
                started=True  # 또는 False, 필요에 따라
            )
        selected_questions = get_random_questions(theme, 20)

        for i, q in enumerate(selected_questions):
                Tile.objects.create(index=i, question=q, room=room)

        for i, name in enumerate(player_names):
                user = User.objects.create(nickname=name)
                PlayerInRoom.objects.create(user=user, room=room, turn=i)

    request.session['room_id'] = room.id
    return redirect('game')

def game_page(request):
    room_id = request.session.get('room_id')
    room = GameRoom.objects.get(id=room_id)
    players = PlayerInRoom.objects.filter(room=room).order_by('turn')
    tiles = Tile.objects.filter(room=room).order_by('index')  # ← 타일도 가져오기


    return render(request, 'main/game.html', {'players': players, 'tiles': tiles})

def custom_questions(request):
    return render(request, 'main/custom_questions.html')

def submit_ready(request, zone_code):
    if request.method == "POST":
        questions = request.POST.getlist('questions[]')
        player_names = request.POST.getlist('players[]')

        for q in questions:
            Question.objects.create(theme="custom", content=q)

        request.session['players'] = player_names
        request.session['theme'] = 'custom'

        return JsonResponse({})

def result_page(request):
    return render(request, 'main/result.html')

def end_game(request):
    # custom 테마 질문 삭제
    Question.objects.filter(theme="custom").delete()
    
    # 결과 페이지로 이동
    return redirect('result')