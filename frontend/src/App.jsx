import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="main-nav">
          <Link to="/" className="nav-link">홈</Link>
          <Link to="/admin" className="nav-link">관리자</Link>
          <Link to="/register" className="nav-link">회원가입</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
