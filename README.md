# 🌿 글린 (Glean)

> 웹소설의 아이디어 구상부터 작품 관리, 회차별 집필까지 이어지는 창작 워크스페이스

웹소설을 즐겨 읽으며 자연스럽게 창작 과정과 글쓰기 도구에 관심을 가지게 되었고,  
기존에 사용해 본 글쓰기 서비스에서 느낀 장점과 불편함을 바탕으로 직접 기획하고 개발한 프로젝트입니다.

현재는 **작품 관리와 회차별 집필이 가능한 MVP**까지 구현했으며,  
향후 Google 로그인, 작품 기획, 등장인물, 관계도, 세계관, 시놉시스 등 창작 과정 전반을 관리할 수 있는 서비스로 확장할 예정입니다.

---

## 🖼 Preview

![글린 작품 목록](./docs/images/work-list.png)

---

## 🔗 Demo

🌐 **[글린 바로가기](https://novel-writing-app-olive.vercel.app)**

> 현재는 로그인 기능 구현 전 단계로 Demo User를 사용하는 MVP 버전입니다.

---

## ✨ 주요 기능

### 📚 작품 관리

- 작품 생성
- 작품 목록 조회
- 작품 검색
- 작품 제목 및 부제 수정
- 작품 삭제
- 최근 작업 작품 표시
- 작품별 워크스페이스 제공

![작품 워크스페이스](./docs/images/workspace.png)

### 📝 회차 관리

- 작품별 회차 목록
- 새 회차 작성
- 회차 상세 조회
- 회차 수정
- 회차 삭제
- 회차 순서 지정
- 중복 회차 번호 검증
- 글자 수 표시
- 저장 상태 표시

![회차 목록](./docs/images/episode-list.png)

![회차 에디터](./docs/images/episode-editor.png)

### 📱 UX / UI

- PC / Mobile 반응형 UI
- 모바일 Sidebar → Drawer 전환
- 작품 및 회차 Empty / Loading / Error 상태 처리
- 잘못된 작품 및 회차 ID 접근 처리
- 작성 화면의 참고 패널 UI
- 작품 삭제 시 연결된 회차 Cascade 삭제

<p align="center">
  <img src="./docs/images/mobile.png" alt="글린 모바일 반응형 화면" width="320" />
</p>

---

## 🛠 Tech Stack

| 영역 | 기술 |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Routing | App Router |
| Styling | CSS Modules |
| State | React Hooks |
| Backend | NestJS |
| ORM | Prisma |
| Database | MySQL |
| API | REST API, Swagger |
| Deployment | Vercel, Railway |
| Version Control | Git, GitHub |

---

## 🏗 Architecture

```text
User
 │
 ▼
Vercel
Next.js
 │
 ▼
Railway
NestJS REST API
 │
 ▼
Prisma
 │
 ▼
Railway MySQL
```

<p align="center">
  <img src="./docs/images/deployment.png" alt="배포 구조" width="900" />
</p>

---

## 🗃 Database

현재 MVP는 사용자, 작품, 회차의 계층 관계를 중심으로 구성되어 있습니다.

```text
USER
 │ 1
 │
 └──── N WORK
          │ 1
          │
          └──── N EPISODE
```

- **User**: 사용자 기본 정보
- **Work**: 사용자별 작품 제목과 부제
- **Episode**: 작품별 회차 본문과 순서

작품 삭제 시 해당 작품의 회차도 함께 삭제되도록 Prisma Relation에 `onDelete: Cascade`를 적용했습니다.

---

## 🔌 API

```http
Work CRUD    /work, /work/:id
Episode CRUD /episode, /episode/:id
```

NestJS와 Prisma로 작품 및 회차의 생성, 조회, 수정, 삭제 REST API를 구현하고 Swagger 문서를 제공합니다.

---

## 💡 주요 구현 내용

### 1. Next.js App Router 기반 화면 구조

작품과 회차의 계층이 URL에도 드러나도록 동적 Route를 구성했습니다.

```text
/works
/works/[workId]
/works/[workId]/episodes
/works/[workId]/episodes/new
/works/[workId]/episodes/[episodeId]
/works/[workId]/episodes/[episodeId]/edit
```

### 2. 작품과 회차 CRUD 구현

NestJS + Prisma REST API를 Next.js의 Fetch API와 연동해 작품과 회차의 전체 CRUD 흐름을 구현했습니다.

### 3. 회차 순서 관리

`sortOrder`로 작품 내 회차 순서를 관리합니다. 가장 큰 순서의 다음 번호를 기본으로 제안하고, 사용자가 변경한 번호는 동일 작품 내 중복 여부를 Frontend에서 검증합니다.

### 4. Create / Edit 화면 공통화

회차 작성과 수정에서 `EpisodeEditorPage`를 공통으로 사용하되 동작은 모드별로 분리했습니다.

```text
Create Mode → POST /episode
Edit Mode   → PATCH /episode/:id
```

### 5. 사용자 상태를 고려한 UI

Loading, Error, Empty, Invalid ID, Backend Connection Error 상태를 분리해 API 서버가 꺼져 있거나 잘못된 경로에 접근해도 안내 화면을 제공합니다.

### 6. 반응형 UI

모바일에서는 Sidebar를 Drawer로 전환하고, 작품 목록부터 에디터까지 화면별 레이아웃을 최적화했습니다.

---

## 🚀 Deployment

Frontend는 Vercel의 `/frontend`, Backend는 Railway의 `/backend`를 Root Directory로 지정해 배포했습니다. Database는 Railway MySQL을 사용하며, Pre-deploy 단계에서 Production Migration을 적용합니다.

```bash
npx prisma migrate deploy
```

---

## 🔧 배포 과정에서 해결한 문제

### 1. Prisma Client 미생성으로 Production Build 실패

Railway 최초 배포에서 다음 오류가 발생했습니다.

```text
Cannot find module '../generated/prisma/client.js'
```

로컬에만 존재하던 Prisma Client가 새로운 Railway 빌드 환경에는 생성되지 않아 관련 타입 오류가 연쇄적으로 발생했습니다. Build Script에 Client 생성을 추가해 해결했습니다.

```json
"build": "prisma generate && nest build"
```

### 2. Production DB Foreign Key 오류

배포 후 작품 생성 시 다음 오류로 API가 `500 Error`를 반환했습니다.

```text
ForeignKeyConstraintViolation
fields: user_id
```

인증 전 임시로 사용하는 Demo User가 새 Production DB에 존재하지 않아 발생한 문제였습니다. Production DB에 Demo User를 생성한 뒤 작품 및 회차 CRUD 동작을 확인했습니다.

---

## ✅ 배포 후 테스트

Production 환경에서 작품/회차 CRUD, 새로고침 후 데이터 유지, Cascade 삭제, 모바일 UI, 오류 상태와 Vercel·Railway 배포 상태를 확인했습니다.

---

## 📂 Environment Variables

- **Frontend**: Backend URL, Demo User ID, 기본 Locale
- **Backend**: MySQL 연결 정보, Prisma Database URL, 서버 Port

세부 항목은 각 서비스의 `.env.example`을 참고하며, 실제 `.env` 파일과 Secret 값은 Git Repository에 포함하지 않습니다.

---

## ▶️ Local Development

### Frontend

```bash
cd frontend
npm install && npm run dev
```

### Backend

```bash
cd backend
npm install
npx prisma generate && npm run start:dev
```

> Backend 실행 전 MySQL 실행 및 환경변수 설정이 필요합니다.

---

## 🗺 Roadmap

현재는 작품 및 회차 관리 중심의 MVP 단계입니다.

```text
Google Login
↓
사용자별 데이터 분리
↓
작품 기획
↓
등장인물
↓
관계도
↓
세계관
↓
시놉시스
↓
집필 워크스페이스 확장
↓
보안 / 권한 관리
↓
서비스 확장 시 AWS 인프라 이전 검토
```

특히 다음 단계에서는 Google OAuth를 구현하여 현재 사용 중인 Demo User 방식을 제거하고 로그인한 사용자별로 작품과 회차를 관리하도록 변경할 예정입니다.

---

## 🎯 Project Goal

단순히 글을 입력하는 에디터를 만드는 것이 아니라,

```text
아이디어 구상
→ 작품 기획
→ 등장인물 / 관계
→ 세계관
→ 시놉시스
→ 회차별 집필
```

까지 하나의 공간에서 이어지는 웹소설 창작 워크스페이스를 만드는 것이 목표입니다.
