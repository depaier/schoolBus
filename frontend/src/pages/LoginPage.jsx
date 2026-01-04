import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import './LoginPage.css'

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8000'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    student_id: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 입력 시 에러 메시지 초기화
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!formData.student_id || !formData.password) {
      setError('학번과 비밀번호를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
        student_id: formData.student_id,
        password: formData.password
      })

      // 로그인 성공
      const userData = response.data.user
      
      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isLoggedIn', 'true')
      
      alert(`환영합니다, ${userData.name}님!`)
      
      // 홈 페이지로 직접 이동 (새로고침 없이)
      window.location.href = '/'
      
    } catch (err) {
      console.error('로그인 실패:', err)
      
      if (err.response?.status === 401) {
        setError('학번 또는 비밀번호가 일치하지 않습니다.')
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const goToRegister = () => {
    navigate('/register')
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>로그인</h1>
        </div>

        <div className="login-box">
          <div className="login-box-header">
            <h2>회원로그인</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-inputs">
              <div className="input-group">
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="202100665"
                  disabled={loading}
                  autoFocus
                />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="btn-login"
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>아이디저장</span>
              </label>
              <button type="button" className="find-link">
                아이디 / 비밀번호 찾기
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="login-footer">
          <button 
            type="button" 
            onClick={goToRegister}
            className="btn-register"
            disabled={loading}
          >
            회원가입
          </button>
          <div className="contact-info">
            문의전화 | 041-688-7610
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
