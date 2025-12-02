# ngrok 무료 버전 경고 페이지 문제 해결

## 문제 상황

ngrok 무료 버전 사용 시 다음과 같은 HTML 페이지가 반환됨:

```
<!DOCTYPE html>
<html class="h-full" lang="en-US" dir="ltr">
...
You are about to visit 778ee6360c4d.ngrok-free.app, served by 221.160.197.2...
```

API 요청이 JSON 대신 HTML을 반환하여 에러 발생:
```
⚠️ 성공했지만 응답 형식이 예상과 다름: "<!DOCTYPE html>..."
```

## 원인

ngrok 무료 버전은 브라우저에서 처음 접속 시 경고 페이지를 표시합니다. 이는:
- 보안 경고 목적
- 무료 사용자에게 표시되는 중간 페이지
- API 요청에도 동일하게 적용됨

## 해결 방법

### 1. axios 설정 파일 생성

`frontend/src/utils/axiosConfig.js` 파일 생성:

```javascript
import axios from 'axios'

// ngrok 무료 버전의 경고 페이지 우회를 위한 헤더 추가
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'

// User-Agent 헤더도 추가 (일부 경우에 필요)
axios.defaults.headers.common['User-Agent'] = 'SchoolBusApp'

export default axios
```

### 2. 모든 페이지에서 설정된 axios 사용

기존:
```javascript
import axios from 'axios'
```

변경:
```javascript
import axios from '../utils/axiosConfig'
```

### 3. 적용된 파일 목록

- ✅ `Home.jsx`
- ✅ `AdminPage.jsx`
- ✅ `LoginPage.jsx`
- ✅ `RegisterPage.jsx`
- ✅ `DebugPage.jsx`

## 작동 원리

### ngrok-skip-browser-warning 헤더

이 헤더를 추가하면 ngrok이 경고 페이지를 건너뛰고 직접 백엔드로 요청을 전달합니다.

```javascript
// 요청 헤더에 자동으로 추가됨
headers: {
  'ngrok-skip-browser-warning': 'true',
  'User-Agent': 'SchoolBusApp'
}
```

### curl로 테스트

```bash
# 헤더 없이 (경고 페이지 반환)
curl https://778ee6360c4d.ngrok-free.app/health

# 헤더 포함 (정상 응답)
curl -H "ngrok-skip-browser-warning: true" https://778ee6360c4d.ngrok-free.app/health
```

## 테스트 방법

### 1. 프론트엔드 재시작

```bash
cd frontend
npm run dev
```

### 2. 디버그 페이지 확인

```
http://localhost:5174/debug
```

이제 다음과 같이 표시되어야 함:
```
2. Routes API
✅ 성공: 2개 노선
```

### 3. 관리자 페이지 확인

```
http://localhost:5174/admin
```

노선 데이터가 정상적으로 로드되어야 함.

### 4. 브라우저 콘솔 확인

```
✅ 관리자 페이지 - 응답: {routes: [...], count: 2}
```

## 대안 방법

### 방법 1: 로컬 IP 사용 (같은 네트워크)

PC와 모바일이 같은 Wi-Fi에 연결된 경우:

```bash
# 백엔드를 모든 인터페이스에서 접근 가능하도록 실행
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# PC의 IP 확인
ifconfig | grep "inet " | grep -v 127.0.0.1
```

`.env` 파일 수정:
```
VITE_API_URL=http://192.168.x.x:8000
```

### 방법 2: ngrok 유료 플랜

ngrok 유료 플랜 사용 시:
- 경고 페이지 없음
- 고정 도메인 사용 가능
- 더 안정적인 연결

## 주의사항

### 1. 헤더는 모든 요청에 적용됨

`axiosConfig.js`를 import하면 해당 파일의 모든 axios 요청에 헤더가 자동으로 추가됩니다.

### 2. localhost 사용 시에도 문제없음

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

localhost 사용 시에도 헤더가 추가되지만 영향 없음.

### 3. 다른 API 사용 시

다른 외부 API를 사용할 경우 이 헤더가 영향을 줄 수 있으므로, 필요시 axios 인스턴스를 분리:

```javascript
// ngrok 전용 axios
const ngrokAxios = axios.create({
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
})

// 일반 axios
import axios from 'axios'
```

## 문제 해결 체크리스트

- [x] `axiosConfig.js` 파일 생성
- [x] 모든 페이지에서 `axiosConfig` import
- [x] 프론트엔드 재시작
- [x] 브라우저 캐시 삭제
- [x] `/debug` 페이지에서 API 테스트
- [x] 관리자 페이지에서 노선 로드 확인

## 결과

이제 ngrok 무료 버전을 사용해도:
- ✅ 경고 페이지 우회
- ✅ 정상적인 JSON 응답 수신
- ✅ 모든 API 정상 작동
- ✅ PC와 모바일 모두 사용 가능

## 참고 자료

- [ngrok Documentation](https://ngrok.com/docs)
- [ngrok Browser Warning](https://ngrok.com/docs/guides/device-gateway/browser-warning/)
