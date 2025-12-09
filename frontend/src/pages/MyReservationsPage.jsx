import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import './MyReservationsPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

const MyReservationsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // 로그인 확인
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const studentId = user.student_id;

      if (!studentId) {
        alert('학번 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        navigate('/login');
        return;
      }

      // API 호출
      const response = await axios.get(`${API_BASE_URL}/api/bookings/user/${studentId}`);
      console.log('✅ 예약 내역 조회 성공:', response.data);
      
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('❌ 예약 내역 조회 실패:', err);
      setError(err.response?.data?.detail || '예약 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      confirmed: { text: '예약완료', className: 'status-confirmed' },
      cancelled: { text: '취소됨', className: 'status-cancelled' },
      completed: { text: '탑승완료', className: 'status-completed' }
    };
    
    return statusMap[status] || { text: status, className: 'status-default' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="my-reservations-container">
      <div className="my-reservations-header">
        <h1>🎫 내 예약 내역</h1>
        <button className="btn-back" onClick={() => navigate('/')}>
          ← 홈으로
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>예약 내역을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">⚠️ {error}</p>
          <button className="btn-retry" onClick={fetchMyBookings}>
            다시 시도
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>예약 내역이 없습니다</h3>
          <p>아직 예약한 버스가 없습니다.</p>
          <button className="btn-make-reservation" onClick={() => navigate('/reservation')}>
            버스 예약하러 가기
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          <div className="bookings-count">
            총 <strong>{bookings.length}</strong>건의 예약
          </div>
          
          {bookings.map((booking, index) => {
            const reservation = booking.reservation;
            const route = booking.route;
            const statusInfo = getStatusBadge(reservation.status);

            return (
              <div key={reservation.id || index} className="booking-card">
                <div className="booking-header">
                  <div className="route-info">
                    <h3>{route?.route_name || '노선 정보 없음'}</h3>
                    <span className="route-id">노선 ID: {route?.route_id || '-'}</span>
                  </div>
                  <span className={`status-badge ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <span className="detail-label">🕐 출발 시간</span>
                    <span className="detail-value">{route?.departure_time || '-'}</span>
                  </div>
                  
                  {reservation.seat_number && (
                    <div className="detail-row">
                      <span className="detail-label">💺 좌석 번호</span>
                      <span className="detail-value">{reservation.seat_number}번</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">👤 예약자</span>
                    <span className="detail-value">{reservation.user_name}</span>
                  </div>

                  {reservation.user_phone && (
                    <div className="detail-row">
                      <span className="detail-label">📞 연락처</span>
                      <span className="detail-value">{reservation.user_phone}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">📅 예약 일시</span>
                    <span className="detail-value">{formatDate(reservation.created_at)}</span>
                  </div>
                </div>

                {reservation.status === 'confirmed' && (
                  <div className="booking-actions">
                    <button className="btn-cancel" onClick={() => alert('취소 기능은 준비 중입니다.')}>
                      예약 취소
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyReservationsPage;
