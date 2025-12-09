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
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="my-reservations-page">
      <div className="page-header">
        <h1>예약조회</h1>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-message">
            <p>예약내역이 조회되지 않습니다.</p>
          </div>
        ) : error ? (
          <div className="empty-message">
            <p>예약내역이 조회되지 않습니다.</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-message">
            <p>예약내역이 조회되지 않습니다.</p>
          </div>
        ) : (
          <div className="reservations-table-wrapper">
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>출발일시</th>
                  <th>노선</th>
                  <th>좌석</th>
                  <th>상태</th>
                  <th>예약일시</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => {
                  const reservation = booking.reservation;
                  const route = booking.route;

                  return (
                    <tr key={reservation.id || index}>
                      <td>{route?.departure_time || '-'}</td>
                      <td>{route?.route_name || '-'}</td>
                      <td>{reservation.seat_number ? `${reservation.seat_number}번` : '-'}</td>
                      <td>
                        {reservation.status === 'confirmed' ? '예약완료' : 
                         reservation.status === 'cancelled' ? '취소됨' : 
                         reservation.status === 'completed' ? '탑승완료' : reservation.status}
                      </td>
                      <td>{new Date(reservation.created_at).toLocaleString('ko-KR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          <button className="page-btn" onClick={() => setCurrentPage(1)}>«</button>
          <button className="page-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>‹</button>
          <button className="page-btn active">1</button>
          <button className="page-btn" onClick={() => setCurrentPage(currentPage + 1)}>›</button>
          <button className="page-btn" onClick={() => setCurrentPage(currentPage + 1)}>»</button>
        </div>

        {/* Footer Links */}
        <div className="footer-links">
          <a href="#">[이용약관]</a>
          <a href="#">[개인정보 수집 및 활용]</a>
          <a href="#">[개인정보 취급방침안내]</a>
        </div>
      </div>
    </div>
  );
};

export default MyReservationsPage;
