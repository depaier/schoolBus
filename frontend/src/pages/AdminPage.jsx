import { useState, useEffect } from 'react'
import './AdminPage.css'
import axios from "../utils/axiosConfig";

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8000'

function AdminPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  // 🔥 검색어 상태 추가
  const [search, setSearch] = useState("");

  const [newRoute, setNewRoute] = useState({
    routeName: '',
    departureTime: '',
    totalSeats: 30
  })

  const [stats, setStats] = useState({
    totalRoutes: 0,
    openRoutes: 0,
    totalSeats: 0,
    bookedSeats: 0
  })

  // 🔥 컴포넌트 마운트 시 노선 데이터 로드
  useEffect(() => {
    console.log('🌐 관리자 페이지 - 사용 중인 API URL:', API_BASE_URL)
    fetchRoutes()
  }, [])

  useEffect(() => {
    updateStats()
  }, [reservations])

  // 🔥 Supabase에서 노선 데이터 가져오기
  const fetchRoutes = async () => {
    try {
      setLoading(true)
      console.log('📡 관리자 페이지 - API 요청:', `${API_BASE_URL}/api/routes`)
      const response = await axios.get(`${API_BASE_URL}/api/routes`)
      console.log('✅ 관리자 페이지 - 응답:', response.data)
      
      // 응답 데이터 검증
      if (!response.data || !response.data.routes) {
        throw new Error('API 응답 형식이 올바르지 않습니다: routes 배열이 없음')
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
      
      console.log('✅ 변환된 노선 데이터:', routes)
      setReservations(routes)
    } catch (err) {
      console.error('❌ 노선 데이터 로드 실패:', err)
      console.error('에러 상세:', err.response?.data || err.message)
      console.error('전체 에러 객체:', err)
      alert(`노선 데이터를 불러오는데 실패했습니다.\n에러: ${err.message}\nAPI URL: ${API_BASE_URL}`)
    } finally {
      setLoading(false)
    }
  }

  const updateStats = () => {
    const totalRoutes = reservations.length
    const openRoutes = reservations.filter(r => r.isOpen).length
    const totalSeats = reservations.reduce((sum, r) => sum + r.totalSeats, 0)
    const bookedSeats = reservations.reduce((sum, r) => sum + (r.totalSeats - r.availableSeats), 0)

    setStats({ totalRoutes, openRoutes, totalSeats, bookedSeats })
  }

  // 🔥 특정 노선의 예매 오픈/닫기 토글
  const toggleReservation = async (id) => {
    const target = reservations.find(r => r.id === id);
    if (!target) return;

    try {
      // 특정 노선의 상태 토글
      await axios.post(`${API_BASE_URL}/api/routes/${target.routeId}/toggle`);

      // 데이터 다시 로드하여 최신 상태 가져오기
      await fetchRoutes();

      // 전체 예매 상태 업데이트 (하나라도 오픈되면 전체 오픈)
      // fetchRoutes 후 reservations가 업데이트되기 전이므로 API로 다시 확인
      const routesResponse = await axios.get(`${API_BASE_URL}/api/routes`);
      const hasOpenRoute = routesResponse.data.routes.some(route => route.is_open);
      
      const updateResponse = await axios.post(`${API_BASE_URL}/api/reservation/update`, {
        is_open: hasOpenRoute
      });

      console.log(`전체 예매 상태 업데이트: ${hasOpenRoute ? '오픈' : '마감'}`);
      
      // 푸시 알림 결과 확인
      if (updateResponse.data.push_notification) {
        console.log('📱 푸시 알림 전송 결과:', updateResponse.data.push_notification);
        if (updateResponse.data.push_notification.success_count > 0) {
          alert(`✅ ${updateResponse.data.push_notification.success_count}명에게 푸시 알림이 전송되었습니다!`);
        }
      }

    } catch (err) {
      console.error("예매 상태 변경 실패:", err);
      alert("서버 연결 오류: 예매 상태 변경 실패");
    }
  };

  const updateSeats = async (id, seats) => {
    const seatNumber = parseInt(seats)
    if (isNaN(seatNumber) || seatNumber < 0) return

    const target = reservations.find(r => r.id === id);
    if (!target) return;

    try {
      await axios.put(`${API_BASE_URL}/api/routes/${target.routeId}`, {
        total_seats: seatNumber,
        available_seats: seatNumber
      });

      // 데이터 다시 로드
      await fetchRoutes();
    } catch (err) {
      console.error("좌석 수 업데이트 실패:", err);
      alert("좌석 수 업데이트에 실패했습니다.");
    }
  }

  const addNewRoute = async () => {
    if (!newRoute.routeName || !newRoute.departureTime) {
      alert('노선명과 출발시간을 입력해주세요.')
      return
    }

    try {
      const routeId = `ROUTE_${String(reservations.length + 1).padStart(3, '0')}`;
      
      await axios.post(`${API_BASE_URL}/api/routes`, {
        route_name: newRoute.routeName,
        route_id: routeId,
        departure_time: newRoute.departureTime,
        total_seats: newRoute.totalSeats
      });

      // 데이터 다시 로드
      await fetchRoutes();
      
      // 입력 필드 초기화
      setNewRoute({ routeName: '', departureTime: '', totalSeats: 30 });
      
      alert('노선이 추가되었습니다.');
    } catch (err) {
      console.error('노선 추가 실패:', err);
      alert('노선 추가에 실패했습니다.');
    }
  }

  const deleteRoute = async (id) => {
    if (!window.confirm('정말 이 노선을 삭제하시겠습니까?')) {
      return;
    }

    const target = reservations.find(r => r.id === id);
    if (!target) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/routes/${target.routeId}`);
      
      // 데이터 다시 로드
      await fetchRoutes();
      
      alert('노선이 삭제되었습니다.');
    } catch (err) {
      console.error('노선 삭제 실패:', err);
      alert('노선 삭제에 실패했습니다.');
    }
  }

  // 🔥 검색된 노선만 필터링
  const filteredReservations = reservations.filter(r =>
    r.routeName.toLowerCase().includes(search.toLowerCase()) ||
    r.routeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>🚌 통학버스 관리자 페이지</h1>
        <p>예매 오픈/닫기 및 노선 관리</p>
      </header>

      {/* 🔥 검색창 */}
      <input
        type="text"
        placeholder="노선 검색 (노선명/노선ID)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
        style={{
          padding: "12px 16px",
          width: "100%",
          marginBottom: "20px",
          border: "2px solid #ddd",
          borderRadius: "8px",
          fontSize: "1rem"
        }}
      />

      {/* 통계 대시보드 */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>전체 노선</h3>
          <p className="stat-number">{stats.totalRoutes}</p>
        </div>
        <div className="stat-card">
          <h3>오픈된 노선</h3>
          <p className="stat-number">{stats.openRoutes}</p>
        </div>
        <div className="stat-card">
          <h3>전체 좌석</h3>
          <p className="stat-number">{stats.totalSeats}</p>
        </div>
        <div className="stat-card">
          <h3>예약된 좌석</h3>
          <p className="stat-number">{stats.bookedSeats}</p>
        </div>
      </div>

      {/* 새 노선 추가 */}
      <div className="add-route-section">
        <h2>새 노선 추가</h2>
        <div className="add-route-form">
          <input
            type="text"
            placeholder="노선명 (예: 등교 노선 B)"
            value={newRoute.routeName}
            onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })}
          />
          <input
            type="time"
            placeholder="출발시간"
            value={newRoute.departureTime}
            onChange={(e) => setNewRoute({ ...newRoute, departureTime: e.target.value })}
          />
          <input
            type="number"
            placeholder="좌석 수"
            value={newRoute.totalSeats}
            onChange={(e) =>
              setNewRoute({ ...newRoute, totalSeats: parseInt(e.target.value) || 30 })
            }
            min="1"
          />
          <button onClick={addNewRoute} className="btn-add">노선 추가</button>
        </div>
      </div>

      {/* 예매 관리 */}
      <div className="reservations-section">
        <h2>예매 관리</h2>
        <div className="reservations-grid">
          
          {/* 🔥 여기서 filteredReservations 사용 */}
          {filteredReservations.map((reservation) => (
            <div
              key={reservation.id}
              className={`reservation-card ${reservation.isOpen ? 'open' : 'closed'}`}
            >
              <div className="reservation-header">
                <h3>{reservation.routeName}</h3>
                <span className={`status-badge ${reservation.isOpen ? 'open' : 'closed'}`}>
                  {reservation.isOpen ? '오픈' : '닫힘'}
                </span>
              </div>

              <div className="reservation-info">
                <p><strong>노선 ID:</strong> {reservation.routeId}</p>
                <p><strong>출발 시간:</strong> {reservation.departureTime}</p>
                <p><strong>남은 좌석:</strong> {reservation.availableSeats} / {reservation.totalSeats}</p>
              </div>

              <div className="reservation-controls">
                <div className="seats-control">
                  <label>좌석 수:</label>
                  <input
                    type="number"
                    value={reservation.totalSeats}
                    onChange={(e) => updateSeats(reservation.id, e.target.value)}
                    min="1"
                    disabled={reservation.isOpen}
                  />
                </div>

                <div className="button-group">
                  <button
                    onClick={() => toggleReservation(reservation.id)}
                    className={`btn-toggle ${reservation.isOpen ? 'btn-close' : 'btn-open'}`}
                  >
                    {reservation.isOpen ? '예매 닫기' : '예매 오픈'}
                  </button>

                  <button
                    onClick={() => deleteRoute(reservation.id)}
                    className="btn-delete"
                    disabled={reservation.isOpen}
                  >
                    삭제
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

        {filteredReservations.length === 0 && (
          <div className="empty-state">
            <p>일치하는 노선이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
