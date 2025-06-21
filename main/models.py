from django.db import models
from django.utils import timezone

class GameRoom(models.Model):
    theme = models.CharField(max_length=30)
    started = models.BooleanField(default=False)
    max_turns = models.PositiveIntegerField(null=True, blank=True) #null 일 때 무제한
    current_turn_index = models.PositiveIntegerField(default=0) #턴 관리 (1번님 턴 - 2번님 턴)
    current_round = models.PositiveIntegerField(default=1)      # 바퀴 수 (1라운드 - 2라운드)
    started_at = models.DateTimeField(auto_now_add=True)  # 게임 시작 시간 저장
    image = models.ImageField(upload_to="result_image/", blank=True, null=True) # 이미지 저장


class PlayerInRoom(models.Model):
    nickname = models.CharField(max_length=30, default="익명")
    room = models.ForeignKey(GameRoom, on_delete=models.CASCADE)
    turn = models.PositiveIntegerField()
    is_ready = models.BooleanField(default=False)
    drink_count = models.PositiveIntegerField(default=0)  # 마시기 카운트용

class Question(models.Model):
    THEME_CHOICES = [
        ('college', '대학생'),
        ('sports', '스포츠'),
        ('idol', '아이돌'),
        ('custom', '사용자 정의'),
    ]
    theme = models.CharField(max_length=20, choices=THEME_CHOICES)
    content = models.TextField()

class Tile(models.Model):
    room = models.ForeignKey(GameRoom, on_delete=models.CASCADE)
    index = models.IntegerField()  # 칸 번호 (0~19)
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True)
