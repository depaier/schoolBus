import { useState, useEffect } from 'react'
import { exampleAPI } from '../services/api'
import '../App.css'

function Home() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await exampleAPI.getAll()
      setData(response.data)
      setError(null)
    } catch (err) {
      setError('API 연결 실패: ' + err.message)
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <h1>SchoolBus - React + FastAPI</h1>
      
      <div className="card">
        <h2>API 연결 테스트</h2>
        
        {loading && <p>로딩 중...</p>}
        
        {error && (
          <div style={{ color: 'red' }}>
            <p>{error}</p>
            <p>백엔드 서버가 실행 중인지 확인하세요 (http://localhost:8000)</p>
          </div>
        )}
        
        {!loading && !error && (
          <div>
            <p>✅ API 연결 성공!</p>
            <ul>
              {data.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
        )}
        
        <button onClick={fetchData}>새로고침</button>
      </div>
    </div>
  )
}

export default Home
