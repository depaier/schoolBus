import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './App.css'

function App() {
  const [busType, setBusType] = useState('등교')
  const [routeName, setRouteName] = useState('코구일이 탑승한 버스입니다.')
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 10, 18)) // 2025-11-18
  const [activeTab, setActiveTab] = useState('이용안내')

  // 더미 데이터 - 예약시 주의사항
  const noticeData = [
    {
      구분: '이감리스 예약',
      등하교: '하교',
      내용: '- 당일 18시 10분 이후 예약 시 수수료 500원 추가(8,500원)\n(단, 44석 예약 안전시 추가 예약 불가)'
    },
    {
      구분: '이감리스 예약취소',
      등하교: '하교',
      내용: '- 당일 18시 10분까지 취소수수료 없음\n- 당일 18시 10분 ~ 버스 출발전 까지 1000원'
    },
    {
      구분: '예약 후 미탑승 시',
      등하교: '공통',
      내용: '- 등교나 예약 마감 후 버스 출발 전까지 예약 취소 시 30%의 수수료 지급 후 환불\n- 하교나 선 및 하교나선 모두 40%의 수수료 지급 후 환불\n- 미탑승 건은 버스출발시간 기준 12시간이내 로그 불송시켜 시작할 문의 (미송전시 소멸)'
    },
    {
      구분: '환불방법',
      등하교: '',
      내용: '- 환불시 금액은 포인트로 전환 됩니다.(단, 출금, 차세, 동절금 환불)'
    }
  ]

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="header">
        <div className="header-content">
          <div className="logo">한세대학교</div>
          <nav className="nav-menu">
            <a href="#">숙박권예약</a>
            <a href="#">포인트관리</a>
            <a href="#">예약조회</a>
            <a href="#">로그인</a>
            <a href="#">회원가입</a>
          </nav>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="main-content">
        {/* 좌측 사이드바 */}
        <aside className="sidebar-left">
          <div className="search-section">
            <h3>구분</h3>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  value="등교" 
                  checked={busType === '등교'}
                  onChange={(e) => setBusType(e.target.value)}
                />
                등교
              </label>
              <label>
                <input 
                  type="radio" 
                  value="하교" 
                  checked={busType === '하교'}
                  onChange={(e) => setBusType(e.target.value)}
                />
                하교
              </label>
            </div>

            <h3>노선명</h3>
            <input 
              type="text" 
              className="route-input"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="코구일이 탑승한 버스입니다."
            />

            <h3>조회시작</h3>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="date-picker"
            />

            <button className="search-button">조회</button>
          </div>
        </aside>

        {/* 중앙 컨텐츠 */}
        <main className="center-content">
          <div className="today-section">
            <div className="today-label">TODAY</div>
            <h2 className="today-date">2025. 11. 18 (화)</h2>
            <div className="contact-info">
              <p className="contact-center">고객센터</p>
              <p className="tel">TEL : 041-688-7610</p>
              <p className="email">koreabus@koreabus.co.kr</p>
              <p className="hours">운영시간 [평일전화상담]</p>
              <p className="hours-detail">오전 09시 ~ 18시</p>
            </div>
          </div>

          <div className="notice-section">
            <h3>예약시 주의사항</h3>
            <p className="notice-info">
              ※ 예약마감은 버스출발 10분전까지 가능, 하구는 기준은 등골버스출발에 따라 조기마감 될수 있습니다<br/>
              ※ 학급숙차 및 비예약자는 숭차거부 합니다. 자정시간은 필히 확인<br/>
              ※ 취소수수료 및 미탑승 위약금 (예약시스템 사용이 경과시간 기준)
            </p>

            <table className="notice-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>등하교</th>
                  <th>내용 및 수수료</th>
                </tr>
              </thead>
              <tbody>
                {noticeData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.구분}</td>
                    <td>{item.등하교}</td>
                    <td style={{ whiteSpace: 'pre-line', textAlign: 'left' }}>{item.내용}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="notice-footer">
              ※ 미탑승은 예약 후 예약취소를 하지 못하고 탑승하지 않은 경우를 뜻 함.
            </p>
          </div>
        </main>

        {/* 우측 사이드바 */}
        <aside className="sidebar-right">
          <div className="reservation-panel">
            <h3>배차조회 / 신청</h3>
            <div className="tabs">
              <button 
                className={activeTab === '이용안내' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('이용안내')}
              >
                [이용안내]
              </button>
              <button 
                className={activeTab === '개인정보' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('개인정보')}
              >
                [개인정보 수집 및 활용]
              </button>
              <button 
                className={activeTab === '취급위탁' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('취급위탁')}
              >
                [개인정보 취급위탁안내]
              </button>
            </div>
            <div className="reservation-content">
              <p>노선을 먼저 조회해주세요.</p>
            </div>
            <div className="pagination">
              <button>«</button>
              <button>‹</button>
              <button className="active">1</button>
              <button>›</button>
              <button>»</button>
            </div>
          </div>
        </aside>
      </div>
    </Router>
  )
}

export default App
