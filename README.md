# ✈️ My Sydney — Travel Planner

2026년 11월 시드니 가족여행을 위해 만든 개인 여행 관리 웹앱입니다.

## 주요 기능

- **여행 일정:** 날짜별 여행 일정 추가·수정·삭제
- **장소 저장:** 관광, 음식, 쇼핑, 액티비티 등의 장소 목록 관리 및 분류
- **경비 관리:** 호주 달러(AUD) 지출 등록·수정·삭제 및 항목별 합계
- **준비물 체크리스트:** 항목 관리와 준비 진행률 표시
- **로컬 저장:** 브라우저의 `localStorage`에 데이터 저장
- **백업:** JSON 파일로 현재 데이터 내보내기

## 기술 스택

- HTML5 / CSS3 / Vanilla JavaScript
- Browser localStorage / JSON
- GitHub Pages (정적 웹앱 배포용)

## 실행 방법

1. 저장소를 내려받거나 clone합니다.
2. `index.html` 파일을 웹브라우저에서 엽니다.
3. 또는 GitHub Pages로 배포합니다.

별도의 빌드 명령이나 API 키가 필요하지 않습니다.

## GitHub Pages 배포

1. GitHub에 새 **Public** 저장소 `my-sydney-travel-planner`를 만듭니다.
2. `index.html`, `styles.css`, `app.js`, `README.md`를 저장소 **최상위 경로**에 업로드하고 커밋합니다.
3. **Settings → Pages → Build and deployment → Deploy from a branch**를 선택합니다.
4. **Branch: `main` / Folder: `/(root)`** 로 설정해 저장합니다.
5. 배포가 완료되면 `https://<GITHUB_USERNAME>.github.io/my-sydney-travel-planner/` 형태의 URL로 접속합니다.

## 데이터 관련 주의사항

이 앱은 계정 로그인이나 서버 DB가 없는 첫 번째 MVP입니다. 데이터는 **각 기기의 해당 브라우저**에만 저장되고 다른 기기와 동기화되지 않습니다. 브라우저 데이터 삭제 시 사라질 수 있으므로 백업 기능을 사용하세요. GitHub에 개인 여행 기록이나 백업 JSON 파일을 공개로 올리지 마세요.

## 개선 로드맵

- [ ] 장소와 지도 링크 연동
- [ ] 환율 변환 및 예산 설정
- [ ] 데이터 가져오기(복원)
- [ ] 반응형 UI 및 접근성 개선
- [ ] React + API + DB 확장

## 프로젝트 소개 (포트폴리오용)

개인 여행 준비 과정에서 일정, 방문 희망 장소, 경비와 준비물을 여러 도구에서 따로 관리해야 하는 불편을 해결하기 위해 웹앱을 기획했습니다. 초기 버전에서는 추가 설정 없이 사용 가능하도록 정적 웹 구조와 localStorage를 사용했습니다. 향후 사용자 인증과 데이터 동기화 기능을 추가할 계획입니다.
