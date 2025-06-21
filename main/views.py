from django.shortcuts import render, redirect
from .models import *
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.timezone import now
import random

########################### 🔹 시작 화면 · 세팅 ############################
### 홈 (게임 시작 전 첫 화면)
def start_page(request):
    return render(request, 'main/start.html')

### 게임 설정 페이지 (테마/인원/옵션 선택)
def setup_page(request):
    return render(request, 'main/setup.html')

### 랜덤 질문 추출 (테마, 개수에 따라)
def get_random_questions(theme, count):
    questions = Question.objects.filter(theme=theme)
    question_list = list(questions)
    return random.sample(question_list, min(count, len(question_list)))

### 게임 시작 시 방 생성 + 유저/타일 생성
def game_start(request):
    if request.method == "POST":
        theme = request.POST.get('theme')
        # custom이면 세션에 저장된 목록, 그 외는 폼에서 가져오기
        if theme == 'custom':
            player_names = request.session.get('players', [])
        else:
            player_names = request.POST.getlist('players[]')
        # 이름이 none이거나 공백인 값 제거하여 유효한 플레이어 이름만 남기기
        player_names = [name for name in player_names if name and name.strip()]
        max_turns = request.POST.get('max_turns')

        # 랭킹 보기 체크여부 확인
        show_ranking = request.POST.get('show_ranking') == 'on'  
        request.session['show_ranking'] = show_ranking 

        # 게임방 생성
        room = GameRoom.objects.create(
                theme=theme,
                max_turns=max_turns if max_turns else None,
                started=True  # 또는 False, 필요에 따라
            )
        
        # 질문 선택 및 타일 배치
        selected_questions = get_random_questions(theme, 20)

        for i, q in enumerate(selected_questions):
                Tile.objects.create(index=i, question=q, room=room)

        # 플레이어 생성 및 방에 배정
        for i, name in enumerate(player_names):
                PlayerInRoom.objects.create(nickname=name, room=room, turn=i)

        # room_id 세션에 저장 → 게임 상태 관리용
        request.session['room_id'] = room.id
        request.session["index"] = 0 # 게임 시작 시 위치 1으로 초기화
        return redirect('game')

########################### 🔹 게임 진행 ############################
### 게임 화면
def game_page(request):
    room_id = request.session.get('room_id')
    room = GameRoom.objects.get(id=room_id)
    players = list(PlayerInRoom.objects.filter(room=room).order_by('turn'))
    total_players = len(players)
    show_ranking = request.session.get('show_ranking', True)

    # 현재 턴 계산
    current_index = room.current_turn_index % total_players
    current_player = players[current_index]

    prev_index = (current_index - 1) % total_players
    next_index = (current_index + 1) % total_players

    prev_player = players[prev_index]
    next_player = players[next_index]

    # 랭킹 / 상위 3명만
    ranking = sorted(players, key=lambda p: -p.drink_count)[:3]

    # 현재 타일 
    current_tile_index = request.session.get("index", 0)
    try:
        tile = Tile.objects.get(room=room, index=current_tile_index)
        current_question = tile.question.content
    except Tile.DoesNotExist:
        current_question = ""

    # 타일 미션 질문 리스트
    tiles = Tile.objects.filter(room=room).order_by('index')

    return render(request, 'main/game.html', {
        'tiles': tiles,
        'players': players,
        'current_player': current_player,
        'prev_player': prev_player,
        'next_player': next_player,
        'current_round': room.current_round,
        'ranking': ranking,
        'current_tile_index': current_tile_index,
        'current_question': current_question,
        'show_ranking': show_ranking,
    })

### 2) 말 이동
def move_player(request):
    steps = int(request.GET.get("steps", 1))
    room_id = request.session.get("room_id")  # 현재 게임방
    if not room_id:
        return redirect('start')

    room = GameRoom.objects.get(id=room_id)
    current_pos = request.session.get("index", 0)

    
    #if steps == 0: # step==0이면 이동하지 않음
    #    tile = Tile.objects.get(room=room, index=current_pos)
    #    return JsonResponse({
    #        'index': current_pos,
    #       'mission': tile.question.content if tile.question else None
    #    })

    # 보드판 계속 돌 수 있도록 나머지 계산하여 구현
    new_pos = (current_pos + steps) % 20
    request.session["index"] = new_pos
    
    # 이동한 칸의 미션을 db에서 가져옴
    tile = Tile.objects.filter(room=room, index=new_pos).first() 

    #json 형식 반환
    return JsonResponse({'index': new_pos, 'mission': tile.question.content})


### 마셔! / 통과! 처리 + 턴 & 바퀴 증가 + 게임 종료 조건 체크
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

        # 자동 종료 조건 (턴 수 설정 시)
        if room.max_turns and room.current_round > room.max_turns:
            room.current_round -= 1
            room.save()
            return redirect('end_game')
        
        room.save()
        
    return redirect('game')

########################### 🔹 커스텀 질문 ############################
### 커스텀 질문 입력 화면
def custom_questions(request):
    players = request.GET.getlist('players')
    if players:
        # 커스텀 인원 세션 저장
        request.session['players'] = players
    print(request.GET.getlist('players'))
    return render(request, 'main/custom_questions.html', {'players': players})

### 커스텀 질문 등록 + 세션에 인원 저장
def submit_ready(request, zone_code):
    if request.method == "POST":
        questions = request.POST.getlist('questions[]')
        # 이름 하나만 받기
        player = request.POST.get('player', '').strip()
        if not player:
            return JsonResponse({'error': '플레이어 이름이 없습니다.'}, status=400)

        for q in questions:
            Question.objects.create(theme="custom", content=q)

        # 처음 한 명은 빈리스트에서 시작하여 name 저장
        player_names = request.session.get('players', [])
        player_names.append(player)
        request.session['players'] = player_names
        request.session['theme'] = 'custom'

        return JsonResponse({})

########################### 🔹 게임 종료 처리 ############################
### 결과 요약 화면 (데이터 없이 접근 시 예비용)
def result_page(request):
    return render(request, 'main/result.html')

### 게임 종료 처리 → 기록 정리 + 요약 정보 전달
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