import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { requestNotificationWithToken, getDeviceType } from '../utils/pushNotification'
import './Home.css'

function Home({ isLoggedIn }) {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [busType, setBusType] = useState('등교')
  const [routeName, setRouteName] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('이용안내')

  const [reservationStatus, setReservationStatus] = useState({
    is_open: false,
    updated_at: null
  })

  const [isPolling, setIsPolling] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
  const [pushTokenInfo, setPushTokenInfo] = useState(null) // 푸시 토큰 정보
  const [currentStudentId, setCurrentStudentId] = useState(null) // 현재 로그인한 학번
  const previousStatusRef = useRef(false) // 이전 상태를 추적

  // Push 알림 전송 함수
  const sendPushNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '🚌',
        badge: '🚌',
        tag: 'bus-reservation',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // 5초 후 자동 닫기
      setTimeout(() => notification.close(), 5000)
    }
  }

  // 예매 상태를 폴링하는 함수
  const checkReservationStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/reservation/status')
      const newStatus = response.data
      
      setReservationStatus(newStatus)

      // 🔥 핵심: 이전에 닫혀있었는데 지금 열린 경우에만 Push 알림
      if (!previousStatusRef.current && newStatus.is_open && isNotificationEnabled) {
        sendPushNotification(
          '🎉 통학버스 예매 오픈!',
          '통학버스 예매가 오픈되었습니다. 지금 바로 예매하세요!'
        )
        console.log('예매 오픈 감지 - Push 알림 전송:', newStatus)
      }

      // 현재 상태를 이전 상태로 저장
      previousStatusRef.current = newStatus.is_open

    } catch (err) {
      console.error('예매 상태 체크 실패:', err)
    }
  }

  // 알림 권한 요청 및 토큰 발급
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.')
      return
    }

    try {
      // 학번 입력 받기 (실제로는 로그인 시스템에서 가져와야 함)
      const studentId = prompt('학번을 입력하세요 (예: 20240001):')
      
      if (!studentId || !studentId.trim()) {
        alert('학번을 입력해야 알림을 받을 수 있습니다.')
        return
      }

      setCurrentStudentId(studentId)

      // 푸시 토큰 발급 및 저장
      const tokenInfo = await requestNotificationWithToken(studentId)
      
      setNotificationPermission(tokenInfo.permission)
      setPushTokenInfo(tokenInfo)
      setIsNotificationEnabled(true)

      // 디바이스 타입에 따른 메시지
      const deviceTypeMsg = tokenInfo.deviceType === 'ios' 
        ? 'APN (Apple Push Notification)' 
        : 'FCM (Firebase Cloud Messaging)'

      // 테스트 알림 전송
      sendPushNotification(
        '✅ 알림 설정 완료!',
        `${deviceTypeMsg} 토큰이 등록되었습니다. 예매 오픈 시 알림을 받을 수 있습니다.`
      )

      alert(`알림이 활성화되었습니다!\n디바이스: ${tokenInfo.deviceType}\n토큰: ${tokenInfo.token.substring(0, 20)}...`)

    } catch (err) {
      console.error('알림 권한 요청 실패:', err)
      alert(err.message || '알림 설정에 실패했습니다.')
    }
  }

  // 알림 비활성화
  const disableNotification = () => {
    setIsNotificationEnabled(false)
    setPushTokenInfo(null)
    setCurrentStudentId(null)
    alert('알림이 비활성화되었습니다.')
  }

  // 컴포넌트 마운트 시 알림 권한 상태 확인 및 노선 데이터 로드
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        // 권한이 이미 있으면 자동으로 활성화하지 않음 (사용자가 버튼 클릭해야 함)
      }
    }
    
    // 🔥 노선 데이터 로드
    fetchRoutes()
  }, [])

  // 🔥 Supabase에서 노선 데이터 가져오기
  const fetchRoutes = async () => {
    // 로그인하지 않은 경우 로그인 페이지로 이동
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.')
      navigate('/login')
      return
    }

    try {
      const response = await axios.get('http://localhost:8000/api/routes')
      
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const routes = response.data.routes.map(route => ({
        id: route.id,
        routeName: route.route_name,
        routeId: route.route_id,
        departureTime: route.departure_time,
        availableSeats: route.available_seats,
        totalSeats: route.total_seats,
        isOpen: route.is_open
      }))
      
      setReservations(routes)
    } catch (err) {
      console.error('노선 데이터 로드 실패:', err)
    }
  }

  // 폴링 시작
  const startPolling = () => {
    setIsPolling(true)
  }

  // 폴링 중지
  const stopPolling = () => {
    setIsPolling(false)
  }

  // 폴링 효과
  useEffect(() => {
    let intervalId

    if (isPolling) {
      // 즉시 한 번 체크
      checkReservationStatus()
      
      // 5초마다 체크 (테스트용으로 짧게 설정, 실제로는 30초 권장)
      intervalId = setInterval(checkReservationStatus, 5000)
      console.log('폴링 시작: 5초마다 예매 상태 체크')
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
        console.log('폴링 중지')
      }
    }
  }, [isPolling])

  return (
    <div className="home-page">
      {/* 메인 컨텐츠 */}
      <div className="main-layout">
        {/* 좌측 사이드바 - 검색 */}
        <aside className="sidebar-left">
          {!isLoggedIn ? (
            <div className="login-required-box">
              <h3>🔒 로그인이 필요합니다</h3>
              <p>노선 조회는 로그인 후 이용 가능합니다.</p>
              <button className="btn-login-redirect" onClick={() => navigate('/login')}>
                로그인하러 가기
              </button>
            </div>
          ) : (
            <div className="search-section">
              <h3>🔍 버스 조회</h3>
            
            <div className="form-group">
              <label>구분</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    value="등교" 
                    checked={busType === '등교'}
                    onChange={(e) => setBusType(e.target.value)}
                  />
                  <span>등교</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    value="하교" 
                    checked={busType === '하교'}
                    onChange={(e) => setBusType(e.target.value)}
                  />
                  <span>하교</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>노선명</label>
              <select 
                className="form-input"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
              >
              <option value="">선택</option>
              <option value="A">서울</option>
              <option value="B">인천</option>
              <option value="C">안산</option>
              </select>
            </div>

            <div className="form-group">
              <label>조회 날짜</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="form-input date-input"
              />
            </div>

            <button className="search-btn" onClick={fetchRoutes}>
              🔍 조회하기
            </button>
          </div>
          )}

          {/* 예매 상태 모니터링 */}
          {isLoggedIn && (
          <div className="monitoring-mini">
            <h4>실시간 모니터링</h4>
            <div className="status-badge">
              <span className={`status-dot ${reservationStatus.is_open ? 'open' : 'closed'}`}></span>
              <span>{reservationStatus.is_open ? '예매 오픈' : '예매 마감'}</span>
            </div>
            {!isPolling ? (
              <button className="btn-start-mini" onClick={startPolling}>
                모니터링 시작
              </button>
            ) : (
              <button className="btn-stop-mini" onClick={stopPolling}>
                모니터링 중지
              </button>
            )}
          </div>
          )}
        </aside>

        {/* 중앙 컨텐츠 */}
        <main className="center-content">
          <div className="info-section">
            <div className="today-info">
              <div className="info-label">TODAY</div>
              <h2 className="info-date">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</h2>
              <div className="contact-box">
                <p className="contact-title">고객센터</p>
                <p className="contact-tel">📞 TEL : 031-123-4567</p>
                <p className="contact-email">✉️ bus@hsu.ac.kr</p>
                <p className="contact-hours">⏰ 운영시간: 평일 09:00 ~ 18:00</p>
              </div>
            </div>
          </div>

          <div className="notice-box">
            <h3>📢 예약 시 주의사항</h3>
            <div className="notice-content">
              <p>※ 예약 마감은 버스 출발 10분 전까지 가능합니다.</p>
              <p>※ 예약 없이 탑승 시 승차가 거부될 수 있습니다.</p>
              <p>※ 취소 수수료 및 미탑승 위약금이 발생할 수 있습니다.</p>
            </div>

            <table className="notice-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>등하교</th>
                  <th>내용 및 수수료</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>예약</td>
                  <td>공통</td>
                  <td>버스 출발 10분 전까지 예약 가능</td>
                </tr>
                <tr>
                  <td>예약 취소</td>
                  <td>공통</td>
                  <td>버스 출발 10분 전까지 취소 수수료 없음</td>
                </tr>
                <tr>
                  <td>미탑승</td>
                  <td>공통</td>
                  <td>예약 후 미탑승 시 위약금 발생</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

        {/* 우측 사이드바 - 예약 */}
        <aside className="sidebar-right">
          <div className="reservation-panel">
            <h3>🚌 배차 조회 / 신청</h3>
            
            <div className="tab-buttons">
              <button 
                className={activeTab === '이용안내' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab('이용안내')}
              >
                이용안내
              </button>
              <button 
                className={activeTab === '개인정보' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab('개인정보')}
              >
                개인정보
              </button>
            </div>

            <div className="routes-list">
              {reservations.length === 0 ? (
                <div className="empty-state">
                  <p>🔍 노선을 먼저 조회해주세요</p>
                </div>
              ) : (
                reservations.map((route) => (
                  <div key={route.id} className="route-card-mini">
                    <div className="route-header-mini">
                      <h4>{route.routeName}</h4>
                      <span className={`badge ${route.isOpen ? 'badge-open' : 'badge-closed'}`}>
                        {route.isOpen ? '예매가능' : '마감'}
                      </span>
                    </div>
                    <div className="route-info-mini">
                      <p>🕐 출발: {route.departureTime}</p>
                      <p>💺 좌석: {route.availableSeats}/{route.totalSeats}</p>
                    </div>
                    {route.isOpen && (
                      <button className="btn-reserve">예약하기</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* 알림 설정 섹션 */}
      <div className="notification-section">
        <h2>🔔 예매 오픈 알림 받기</h2>
        <div className="notification-content">
          <p className="notification-description">
            예매가 오픈되면 즉시 푸시 알림을 받을 수 있습니다.
          </p>
          
          <div className="notification-controls">
            {!isNotificationEnabled ? (
              <button onClick={requestNotificationPermission} className="btn-enable-notification">
                <span className="btn-icon">🔔</span>
                알림 받기
              </button>
            ) : (
              <div className="notification-enabled">
                <div className="enabled-badge">
                  <span className="check-icon">✓</span>
                  알림 활성화됨
                </div>
                <button onClick={disableNotification} className="btn-disable-notification">
                  알림 끄기
                </button>
              </div>
            )}
          </div>

          {notificationPermission === 'denied' && (
            <div className="notification-warning">
              ⚠️ 알림이 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.
            </div>
          )}
        </div>
      </div>

      {/* 예매 상태 모니터링 */}
      <div className="monitoring-section">
        <h2>예매 상태 모니터링</h2>
        <div className="status-display">
          <div className={`status-indicator ${reservationStatus.is_open ? 'open' : 'closed'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {reservationStatus.is_open ? '예매 오픈' : '예매 닫힘'}
            </span>
          </div>
          {reservationStatus.updated_at && (
            <p className="last-update">
              마지막 업데이트: {new Date(reservationStatus.updated_at).toLocaleString('ko-KR')}
            </p>
          )}
        </div>

        <div className="polling-controls">
          {!isPolling ? (
            <button onClick={startPolling} className="btn-start-polling">
              실시간 모니터링 시작
            </button>
          ) : (
            <button onClick={stopPolling} className="btn-stop-polling">
              모니터링 중지
            </button>
          )}
          <p className="polling-info">
            {isPolling ? '🟢 5초마다 예매 상태를 체크하고 있습니다' : '⚪ 모니터링이 중지되었습니다'}
          </p>
          {isNotificationEnabled && isPolling && (
            <p className="notification-active-info">
              🔔 알림이 활성화되어 있습니다. 예매 오픈 시 푸시 알림을 받게 됩니다.
            </p>
          )}
        </div>
      </div>

      {/* 노선 목록 */}
      <div className="routes-section">
        <h2>운행 노선</h2>
        <div className="routes-grid">
          {reservations.map((route) => (
            <div key={route.id} className={`route-card ${route.isOpen ? 'open' : 'closed'}`}>
              <div className="route-header">
                <h3>{route.routeName}</h3>
                <span className={`badge ${route.isOpen ? 'open' : 'closed'}`}>
                  {route.isOpen ? '예매 가능' : '예매 마감'}
                </span>
              </div>
              <div className="route-info">
                <p><strong>노선 ID:</strong> {route.routeId}</p>
                <p><strong>출발 시간:</strong> {route.departureTime}</p>
                <p><strong>남은 좌석:</strong> {route.availableSeats} / {route.totalSeats}석</p>
              </div>
              {route.isOpen && (
                <button className="btn-reserve">예매하기</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="info-section">
        <h3>💡 사용 방법</h3>
        <ul>
          <li><strong>1단계:</strong> "알림 받기" 버튼을 클릭하여 푸시 알림을 허용하세요</li>
          <li><strong>2단계:</strong> "실시간 모니터링 시작" 버튼을 클릭하세요</li>
          <li><strong>3단계:</strong> 관리자가 예매를 오픈하면 자동으로 푸시 알림을 받게 됩니다</li>
          <li>💡 브라우저를 최소화하거나 다른 탭을 보고 있어도 알림을 받을 수 있습니다</li>
        </ul>
      </div>
    </div>
  )
}

export default Home
