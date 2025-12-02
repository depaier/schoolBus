import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import './LoginPage.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    student_id: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
          <h1>🚌 통학버스 로그인</h1>
          <p>학번과 비밀번호를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="student_id">학번</label>
            <input
              type="text"
              id="student_id"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              placeholder="학번을 입력하세요"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="login-footer">
            <p>계정이 없으신가요?</p>
            <button 
              type="button" 
              onClick={goToRegister}
              className="btn-register-link"
              disabled={loading}
            >
              회원가입하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
