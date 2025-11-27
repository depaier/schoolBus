// src/ReservationPage.jsx
import React, { useState, useEffect} from 'react';
import './ReservationPage.css';

const ReservationPage = () => {
  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오는 함수
  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 상태 관리
  const [direction, setDirection] = useState('school'); // 등교/하교
  
  // [수정] 초기값을 오늘 날짜로 설정
  const [date, setDate] = useState(getToday());

  // 커스텀 노선 선택 상태
  const [route, setRoute] = useState('선택'); 
  const [isRouteOpen, setIsRouteOpen] = useState(false);

  // 노선 데이터
  const routeOptions = [
    { value: 'select', label: '선택' },
    { value: 'seoul', label: '서울' },
    { value: 'incheon', label: '인천' },
    { value: 'suwon', label: '수원' },
    { value: 'ansan', label: '안산' },
  ];

  // 노선 선택 핸들러
  const handleRouteSelect = (label) => {
    setRoute(label);
    setIsRouteOpen(false);
  };

  // 아이콘 클릭 시 실행
  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker(); // 브라우저 달력 강제 열기
      } catch (e) {
        // showPicker를 지원하지 않는 옛날 브라우저용 예외처리
        dateInputRef.current.focus(); 
      }
    }
  };

  // 더미 데이터
  const scheduleData = [
    { id: 1, time: '11월 27일 07:50', type: '환승', price: '8,000원', seats: 45, status: 'available' },
    { id: 2, time: '12월 01일 07:50', type: '환승', price: '8,000원', seats: 45, status: 'available' },
    { id: 3, time: '12월 02일 07:50', type: '환승', price: '8,000원', seats: 45, status: 'available' }, // 매진 테스트용
    { id: 4, time: '12월 03일 07:50', type: '환승', price: '8,000원', seats: 45, status: 'available' },
    { id: 5, time: '12월 04일 07:50', type: '환승', price: '8,000원', seats: 45, status: 'available' },
  ];

  return (
    <div className="hsu-container">

      {/* 메인 콘텐츠 영역 */}
      <div className="hsu-main-wrapper">
        
        {/* 왼쪽 컬럼 (45%) */}
        <aside className="hsu-left-col">
          
          {/* 검색 섹션 */}
          <section className="search-box">
            <h2 className="section-title">승차권예약</h2>
            
            <div className="form-group">
              <span className="form-label">구분</span>
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="direction" 
                    value="school" 
                    checked={direction === 'school'}
                    onChange={(e) => setDirection(e.target.value)}
                  /> 등교
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="direction" 
                    value="home" 
                    checked={direction === 'home'}
                    onChange={(e) => setDirection(e.target.value)}
                  /> 하교
                </label>
              </div>
            </div>

            {/* 노선명 (커스텀 그리드 셀렉트) */}
            <div className="form-group">
              <label className="form-label">노선명</label>
              
              <div className="custom-select-wrapper">
                <div 
                  className="custom-select-trigger" 
                  onClick={() => setIsRouteOpen(!isRouteOpen)}
                >
                  {route}
                  <span className="arrow-icon">▼</span>
                </div>

                {isRouteOpen && (
                  <div className="custom-dropdown-grid">
                    {routeOptions.map((option) => (
                      <div 
                        key={option.value} 
                        className={`grid-item ${route === option.label ? 'selected' : ''}`}
                        onClick={() => handleRouteSelect(option.label)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* [수정] 오늘 날짜 기본 적용된 조회 시작 */}
            <div className="form-group">
              <label className="form-label">조회시작</label>
              <input 
                type="date" 
                className="form-input-text" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>

            <button className="btn-primary">배차 조회하기</button>
          </section>

          {/* 주의사항 섹션 */}
          <section className="notice-box">
            <h3 className="notice-title">예약시 주의사항</h3>
            <ul className="notice-list">
              <li>예약은 출발 10분 전까지 가능합니다.</li>
              <li>무단 미탑승 시 페널티가 부과될 수 있습니다.</li>
              <li>포인트가 부족할 경우 예약이 불가능합니다.</li>
              <li>차량 시간표는 학교 사정에 의해 변경될 수 있습니다.</li>
            </ul>
          </section>
        </aside>

        {/* 오른쪽 컬럼 (55%) */}
        <main className="hsu-right-col">
          <section>
            <h2 className="section-title">배차조회 / 선택</h2>
            
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>출발일시</th>
                  <th>구분</th>
                  <th>요금</th>
                  <th>잔여</th>
                  <th>예약</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.time}</td>
                    <td>{item.type}</td>
                    <td>{item.price}</td>
                    <td className={item.seats > 0 ? "status-available" : ""}>
                      {item.seats > 0 ? `${item.seats}석` : "매진"}
                    </td>
                    <td>
                      {/* [수정] 빨간색 예약 버튼 적용 */}
                      <button 
                        className="btn-reserve-red" 
                        disabled={item.seats === 0}
                      >
                        {item.seats > 0 ? "예약" : "불가"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button className="btn-book" style={{margin: '0 2px'}}>&lt;</button>
              <button className="btn-book" style={{margin: '0 2px', background: '#000', color: '#fff'}}>1</button>
              <button className="btn-book" style={{margin: '0 2px'}}>2</button>
              <button className="btn-book" style={{margin: '0 2px'}}>3</button>
              <button className="btn-book" style={{margin: '0 2px'}}>&gt;</button>
            </div>

          </section>
        </main>
      </div>

      {/* 푸터 */}
      <footer className="hsu-footer">
        <p>Copyright © 2024 Hanseo University. All Rights Reserved.</p>
        <p>충청남도 서산시 해미면 한서1로 46 | Tel: 041-660-1114</p>
      </footer>
    </div>
  );
};

export default ReservationPage;