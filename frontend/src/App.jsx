import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ReservationPage from './pages/ReservationPage'
import './App.css'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  // 로그인 상태 확인
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const userData = localStorage.getItem('user')
    
    if (loggedIn && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [location])

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    alert('로그아웃되었습니다.')
    navigate('/login')
  }

  // 로그인/회원가입 페이지에서는 헤더를 숨김
  const hideHeader = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="app">
      {!hideHeader && (
        <header className="app-header">
          <div className="header-container">
            <div className="logo">한세대학교</div>
            <nav className="header-nav">
              {!isLoggedIn ? (
                <>
                  <Link to="/login" className="nav-link">로그인</Link>
                  <Link to="/register" className="nav-link">회원가입</Link>
                </>
              ) : (
                <>
                  <Link to="/reservation" className="nav-link">예약조회</Link>
                  <button onClick={handleLogout} className="nav-link nav-button">로그아웃</button>
                  <span className="nav-link">정보 수정</span>
                </>
              )}
            </nav>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
