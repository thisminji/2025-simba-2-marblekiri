from django.db import models

class GameRoom(models.Model):
    theme = models.CharField(max_length=30)
    max_turns = models.PositiveIntegerField(null=True, blank=True)
    started = models.BooleanField(default=False)
    current_turn_index = models.PositiveIntegerField(default=0) #턴 관리

class PlayerInRoom(models.Model):
    nickname = models.CharField(max_length=30, default="익명")
    room = models.ForeignKey(GameRoom, on_delete=models.CASCADE)
    turn = models.PositiveIntegerField()
    is_ready = models.BooleanField(default=False)
    drink_count = models.PositiveIntegerField(default=0)  # 카운트용

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
