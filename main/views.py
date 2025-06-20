from django.shortcuts import render, redirect
from .models import *
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import random


def start_page(request):
    return render(request, 'main/start.html')

def setup_page(request):
    return render(request, 'main/setup.html')

def get_random_questions(theme, count):
    questions = list(Question.objects.filter(theme=theme))
    return random.sample(list(questions), k=count)

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
                PlayerInRoom.objects.create(nickname=name, room=room, turn=i)

    request.session['room_id'] = room.id
    return redirect('game')

def game_page(request):
    room_id = request.session.get('room_id')
    if not room_id:
        return redirect('start')  # room_id 없으면 홈으로

    try:
        room = GameRoom.objects.get(id=room_id)
    except GameRoom.DoesNotExist:
        return redirect('start')

    # 모든 플레이어 (턴 순서 기준)
    players = PlayerInRoom.objects.filter(room=room).order_by('turn')

    # 전체 타일
    tiles = Tile.objects.filter(room=room).order_by('index')

    # 현재 턴 플레이어 계산
    total_players = players.count()
    if total_players == 0:
        current_player = None
    else:
        current_index = room.current_turn_index % total_players
        current_player = players[current_index]

    # drink_count 기준 내림차순 정렬 (랭킹)
    ranking = sorted(players, key=lambda p: -p.drink_count)

    return render(request, 'main/game.html', {
        'players': players,
        'tiles': tiles,
        'current_player': current_player,
        'ranking': ranking,
    })


#턴 넘기기 / 마시기 처리
@csrf_exempt
def handle_action(request):
    if request.method == "POST":
        room_id = request.session.get('room_id')
        room = GameRoom.objects.get(id=room_id)

        players = PlayerInRoom.objects.filter(room=room).order_by('turn')
        total_players = players.count()
        current_index = room.current_turn_index % total_players
        current_player = players[current_index]

        action = request.POST.get("action")  # "pass" or "drink"

        if action == "drink":
            current_player.drink_count += 1
            current_player.save()

        # 턴 넘기기 (둘 다 해당)
        room.current_turn_index += 1
        room.save()

        return redirect('game')


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