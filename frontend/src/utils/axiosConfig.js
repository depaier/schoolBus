import axios from 'axios'

// ngrok 무료 버전의 경고 페이지 우회를 위한 헤더 추가
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'

// User-Agent는 브라우저에서 설정 불가 (보안상 금지된 헤더)
// axios.defaults.headers.common['User-Agent'] = 'SchoolBusApp'

export default axios
