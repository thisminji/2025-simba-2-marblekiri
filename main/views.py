from django.shortcuts import render, redirect
from .models import *
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.timezone import now
import random
from django.template.loader import render_to_string

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
        request.session['theme'] = theme  # ✅ 세션에 저장

        # custom이면 세션에 저장된 목록, 그 외는 폼에서 가져오기
        if theme == 'custom':
            player_names = request.session.get('players', [])
        else:
            player_names = request.POST.getlist('players[]')
        # 이름이 none이거나 공백인 값 제거하여 유효한 플레이어 이름만 남기기
        player_names = [name for name in player_names if name and name.strip()]
        max_turns = request.POST.get('max_turns')

        # 랭킹 보기 체크여부 확인
        if theme != "custom":
            show_ranking = request.POST.get('show_ranking') == 'on'
            request.session['show_ranking'] = show_ranking
        # else일 때는 custom_questions에서 이미 설정됨

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
    theme = request.session.get('theme')
    players = list(PlayerInRoom.objects.filter(room=room).order_by('turn'))
    total_players = len(players)
    show_ranking = request.session.get('show_ranking', True)
    print("🌟 game_page에서 show_ranking =", show_ranking)

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
        'theme' : theme,
        'current_player': current_player,
        'prev_player': prev_player,
        'next_player': next_player,
        'current_round': room.current_round,
        'ranking': ranking,
        'show_ranking': show_ranking,
        'current_tile_index': current_tile_index,
        'current_question': current_question,
    })


# 민지수정
### 2) 말 이동
def move_player(request):
    steps = int(request.GET.get("steps", 1))               # 주사위로 몇 칸 이동할지 가져옴
    room_id = request.session.get("room_id")               # 현재 게임방 ID
    if not room_id:
        return redirect('start')

    room = GameRoom.objects.get(id=room_id)
    current_pos = request.session.get("index", 0)          #현재 위치 저장 (출발점)

    if steps == 0:  # step == 0이면 이동 없이 현재 위치만 반환
        tile = Tile.objects.get(room=room, index=current_pos)
        return JsonResponse({
            'prev_index': current_pos,                     #출발 = 도착
            'index': current_pos,
            'mission': tile.question.content if tile.question else None
        })

    # 보드판은 20칸이므로 나머지 계산으로 반복 가능하게 함
    new_pos = (current_pos + steps) % 20
    request.session["index"] = new_pos                     #세션에 새 위치 저장

    # 이동한 칸의 미션 불러오기
    tile = Tile.objects.filter(room=room, index=new_pos).first()

    # 이동 결과를 JSON으로 반환 (출발 + 도착 + 미션 포함)
    return JsonResponse({
        'prev_index': current_pos,                         # 출발 위치
        'index': new_pos,                                  #도착 위치
        'mission': tile.question.content if tile and tile.question else None
    })




### 마시기 카운트
def process_action(player, action):
    print("Process_action 실행 !")
    if action == "drink":
        player.drink_count += 1
        print("▶️ 받은 player:", player, " / 카운트 : ", player.drink_count)
        player.save()

### 턴 & 바퀴 증가 + 게임 종료 조건 체크
def advance_turn(room, total_players):
    room.current_turn_index += 1
    if room.current_turn_index % total_players == 0:
        room.current_round += 1

    # 게임 종료 조건
    if room.max_turns and room.current_round > room.max_turns:
        room.current_round -= 1
        room.save()
        return True  # 게임 종료

    room.save()
    return False  # 계속 진행

### 마셔!, 통과! / 랭킹 / 플레이어 턴 처리
@csrf_exempt
def handle_action(request):
    print("✅ handle_action 진입됨")

    try:
        if request.method != "POST":
            print("❌ 잘못된 요청 방식")
            return JsonResponse({'error': 'Invalid request'}, status=400)
        

        room_id = request.session.get('room_id')
        room = GameRoom.objects.get(id=room_id)
        players = PlayerInRoom.objects.filter(room=room).order_by('turn')
        print("room_id:", room_id)

        total_players = players.count()
        current_index = room.current_turn_index % total_players
        current_player = players[current_index]

        action = request.POST.get("action")
        print("▶️ 받은 action:", action)
        process_action(current_player, action)

        # ✅ ranking 리스트 생성
        ranking = sorted(players, key=lambda p: -p.drink_count)[:3]
        ranking_data = [
            {'nickname': p.nickname, 'drink_count': p.drink_count}
            for p in ranking
        ]

        #종료조건
        is_game_over = advance_turn(room, total_players)
        if is_game_over:
            print("🎉 게임 종료!")
            return JsonResponse({'end_game': True})
        

        # 🔁 여기서 players / index 다시 계산해야 반영됨
        players = list(PlayerInRoom.objects.filter(room=room).order_by('turn'))  # 다시 불러오기 (선택사항)
        new_index = room.current_turn_index % total_players
        prev_index = (new_index - 1) % total_players
        next_index = (new_index + 1) % total_players

        # ✅ ranking 리스트 생성
        ranking = sorted(players, key=lambda p: -p.drink_count)[:3]
        ranking_data = [
            {'nickname': p.nickname, 'drink_count': p.drink_count}
            for p in ranking
        ]

        return JsonResponse({
            'end_game': False,
            'current_turn': room.current_turn_index,
            'round': room.current_round,
            'player_index': request.session.get("index", 0),  # 말 위치 업데이트할 경우 사용
            'ranking': ranking_data,
            'prev_player': players[prev_index].nickname,
            'current_player':  players[new_index].nickname,
            'next_player': players[next_index].nickname,
        })
    
    except Exception as e:
        print("❌ 서버 처리 중 예외 발생:", str(e))
        return JsonResponse({'error': str(e)}, status=500)
    

### 랭킹
@csrf_exempt
def get_ranking(request):
    room_id = request.session.get('room_id')
    room = GameRoom.objects.get(id=room_id)
    players = PlayerInRoom.objects.filter(room=room).order_by('-drink_count')
    # JSON으로 변환
    data = [
        {'nickname': p.nickname, 'drink_count': p.drink_count}
        for p in players
    ]
    return JsonResponse({'ranking': data})

########################### 🔹 커스텀 질문 ############################
### 커스텀 질문 입력 화면
def custom_questions(request):
    theme = request.session.get('theme')

    # POST로 받은 플레이어, 랭킹 정보 처리
    if request.method == "POST":
        players = request.POST.getlist('players')
        show_ranking = request.POST.get('show_ranking') == 'on'

        request.session['players'] = players
        request.session['show_ranking'] = show_ranking


    else:
        players = request.session.get('players', [])

    return render(request, 'main/custom_questions.html', 
    {'players': players,
    'theme' : theme, }
    )

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
    theme = request.session.get('theme')
    return render(request, 'main/result.html',{
        'theme' : theme,
    })

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
    ranking = [(p.nickname, p.drink_count) for p in players]

    #랭킹 도출 여부
    show_ranking = request.session.get('show_ranking', True)

    # 라운드
    round_count = room.current_round

    #테마
    theme = request.session.get('theme')

    # DB 삭제
    Tile.objects.filter(room=room).delete()
    PlayerInRoom.objects.filter(room=room).delete()
    room.delete()
    Question.objects.filter(theme="custom").delete()

    # 세션 삭제
    del request.session['room_id']

    return render(request, 'main/result.html', {
        'room': room,
        'theme' : theme,
        'players' : players,
        'ranking': ranking,
        'show_ranking' : show_ranking,
        'play_time': play_time_text,
        'round_count': round_count,

    })

###############################################################################