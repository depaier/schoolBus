import { useState, useEffect } from 'react'
import './AdminPage.css'
import axios from "axios";

function AdminPage() {
  const [reservations, setReservations] = useState([
    {
      id: 1,
      routeName: '등교 노선 A',
      routeId: 'ROUTE_001',
      departureTime: '08:00',
      availableSeats: 30,
      totalSeats: 30,
      isOpen: false
    },
    {
      id: 2,
      routeName: '하교 노선 A',
      routeId: 'ROUTE_002',
      departureTime: '17:00',
      availableSeats: 30,
      totalSeats: 30,
      isOpen: false
    }
  ])

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

  useEffect(() => {
    updateStats()
  }, [reservations])

  const updateStats = () => {
    const totalRoutes = reservations.length
    const openRoutes = reservations.filter(r => r.isOpen).length
    const totalSeats = reservations.reduce((sum, r) => sum + r.totalSeats, 0)
    const bookedSeats = reservations.reduce((sum, r) => sum + (r.totalSeats - r.availableSeats), 0)

    setStats({ totalRoutes, openRoutes, totalSeats, bookedSeats })
  }

  // 🔥 서버에 상태 업데이트 후 프론트도 상태 갱신
  const toggleReservation = async (id) => {
    const target = reservations.find(r => r.id === id);
    const newState = !target.isOpen;

    try {
      await axios.post("http://localhost:8000/api/reservation/update", {
        is_open: newState
      });

      setReservations(prev =>
        prev.map(reservation =>
          reservation.id === id
            ? { ...reservation, isOpen: newState }
            : reservation
        )
      );

    } catch (err) {
      console.error("예매 상태 변경 실패:", err);
      alert("서버 연결 오류: 예매 상태 변경 실패");
    }
  };

  const updateSeats = (id, seats) => {
    const seatNumber = parseInt(seats)
    if (isNaN(seatNumber) || seatNumber < 0) return

    setReservations(prev =>
      prev.map(reservation =>
        reservation.id === id
          ? {
              ...reservation,
              totalSeats: seatNumber,
              availableSeats: seatNumber
            }
          : reservation
      )
    )
  }

  const addNewRoute = () => {
    if (!newRoute.routeName || !newRoute.departureTime) {
      alert('노선명과 출발시간을 입력해주세요.')
      return
    }

    const newReservation = {
      id: Date.now(),
      routeName: newRoute.routeName,
      routeId: `ROUTE_${String(reservations.length + 1).padStart(3, '0')}`,
      departureTime: newRoute.departureTime,
      availableSeats: newRoute.totalSeats,
      totalSeats: newRoute.totalSeats,
      isOpen: false
    }

    setReservations([...reservations, newReservation])
    setNewRoute({ routeName: '', departureTime: '', totalSeats: 30 })
  }

  const deleteRoute = (id) => {
    if (window.confirm('정말 이 노선을 삭제하시겠습니까?')) {
      setReservations(prev => prev.filter(r => r.id !== id))
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
