import { useState, useEffect, useRef, Component } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { requestNotificationWithToken, getDeviceType, isIOSStandalone } from '../utils/webPushNotification'
import './Home.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// 에러 바운더리 컴포넌트
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Home 페이지 에러:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h1>⚠️ 페이지 로딩 오류</h1>
          <p>페이지를 불러오는 중 문제가 발생했습니다.</p>
          <p style={{ color: 'red', fontSize: '14px' }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} style={{
            padding: '10px 20px',
            fontSize: '16px',
            marginTop: '20px',
            cursor: 'pointer'
          }}>
            새로고침
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function HomeContent({ isLoggedIn }) {
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

  const [notificationPermission, setNotificationPermission] = useState('default')
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
  const [pushTokenInfo, setPushTokenInfo] = useState(null) // 푸시 토큰 정보
  const [currentStudentId, setCurrentStudentId] = useState(null) // 현재 로그인한 학번

  // 예매 상태 조회 (한 번만)
  const fetchReservationStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reservation/status`)
      setReservationStatus(response.data)
      console.log('✅ 예매 상태:', response.data.is_open ? '오픈' : '마감')
    } catch (err) {
      console.error('❌ 예매 상태 조회 실패:', err)
    }
  }

  // 알림 권한 요청 및 토큰 발급
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.')
      return
    }

    try {
      // 로그인된 유저 정보에서 학번 가져오기
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const user = JSON.parse(userStr)
      const studentId = user.student_id
      
      if (!studentId) {
        alert('학번 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
        return
      }

      setCurrentStudentId(studentId)
      
      console.log('🔔 알림 활성화 시작:', { studentId, deviceType: getDeviceType() })

      // 푸시 구독 생성 및 저장
      const tokenInfo = await requestNotificationWithToken(studentId)
      
      console.log('✅ 푸시 구독 성공:', tokenInfo)
      
      setNotificationPermission(tokenInfo.permission)
      setPushTokenInfo(tokenInfo)
      setIsNotificationEnabled(true)
      
      // 🔥 localStorage에 알림 상태 저장
      localStorage.setItem('isNotificationEnabled', 'true')
      localStorage.setItem('pushTokenInfo', JSON.stringify(tokenInfo))
      localStorage.setItem('currentStudentId', studentId)

      // 성공 메시지
      const deviceMsg = tokenInfo.deviceType === 'ios' 
        ? 'iOS (제한적 지원)' 
        : tokenInfo.deviceType === 'android'
        ? 'Android'
        : 'PC'

      alert(`✅ 알림이 활성화되었습니다!\n\n디바이스: ${deviceMsg}\n\n예매가 오픈되면 자동으로 알림을 받습니다.${tokenInfo.deviceType === 'ios' ? '\n\n⚠️ iOS는 앱이 실행 중일 때만 알림을 받을 수 있습니다.' : '\n\n브라우저를 닫아도 알림을 받을 수 있습니다!'}`)

    } catch (err) {
      console.error('❌ 알림 설정 실패:', err)
      console.error('에러 상세:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      })
      
      // 사용자 친화적 에러 메시지
      let errorMsg = '알림 설정에 실패했습니다.\n\n'
      
      if (err.message.includes('Service Worker')) {
        errorMsg += '브라우저가 Service Worker를 지원하지 않습니다.\nChrome, Edge, Firefox를 사용해주세요.'
      } else if (err.message.includes('PushManager')) {
        errorMsg += '브라우저가 푸시 알림을 지원하지 않습니다.'
      } else if (err.message.includes('거부')) {
        errorMsg += '알림 권한이 거부되었습니다.\n브라우저 설정에서 알림을 허용해주세요.'
      } else if (err.message.includes('VAPID')) {
        errorMsg += 'VAPID 키 설정 오류입니다.\n관리자에게 문의하세요.'
      } else if (err.response?.status === 404) {
        errorMsg += '사용자 정보를 찾을 수 없습니다.\n다시 로그인해주세요.'
      } else if (err.response?.status === 500) {
        errorMsg += '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'
      } else {
        errorMsg += err.message || '알 수 없는 오류가 발생했습니다.'
      }
      
      alert(errorMsg)
    }
  }

  // 알림 비활성화
  const disableNotification = () => {
    setIsNotificationEnabled(false)
    setPushTokenInfo(null)
    setCurrentStudentId(null)
    // localStorage에서 알림 상태 제거
    localStorage.removeItem('isNotificationEnabled')
    localStorage.removeItem('pushTokenInfo')
    localStorage.removeItem('currentStudentId')
    alert('알림이 비활성화되었습니다.')
  }

  // 컴포넌트 마운트 시 알림 권한 상태 확인 및 노선 데이터 로드
  useEffect(() => {
    // 🔥 API URL 확인 (디버깅용)
    console.log('🌐 사용 중인 API URL:', API_BASE_URL)
    console.log('📱 디바이스 타입:', getDeviceType())
    console.log('🔐 로그인 상태 (props):', isLoggedIn)
    console.log('🔐 로그인 상태 (localStorage):', localStorage.getItem('isLoggedIn'))
    
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    
    // 🔥 localStorage에서 알림 활성화 상태 복원
    const savedNotificationEnabled = localStorage.getItem('isNotificationEnabled') === 'true'
    const savedPushTokenInfo = localStorage.getItem('pushTokenInfo')
    const savedStudentId = localStorage.getItem('currentStudentId')
    
    if (savedNotificationEnabled && savedPushTokenInfo && savedStudentId) {
      setIsNotificationEnabled(true)
      setPushTokenInfo(JSON.parse(savedPushTokenInfo))
      setCurrentStudentId(savedStudentId)
      console.log('✅ 알림 활성화 상태 복원됨')
    }
    
    // 🔥 노선 데이터 및 예매 상태 로드
    fetchRoutes()
    fetchReservationStatus()
  }, [])
  
  // 🔥 isLoggedIn이 변경될 때마다 노선 데이터 다시 로드
  useEffect(() => {
    if (isLoggedIn) {
      console.log('✅ 로그인 상태 변경 감지 - 노선 데이터 로드')
      fetchRoutes()
    }
  }, [isLoggedIn])

  // 🔥 Supabase에서 노선 데이터 가져오기
  const fetchRoutes = async () => {
    // localStorage에서 직접 로그인 상태 확인 (props보다 신뢰성 높음)
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    
    if (!loggedIn) {
      console.log('⚠️ 로그인되지 않음 - 로그인 페이지로 이동')
      // alert 제거 - 페이지 로드 시 불필요한 알림 방지
      // navigate('/login')
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/routes`)
      console.log('✅ Home - 노선 API 응답:', response.data)
      
      // 응답 데이터 검증
      if (!response.data || !response.data.routes) {
        console.error('❌ API 응답 형식이 올바르지 않습니다:', response.data)
        return
      }
      
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
      
      console.log('✅ Home - 변환된 노선:', routes)
      setReservations(routes)
    } catch (err) {
      console.error('❌ 노선 데이터 로드 실패:', err)
      console.error('에러 상세:', err.response?.data || err.message)
    }
  }

  // 예매 상태 새로고침 (수동)
  const refreshStatus = () => {
    fetchReservationStatus()
    alert('예매 상태를 새로고침했습니다.')
  }

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

          {/* 예매 상태 */}
          {isLoggedIn && (
          <div className="monitoring-mini">
            <h4>예매 상태</h4>
            <div className="status-badge">
              <span className={`status-dot ${reservationStatus.is_open ? 'open' : 'closed'}`}></span>
              <span>{reservationStatus.is_open ? '예매 오픈' : '예매 마감'}</span>
            </div>
            <button className="btn-start-mini" onClick={refreshStatus}>
              상태 새로고침
            </button>
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
          
          {/* iOS 사용자 안내 */}
          {getDeviceType() === 'ios' && !isIOSStandalone() && (
            <div className="notification-warning" style={{ marginBottom: '15px', backgroundColor: '#fff3cd', border: '2px solid #ff9800', padding: '15px', borderRadius: '8px' }}>
              <strong style={{ fontSize: '16px' }}>⚠️ iOS 사용자 필수 안내</strong>
              <p style={{ marginTop: '10px', fontSize: '14px', fontWeight: '500' }}>
                iOS에서 알림을 받으려면 <strong style={{ color: '#ff5722' }}>반드시 홈 화면에 추가</strong>해야 합니다!
              </p>
              <ol style={{ marginTop: '12px', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', backgroundColor: 'white', padding: '12px', borderRadius: '6px' }}>
                <li>Safari 하단의 <strong>공유 버튼</strong> (□↑) 탭</li>
                <li><strong>"홈 화면에 추가"</strong> 선택</li>
                <li><strong>홈 화면의 "통학버스" 앱</strong>으로 실행</li>
                <li>로그인 후 <strong>알림 받기</strong> 버튼 클릭</li>
              </ol>
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '6px', fontSize: '13px' }}>
                <strong>🚨 iOS 제한사항:</strong>
                <ul style={{ marginTop: '6px', paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>앱이 <strong>실행 중일 때만</strong> 알림 표시</li>
                  <li>백그라운드 푸시 알림 <strong>미지원</strong></li>
                  <li>Safari 브라우저에서는 알림 <strong>불가능</strong></li>
                </ul>
              </div>
            </div>
          )}
          
          {/* iOS Standalone 모드 안내 */}
          {getDeviceType() === 'ios' && isIOSStandalone() && (
            <div style={{ marginBottom: '15px', backgroundColor: '#e8f5e9', border: '1px solid #4CAF50', padding: '12px', borderRadius: '8px' }}>
              <strong style={{ color: '#2e7d32' }}>✅ 홈 화면 앱으로 실행 중</strong>
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#555' }}>
                알림을 받을 수 있습니다. (앱 실행 중일 때만)
              </p>
            </div>
          )}
          
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

      {/* 예매 상태 */}
      <div className="monitoring-section">
        <h2>예매 상태</h2>
        <div className="status-display">
          <div className={`status-indicator ${reservationStatus.is_open ? 'open' : 'closed'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {reservationStatus.is_open ? '🔓 예매 오픈' : '🔒 예매 마감'}
            </span>
          </div>
          {reservationStatus.updated_at && (
            <p className="last-updated">
              마지막 업데이트: {new Date(reservationStatus.updated_at).toLocaleString('ko-KR')}
            </p>
          )}
        </div>

        <div className="polling-controls">
          <button onClick={refreshStatus} className="btn-start-polling">
            상태 새로고침
          </button>
          <p className="polling-info">
            🟢 예매가 오픈되면 서버에서 자동으로 푸시 알림을 보냅니다!
          </p>
          {isNotificationEnabled && (
            <p className="notification-active-info">
              🔔 알림이 활성화되어 있습니다. 예매 오픈 시 자동으로 푸시 알림을 받게 됩니다.
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
          <li><strong>2단계:</strong> 관리자가 예매를 오픈하면 서버에서 자동으로 푸시 알림을 보냅니다!</li>
          <li>💡 <strong>앱이 꺼져있어도</strong> 알림을 받을 수 있습니다</li>
          <li>� PC/Android: 브라우저를 닫아도 백그라운드 알림 수신</li>
          <li>📱 iOS: 홈 화면에 추가 후 앱 실행 중일 때만 알림 수신</li>
        </ul>
      </div>
    </div>
  )
}

// 에러 바운더리로 감싼 Home 컴포넌트 export
function Home(props) {
  return (
    <ErrorBoundary>
      <HomeContent {...props} />
    </ErrorBoundary>
  )
}

export default Home
