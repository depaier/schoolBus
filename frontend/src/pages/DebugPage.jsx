import { useEffect, useState } from 'react'
import axios from '../utils/axiosConfig'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function DebugPage() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [routesStatus, setRoutesStatus] = useState(null)
  const [reservationStatus, setReservationStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    testAPIs()
  }, [])

  const testAPIs = async () => {
    console.log('🧪 API 테스트 시작')
    console.log('🌐 API_BASE_URL:', API_BASE_URL)
    console.log('🌐 import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL)

    // Health Check
    try {
      const health = await axios.get(`${API_BASE_URL}/health`)
      setHealthStatus('✅ 성공: ' + JSON.stringify(health.data))
      console.log('✅ Health Check 성공:', health.data)
    } catch (err) {
      setHealthStatus('❌ 실패: ' + err.message)
      console.error('❌ Health Check 실패:', err)
    }

    // Routes API
    try {
      const routes = await axios.get(`${API_BASE_URL}/api/routes`)
      console.log('✅ Routes API 응답:', routes.data)
      
      if (routes.data && routes.data.routes && Array.isArray(routes.data.routes)) {
        setRoutesStatus('✅ 성공: ' + routes.data.routes.length + '개 노선')
      } else {
        setRoutesStatus('⚠️ 성공했지만 응답 형식이 예상과 다름: ' + JSON.stringify(routes.data))
      }
    } catch (err) {
      setRoutesStatus('❌ 실패: ' + err.message)
      console.error('❌ Routes API 실패:', err)
      console.error('에러 응답:', err.response?.data)
    }

    // Reservation Status API
    try {
      const reservation = await axios.get(`${API_BASE_URL}/api/reservation/status`)
      setReservationStatus('✅ 성공: ' + JSON.stringify(reservation.data))
      console.log('✅ Reservation Status API 성공:', reservation.data)
    } catch (err) {
      setReservationStatus('❌ 실패: ' + err.message)
      console.error('❌ Reservation Status API 실패:', err)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 API 디버그 페이지</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>환경 변수</h2>
        <p><strong>API_BASE_URL:</strong> {API_BASE_URL}</p>
        <p><strong>import.meta.env.VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || '(undefined)'}</p>
        <p><strong>import.meta.env.MODE:</strong> {import.meta.env.MODE}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
        <h2>API 테스트 결과</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <h3>1. Health Check</h3>
          <p>{healthStatus || '⏳ 테스트 중...'}</p>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <h3>2. Routes API</h3>
          <p>{routesStatus || '⏳ 테스트 중...'}</p>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <h3>3. Reservation Status API</h3>
          <p>{reservationStatus || '⏳ 테스트 중...'}</p>
        </div>
      </div>

      <button 
        onClick={testAPIs}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 다시 테스트
      </button>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h3>💡 문제 해결 방법</h3>
        <ul>
          <li>환경 변수가 undefined이면: <code>.env</code> 파일 확인</li>
          <li>Health Check 실패: 백엔드 서버 실행 확인</li>
          <li>CORS 에러: 백엔드 CORS 설정 확인</li>
          <li>ngrok URL 에러: ngrok이 실행 중인지 확인</li>
        </ul>
      </div>
    </div>
  )
}

export default DebugPage
