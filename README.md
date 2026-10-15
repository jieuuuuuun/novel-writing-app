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

**Web**

https://novel-writing-app-olive.vercel.app

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

![배포 구조](./docs/images/deployment.png)

---

## 📁 Project Structure

Frontend와 Backend는 하나의 Git Repository에서 관리하는 Monorepo 구조입니다.

```text
novel-writing-app/
├─ docs/
│  └─ images/
├─ frontend/
│  ├─ src/
│  ├─ public/
│  └─ Next.js
├─ backend/
│  ├─ src/
│  ├─ prisma/
│  └─ NestJS + Prisma
└─ README.md
```

배포 시에는 서비스별 Root Directory를 분리했습니다.

```text
Vercel  → /frontend
Railway → /backend
```

---

## 🗃 Database

현재 MVP는 다음 3개의 주요 테이블로 구성되어 있습니다.

```text
USER
 │ 1
 │
 └──── N WORK
          │ 1
          │
          └──── N EPISODE
```

### User

- `id`
- `email`
- `name`
- `googleId`
- `createdAt`
- `updatedAt`

### Work

- `id`
- `userId`
- `title`
- `subtitle`
- `createdAt`
- `updatedAt`

### Episode

- `id`
- `workId`
- `title`
- `content`
- `sortOrder`
- `createdAt`
- `updatedAt`

작품 삭제 시 해당 작품에 속한 회차도 함께 삭제되도록 Prisma Relation에 `onDelete: Cascade`를 적용했습니다.

---

## 🔌 API

### Work

```http
POST   /work
GET    /work
GET    /work/:id
PATCH  /work/:id
DELETE /work/:id
```

### Episode

```http
POST   /episode
GET    /episode
GET    /episode/:id
PATCH  /episode/:id
DELETE /episode/:id
```

---

## 💡 주요 구현 내용

### 1. Next.js App Router 기반 화면 구조

작품 목록, 작품별 워크스페이스, 회차 목록, 상세, 작성 및 수정 화면을 Next.js App Router 기반으로 구성했습니다.

```text
/works
/works/[workId]
/works/[workId]/episodes
/works/[workId]/episodes/new
/works/[workId]/episodes/[episodeId]
/works/[workId]/episodes/[episodeId]/edit
```

동적 Route를 활용해 작품과 회차의 계층 구조가 URL에도 자연스럽게 반영되도록 구성했습니다.

### 2. 작품과 회차 CRUD 구현

NestJS + Prisma 기반 REST API를 구성하고 Next.js에서 Fetch API로 연동했습니다. 작품과 회차의 생성, 조회, 수정, 삭제 흐름을 구현하여 실제 글쓰기 서비스에 필요한 기본 데이터 처리를 완성했습니다.

### 3. 회차 순서 관리

각 회차에는 `sortOrder` 값을 두어 작품 내 회차 순서를 관리합니다.

새 회차 생성 시 기존 회차의 가장 큰 순서를 기준으로 다음 번호를 기본값으로 제공하며, 사용자가 직접 번호를 수정할 수도 있습니다. 동일 작품 내에서 같은 순서가 중복되지 않도록 Frontend에서 검증합니다.

### 4. Create / Edit 화면 공통화

회차 작성과 수정 화면의 UI와 로직이 대부분 동일하기 때문에 `EpisodeEditorPage`를 공통 컴포넌트로 구성했습니다.

```text
Create Mode → POST /episode
Edit Mode   → PATCH /episode/:id
```

중복 UI를 줄이면서 생성과 수정의 동작은 각각 분리했습니다.

### 5. 사용자 상태를 고려한 UI

정상 상태뿐 아니라 다음 상태도 별도로 처리했습니다.

- Loading
- Error
- Empty
- Invalid ID
- Backend Connection Error

API 서버가 꺼져 있거나 존재하지 않는 작품 또는 회차에 접근하더라도 페이지 전체가 깨지지 않고 사용자에게 상태를 안내하도록 구성했습니다.

### 6. 반응형 UI

Desktop과 Mobile 모두 사용할 수 있도록 화면을 구성했습니다.

모바일에서는 Sidebar 대신 Drawer 메뉴를 사용하며, 햄버거 메뉴 + 로고 + 사용자 영역 형태의 Header로 전환됩니다. 작품 목록, 워크스페이스, 회차 목록, 회차 상세 및 에디터 화면까지 모바일 레이아웃을 확인했습니다.

---

## 🚀 Deployment

Frontend, Backend, Database를 각각 배포했습니다.

### Frontend

Next.js를 Vercel에 배포하고 Monorepo의 `/frontend`를 Root Directory로 지정했습니다.

```dotenv
BACKEND_URL=
NEXT_PUBLIC_DEMO_USER_ID=1
NEXT_PUBLIC_DEFAULT_LOCALE=ko
```

### Backend

NestJS를 Railway에 배포하고 `/backend`를 Root Directory로 지정했습니다. Backend 환경변수는 Railway MySQL 서비스의 값을 참조하도록 구성했습니다.

```text
DATABASE_URL
DATABASE_HOST
DATABASE_PORT
DATABASE_USER
DATABASE_PASSWORD
DATABASE_NAME
```

### Database

MySQL은 Railway MySQL을 사용합니다.

Prisma Migration을 Production DB에 적용하기 위해 Railway의 Pre-deploy Command에 다음 명령을 등록했습니다.

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

이후 `PrismaService`를 사용하는 코드에서 다음 TypeScript 오류가 연쇄적으로 발생했습니다.

```text
Property 'episode' does not exist
Property 'work' does not exist
Property '$connect' does not exist
```

원인은 로컬에는 이미 생성되어 있던 Prisma Client가 새로운 Railway 빌드 환경에는 존재하지 않았기 때문이었습니다.

기존 Build Script:

```json
"build": "nest build"
```

수정:

```json
"build": "prisma generate && nest build"
```

Build 전에 Prisma Client를 생성하도록 수정하여 문제를 해결했습니다.

### 2. Production DB Foreign Key 오류

배포 후 작품 생성 시 API가 `500 Error`를 반환했습니다. Railway 로그에서 다음 오류를 확인했습니다.

```text
ForeignKeyConstraintViolation
fields: user_id
```

현재 인증 기능 구현 전이라 Frontend에서 임시로 `NEXT_PUBLIC_DEMO_USER_ID=1`을 사용하고 있었지만, 새롭게 생성된 Production DB에는 `id=1`인 사용자가 존재하지 않아 발생한 문제였습니다.

Production DB에 Demo User를 생성한 뒤 작품 및 회차 CRUD가 정상적으로 동작하는 것을 확인했습니다.

---

## ✅ 배포 후 테스트

Production 환경에서 다음 기능을 직접 테스트했습니다.

- 작품 생성
- 작품 조회
- 작품 수정
- 작품 삭제
- 회차 생성
- 회차 조회
- 회차 수정
- 회차 삭제
- 새로고침 후 데이터 유지
- 작품 삭제 시 회차 Cascade 삭제
- 모바일 UI
- 잘못된 ID 접근
- Backend 연결 오류 상태
- Vercel Production 상태
- Railway Backend 상태
- Railway MySQL 상태

---

## 📂 Environment Variables

### Frontend

`frontend/.env.example`

```dotenv
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_USER_ID=1
NEXT_PUBLIC_DEFAULT_LOCALE=ko
```

### Backend

`backend/.env.example`

```dotenv
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=novel_writing_app
DATABASE_URL=mysql://your_database_user:your_database_password@localhost:3306/novel_writing_app
PORT=3001
```

실제 `.env` 파일과 Secret 값은 Git Repository에 포함하지 않습니다.

---

## ▶️ Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3000

### Backend

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

http://localhost:3001

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
