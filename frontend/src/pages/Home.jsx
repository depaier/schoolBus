import { useState, useEffect, useRef, Component } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { requestNotificationWithToken, getDeviceType, isIOSStandalone } from '../utils/webPushNotification'
import './Home.css'

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8000'

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
  const [allRoutes, setAllRoutes] = useState([]) // 전체 노선 목록
  const [busType, setBusType] = useState('등교')
  const [routeName, setRouteName] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('이용안내')
  const [hasSearched, setHasSearched] = useState(false) // 조회 여부
  
  // 예약 프로세스 상태
  const [reservationStep, setReservationStep] = useState('list') // 'list', 'selectSeats', 'confirm'
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [seatCount, setSeatCount] = useState(1)

  const [notificationPermission, setNotificationPermission] = useState('default')
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
  const [pushTokenInfo, setPushTokenInfo] = useState(null) // 푸시 토큰 정보
  const [currentStudentId, setCurrentStudentId] = useState(null) // 현재 로그인한 학번

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

  // 컴포넌트 마운트 시 알림 권한 상태 확인 및 전체 노선 목록 로드
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
    
    // 🔥 전체 노선 목록 로드 (드롭다운용)
    fetchAllRoutes()

    // 🔥 URL 파라미터 확인 (알림에서 온 경우)
    const urlParams = new URLSearchParams(window.location.search)
    const routeId = urlParams.get('route')
    if (routeId) {
      console.log('🔔 알림에서 노선으로 이동:', routeId)
      // URL 파라미터 제거
      window.history.replaceState({}, '', '/')
      // 로그인 상태 확인 후 노선 찾아서 이동 (충분한 시간 대기)
      if (isLoggedIn) {
        setTimeout(() => {
          handleNotificationClick({ route_id: routeId })
        }, 1500) // 노선 로드 대기
      }
    }

    // Service Worker 메시지 리스너
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          console.log('📬 Service Worker 메시지:', event.data)
          // 약간의 지연 후 처리 (페이지 로드 완료 대기)
          setTimeout(() => {
            handleNotificationClick(event.data.data)
          }, 500)
        }
      })
    }
  }, [])
  
  // 🔥 isLoggedIn이 변경될 때마다 전체 노선 목록 다시 로드
  useEffect(() => {
    if (isLoggedIn) {
      console.log('✅ 로그인 상태 변경 감지 - 전체 노선 목록 로드')
      fetchAllRoutes()
    }
  }, [isLoggedIn])

  // 🔥 전체 노선 목록 가져오기 (드롭다운용)
  const fetchAllRoutes = async () => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    
    if (!loggedIn) {
      console.log('⚠️ 로그인되지 않음')
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/routes`)
      console.log('✅ Home - 전체 노선 API 응답:', response.data)
      
      if (!response.data || !response.data.routes) {
        console.error('❌ API 응답 형식이 올바르지 않습니다:', response.data)
        return
      }
      
      const routes = response.data.routes.map(route => ({
        id: route.id,
        routeName: route.route_name,
        routeId: route.route_id,
        busType: route.bus_type || '등교',
        departureDate: route.departure_date || new Date().toISOString().split('T')[0],
        departureTime: route.departure_time,
        availableSeats: route.available_seats,
        totalSeats: route.total_seats,
        isOpen: route.is_open
      }))
      
      console.log('✅ Home - 전체 노선:', routes)
      setAllRoutes(routes)
    } catch (err) {
      console.error('❌ 전체 노선 로드 실패:', err)
      console.error('에러 상세:', err.response?.data || err.message)
    }
  }

  // 🔥 조회 버튼 클릭 시 필터링된 노선 표시
  const handleSearch = () => {
    if (!busType) {
      alert('등교/하교를 선택해주세요.')
      return
    }

    // 등하교 구분과 노선명으로 필터링
    let filtered = allRoutes.filter(route => route.busType === busType)
    
    if (routeName) {
      filtered = filtered.filter(route => route.routeName === routeName)
    }
    
    console.log('🔍 조회 결과:', filtered)
    setReservations(filtered)
    setHasSearched(true)
  }

  // 노선 목록 새로고침 (수동)
  const refreshStatus = () => {
    fetchAllRoutes()
    alert('노선 목록을 새로고침했습니다.')
  }

  // 예약 버튼 클릭 - 인원 선택 단계로 이동
  const handleReservationClick = (route) => {
    setSelectedRoute(route)
    setSeatCount(1)
    setReservationStep('selectSeats')
  }

  // 인원 선택 완료 - 확인 단계로 이동
  const handleSeatSelection = () => {
    if (seatCount < 1) {
      alert('최소 1명 이상 선택해주세요.')
      return
    }
    if (seatCount > selectedRoute.availableSeats) {
      alert(`잔여 좌석(${selectedRoute.availableSeats}석)보다 많이 선택할 수 없습니다.`)
      return
    }
    setReservationStep('confirm')
  }

  // 예약 확정
  const handleConfirmReservation = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const user = JSON.parse(userStr)
      
      const response = await axios.post(`${API_BASE_URL}/api/bookings`, {
        student_id: user.student_id,
        route_id: selectedRoute.routeId,
        seat_count: seatCount,
        departure_date: selectedRoute.departureDate
      })

      alert(`예약이 완료되었습니다! (${seatCount}명)`)
      
      // 상태 초기화 및 노선 목록으로 돌아가기
      setReservationStep('list')
      setSelectedRoute(null)
      setSeatCount(1)
      
      // 노선 목록 새로고침
      handleSearch()
    } catch (err) {
      console.error('❌ 예약 실패:', err)
      alert(err.response?.data?.detail || '예약에 실패했습니다.')
    }
  }

  // 예약 취소 - 목록으로 돌아가기
  const handleCancelReservation = () => {
    setReservationStep('list')
    setSelectedRoute(null)
    setSeatCount(1)
  }

  // 알림 클릭 핸들러
  const handleNotificationClick = async (data) => {
    if (!data || !data.route_id) {
      console.error('❌ 알림 데이터가 없습니다')
      return
    }

    console.log('🔔 알림 클릭 처리:', data)
    console.log('📊 현재 allRoutes 개수:', allRoutes.length)

    // 노선 목록이 비어있으면 먼저 로드
    if (allRoutes.length === 0) {
      console.log('⚠️ 노선 목록이 비어있음, 로드 시작')
      await fetchAllRoutes()
      // 상태 업데이트 대기
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 해당 노선 찾기
    let route = allRoutes.find(r => r.routeId === data.route_id)
    
    if (!route) {
      console.log('⚠️ 노선을 찾을 수 없음, 전체 노선 다시 로드')
      // 노선을 찾을 수 없으면 전체 노선 다시 로드
      await fetchAllRoutes()
      
      // 상태 업데이트 대기
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // API에서 직접 노선 조회 시도
      try {
        const response = await axios.get(`${API_BASE_URL}/api/routes`)
        const routes = response.data.routes.map(r => ({
          id: r.id,
          routeName: r.route_name,
          routeId: r.route_id,
          busType: r.bus_type || '등교',
          departureDate: r.departure_date || new Date().toISOString().split('T')[0],
          departureTime: r.departure_time,
          availableSeats: r.available_seats,
          totalSeats: r.total_seats,
          isOpen: r.is_open
        }))
        
        route = routes.find(r => r.routeId === data.route_id)
        console.log('🔍 API에서 직접 조회한 노선:', route)
      } catch (err) {
        console.error('❌ API 조회 실패:', err)
      }
    }
    
    if (route) {
      console.log('✅ 노선 찾음:', route)
      console.log('📍 현재 reservationStep:', reservationStep)
      
      // 먼저 list 단계로 초기화하고 데이터 설정
      setReservationStep('list')
      setReservations([route])
      setHasSearched(true)
      
      // 약간의 지연 후 인원 선택 단계로 이동 (DOM 업데이트 대기)
      setTimeout(() => {
        console.log('🎯 인원 선택 단계로 전환')
        setSelectedRoute(route)
        setSeatCount(1)
        setReservationStep('selectSeats')
      }, 100)
    } else {
      console.error('❌ 노선을 찾을 수 없습니다:', data.route_id)
      alert('해당 노선을 찾을 수 없습니다. 페이지를 새로고침해주세요.')
    }
  }

  return (
    <div className="home-page">
      {!isLoggedIn ? (
        <div className="login-required-container">
          <div className="login-required-box">
            <h3>🔒 로그인이 필요합니다</h3>
            <p>노선 조회는 로그인 후 이용 가능합니다.</p>
            <button className="btn-login-redirect" onClick={() => navigate('/login')}>
              로그인하러 가기
            </button>
          </div>
        </div>
      ) : (
        <div className="main-container">
          {/* 좌측 패널 - 검색 및 정보 */}
          <div className="left-panel">
            {/* 검색 섹션 */}
            <div className="search-box">
              <div className="form-group">
                <label>구분</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      value="등교" 
                      checked={busType === '등교'}
                      onChange={(e) => setBusType(e.target.value)}
                    />
                    <span>등교</span>
                  </label>
                  <label className="radio-option">
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
                  className="form-select"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                >
                  <option value="">전체</option>
                  {allRoutes
                    .filter(route => route.busType === busType)
                    .map(route => (
                      <option key={route.id} value={route.routeName}>
                        {route.routeName}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label>조회시작</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="form-input"
                  minDate={new Date()}
                />
              </div>

              <button className="btn-search" onClick={handleSearch}>
                조회
              </button>
            </div>

            {/* TODAY 정보 */}
            <div className="today-box">
              <div className="today-label">TODAY</div>
              <div className="today-date">
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit',
                  weekday: 'short'
                }).replace(/\. /g, '.').replace(/\.$/, '')}
              </div>
              <div className="contact-info">
                <p className="contact-title">고객센터</p>
                <p>TEL : 041-688-7610</p>
                <p>kornsbus@kornsbus.co.kr</p>
                <p className="contact-hours">운영시간 (평일9시~18시)</p>
                <p className="contact-hours">온라인 09시 ~ 18시</p>
              </div>
            </div>

            {/* 예약시 주의사항 */}
            <div className="notice-section">
              <h4>예약시 주의사항</h4>
              <ul className="notice-list">
                <li>예약마감은 버스출발 10분전까지 가능, 하교는 기준시 등교(버스시간표 따라 조기마감 될수 있음)</li>
                <li>탑승승차 및 미탑승은 승차거부 됩니다. 지정시간에 탑지 못한 경우</li>
                <li>취소수수료 및 미탑승 위약금 (예약취소시 서비스 페널티 발생)</li>
              </ul>

              <table className="penalty-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>등·하교</th>
                    <th>내용 및 수수료</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>마감시간</td>
                    <td>하교</td>
                    <td>당일 18시 10분 이후 예약 시 수수료 500원 추가(500원)</td>
                  </tr>
                  <tr>
                    <td>예약</td>
                    <td>하교</td>
                    <td>(단, 44석 예약 완료시 추가 예약 불가)</td>
                  </tr>
                  <tr>
                    <td>마감시간</td>
                    <td>하교</td>
                    <td>- 당일 18시 10분까지 취소수수료 면제</td>
                  </tr>
                  <tr>
                    <td>예약 취소</td>
                    <td>하교</td>
                    <td>- 당일 18시 10분 ~ 버스 출발까지 40%의 수수료 징수 후 환불</td>
                  </tr>
                  <tr>
                    <td>예약 후 미탑승 시</td>
                    <td>공통</td>
                    <td>- 등교버스 예약 미탑 시 버스 출발 전 30%의 수수료 징수 후 환불</td>
                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td>마지막 신청 버스출발시간 기준 12시간이내 보고 환불불가(미탑승 소멸)</td>
                  </tr>
                  <tr>
                    <td>환불방법</td>
                    <td></td>
                    <td>환불불 금액은 포인트로 전환 됩니다. (단, 물건, 서비스 등 환불)</td>
                  </tr>
                </tbody>
              </table>

              <p className="notice-footer">※ 미탑승은 예약 후 예약취소를 하지 않아 탑승하지 못한 경우를 말함.</p>
            </div>
          </div>

          {/* 우측 패널 - 배차조회/선택 */}
          <div className="right-panel">
            <h2 className="panel-title">배차조회 / 선택</h2>
            
            {reservationStep === 'list' && (
              <>
                {!hasSearched ? (
                  <div className="empty-routes">
                    <p>노선을 먼저 조회해주세요.</p>
                  </div>
                ) : reservations.length === 0 ? (
                  <div className="empty-routes">
                    <p>조회된 노선이 없습니다.</p>
                  </div>
                ) : (
                  <div className="routes-table-wrapper">
                    <table className="routes-table">
                      <thead>
                        <tr>
                          <th>출발일시</th>
                          <th>구분</th>
                          <th>보유</th>
                          <th>잔여</th>
                          <th>예약</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map((route) => (
                          <tr key={route.id}>
                            <td>{route.departureDate} {route.departureTime}</td>
                            <td>{route.routeName}</td>
                            <td>{route.totalSeats}석</td>
                            <td className={route.availableSeats > 0 ? 'seats-available' : 'seats-full'}>
                              {route.availableSeats > 0 ? `${route.availableSeats}석` : '매진'}
                            </td>
                            <td>
                              <button 
                                className="btn-book"
                                disabled={!route.isOpen || route.availableSeats === 0}
                                onClick={() => handleReservationClick(route)}
                              >
                                {route.isOpen && route.availableSeats > 0 ? '예약' : '불가'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Footer Links */}
                    <div className="footer-links">
                      <a href="#">[이용약관]</a>
                      <a href="#">[개인정보 수집 및 활용]</a>
                      <a href="#">[개인정보 취급방침안내]</a>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 예약 인원 선택 단계 */}
            {reservationStep === 'selectSeats' && selectedRoute && (
              <div className="reservation-step">
                <h3 className="step-title">탑승인원 정보</h3>
                <div className="step-content">
                  <div className="info-row">
                    <span className="info-label">노선구분</span>
                    <span className="info-value">{selectedRoute.busType}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">일시</span>
                    <span className="info-value">{selectedRoute.departureDate} {selectedRoute.departureTime}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">탑승지</span>
                    <span className="info-value">{selectedRoute.routeName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">도착지</span>
                    <span className="info-value">{selectedRoute.busType === '등교' ? '한서대' : selectedRoute.routeName}</span>
                  </div>

                  <div className="seat-selection">
                    <label className="seat-label">※ 탑승인원 선택</label>
                    <select 
                      className="seat-select"
                      value={seatCount}
                      onChange={(e) => setSeatCount(parseInt(e.target.value))}
                    >
                      {[...Array(Math.min(selectedRoute.availableSeats, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}명</option>
                      ))}
                    </select>
                  </div>

                  <div className="step-buttons">
                    <button className="btn-cancel" onClick={handleCancelReservation}>
                      취소
                    </button>
                    <button className="btn-next" onClick={handleSeatSelection}>
                      다음단계
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 예약 확인 단계 */}
            {reservationStep === 'confirm' && selectedRoute && (
              <div className="reservation-step">
                <h3 className="step-title">선택내용</h3>
                <div className="step-content">
                  <div className="info-row">
                    <span className="info-label">노선구분</span>
                    <span className="info-value">{selectedRoute.busType}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">일시</span>
                    <span className="info-value">{selectedRoute.departureDate} {selectedRoute.departureTime}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">탑승지</span>
                    <span className="info-value">{selectedRoute.routeName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">도착지</span>
                    <span className="info-value">{selectedRoute.busType === '등교' ? '한서대' : selectedRoute.routeName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">인원수</span>
                    <span className="info-value">{seatCount}명</span>
                  </div>
                  <div className="info-row total">
                    <span className="info-label">요금</span>
                    <span className="info-value">{(seatCount * 8000).toLocaleString()}원</span>
                  </div>

                  <div className="step-buttons">
                    <button className="btn-cancel" onClick={handleCancelReservation}>
                      취소
                    </button>
                    <button className="btn-confirm" onClick={handleConfirmReservation}>
                      다음단계
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* 안내 메시지 */}
      <div className="info-section">
        <h3>💡 사용 방법</h3>
        <ul>
          <li><strong>1단계:</strong> "알림 받기" 버튼을 클릭하여 푸시 알림을 허용하세요</li>
          <li><strong>2단계:</strong> 관리자가 예매를 오픈하면 서버에서 자동으로 푸시 알림을 보냅니다!</li>
          <li>💡 <strong>앱이 꺼져있어도</strong> 알림을 받을 수 있습니다</li>
          <li>💻 PC/Android: 브라우저를 닫아도 백그라운드 알림 수신</li>
          <li>📱 iOS: 홈 화면에 추가 후 앱 실행 중일 때만 알림 수신</li>
        </ul>
        
        {/* 디버그 버튼 */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => window.location.href = '/push-test.html'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔧 푸시 알림 상태 확인
          </button>
        </div>
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
