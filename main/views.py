from django.shortcuts import render, redirect
from .models import *
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.timezone import now


import random


def start_page(request):
    return render(request, 'main/start.html')

def setup_page(request):
    return render(request, 'main/setup.html')

def get_random_questions(theme, count):
    questions = Question.objects.filter(theme=theme)
    question_list = list(questions)
    return random.sample(question_list, min(count, len(question_list)))

#######################################################################

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
    request.session["index"] = 1 # 게임 시작 시 위치 1으로 초기화
    return redirect('game')


###########################################################################
###게임 상태 관리
#1) 게임
def game_page(request):
    room_id = request.session.get('room_id')
    room = GameRoom.objects.get(id=room_id)
    players = list(PlayerInRoom.objects.filter(room=room).order_by('turn'))
    total_players = len(players)

    current_index = room.current_turn_index % total_players
    current_player = players[current_index]

    prev_index = (current_index - 1) % total_players
    next_index = (current_index + 1) % total_players

    prev_player = players[prev_index]
    next_player = players[next_index]

    # drink_count 기준 내림차순 정렬 (랭킹) / 상위 3명만
    ranking = sorted(players, key=lambda p: -p.drink_count)[:3]


    return render(request, 'main/game.html', {
        'tiles': Tile.objects.filter(room=room).order_by('index'),
        'players': players,
        'current_player': current_player,
        'prev_player': prev_player,
        'next_player': next_player,
        'current_round': room.current_round,
        'ranking': ranking,
    })

#2) 말 이동
def move_player(request):
    steps = int(request.GET.get("steps", 1))
    room_id = request.session.get("room_id")  # 현재 게임방
    if not room_id:
        return redirect('start')

    room = GameRoom.objects.get(id=room_id)
    current_pos = request.session.get("index", 0)

    if steps == 0: # step==0이면 이동하지 않음
        tile = Tile.objects.get(room=room, index=current_pos)
        return JsonResponse({
            'index': current_pos,
            'mission': tile.question.content if tile.question else None
        })

    new_pos = (current_pos + steps) % 20 # 보드판 계속 돌 수 있도록 나머지 계산하여 구현

    request.session["index"] = new_pos

    tile = Tile.objects.get(room=room, index=new_pos) # 이동한 칸의 미션을 db에서 가져옴

    return JsonResponse({'index': new_pos, 'mission': tile.question.content})


#턴 넘기기 (턴 관리) / 마시기 처리
@csrf_exempt
def handle_action(request):
    if request.method == "POST":
        room_id = request.session.get('room_id')
        room = GameRoom.objects.get(id=room_id)
        players = PlayerInRoom.objects.filter(room=room).order_by('turn')

        #누구 턴인지 관리 
        total_players = players.count()
        current_index = room.current_turn_index % total_players
        current_player = players[current_index]

        # "pass" or "drink"
        action = request.POST.get("action") 
        if action == "drink":
            current_player.drink_count += 1
            current_player.save()

        # 턴 + 바퀴 증가
        room.current_turn_index += 1
        if room.current_turn_index % total_players == 0:
            room.current_round += 1
        room.save()

        # 자동 종료 조건 (턴 수 설정 시)
        if room.max_turns and room.current_round > room.max_turns:
            room.current_round -= 1
            return redirect('end_game')

    return redirect('game')

#############################################################################
### 커스텀

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

############################################################################
### 게임 종료
def result_page(request):
    return render(request, 'main/result.html')

#종료 조건
def end_game(request):

    room_id = request.session.get('room_id')
    if not room_id:
        return redirect('start')

    room = GameRoom.objects.get(id=room_id)
    
    # 이미지 저장
    result_image = request.FILES.get('image')
    if result_image:
        room.image = result_image
        room.save()


    # 플레이 시간 계산
    play_time = now() - room.started_at
    total_minutes = int(play_time.total_seconds() // 60)
    play_time_text = f"{total_minutes // 60}시간 {total_minutes % 60}분"

    # 랭킹 계산
    players = PlayerInRoom.objects.filter(room=room).order_by('-drink_count')[:3]

    # 삭제 전에 정보 보관
    ranking_data = [(p.nickname, p.drink_count) for p in players]
    round_count = room.current_round

    # DB 삭제
    Tile.objects.filter(room=room).delete()
    PlayerInRoom.objects.filter(room=room).delete()
    room.delete()
    Question.objects.filter(theme="custom").delete()

    # 세션 삭제
    del request.session['room_id']

    return render(request, 'main/result.html', {
        'room': room,
        'ranking': ranking_data,
        'play_time': play_time_text,
        'round_count': round_count,
    })

###############################################################################