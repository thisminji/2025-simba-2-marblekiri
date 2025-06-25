# 2025-simba-2-marblekiri
멋쟁이사자처럼 13기 심바톤 2팀-Marblekiri레포지토리입니다.

---
# 🐘 데이터베이스 불러오기 (`db.json`)

### 1️⃣ db.json 파일 위치
이 저장소의 루트 디렉토리에 포함된 `db.json` 파일을 이용해 초기 데이터를 불러올 수 있습니다.

---

### 2️⃣ 가상환경 활성화

#### ✅ Windows (Git Bash)
source venv/Scripts/actiavte

#### ✅ macOS / Linux
source venv/Scripts/activate

### 2️⃣마이그레이션 실행
python manage.py migrate

### 3️⃣ 데이터 불러오기
python manage.py loaddata data.json

-> data.json에는 질문 데이터 및 초기 게임 정보가 포함되어 있습니다.