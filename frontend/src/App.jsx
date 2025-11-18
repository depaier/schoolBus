import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import RegisterPage from './pages/RegisterPage'   // ⭐ 추가
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="main-nav">
          <Link to="/" className="nav-link">홈</Link>
          <Link to="/admin" className="nav-link">관리자</Link>
          <Link to="/register" className="nav-link">회원가입</Link> {/* ⭐ 메뉴에 추가 */}
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/register" element={<RegisterPage />} /> {/* ⭐ 회원가입 페이지 */}
        </Routes>
      </div>
    </Router>
  )
}

export default App
