import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './Home.css'

function Home() {
  const [reservations, setReservations] = useState([])

  const [reservationStatus, setReservationStatus] = useState({
    is_open: false,
    updated_at: null
  })

  const [isPolling, setIsPolling] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
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

  // 알림 권한 요청
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        setIsNotificationEnabled(true)
        // 테스트 알림 전송
        sendPushNotification(
          '알림 설정 완료!',
          '통학버스 예매 오픈 시 알림을 받을 수 있습니다.'
        )
      } else {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.')
      }
    } catch (err) {
      console.error('알림 권한 요청 실패:', err)
    }
  }

  // 알림 비활성화
  const disableNotification = () => {
    setIsNotificationEnabled(false)
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
      <header className="home-header">
        <h1>🚌 통학버스 예매 시스템</h1>
        <p>실시간 예매 상태를 확인하세요</p>
      </header>

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
