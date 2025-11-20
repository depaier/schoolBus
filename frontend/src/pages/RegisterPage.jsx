import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    studentId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone1: "",
    phone2: "",
    phone3: "",
    email: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    // 학번 검사
    if (!formData.studentId.trim()) {
      newErrors.studentId = "학번/교번을 입력해주세요.";
    }

    // 비밀번호 검사 (현재는 저장하지 않지만 UI에 있으므로 검증)
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 4) {
      newErrors.password = "비밀번호는 최소 4자 이상이어야 합니다.";
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    // 이름 검사
    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    // 연락처 검사
    if (!formData.phone1 || !formData.phone2 || !formData.phone3) {
      newErrors.phone = "연락처를 모두 입력해주세요.";
    }

    // 이메일 검사 (선택사항이지만 입력했다면 형식 검증)
    if (formData.email && !formData.email.includes("@")) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 제출
  const handleSubmit = async () => {
    // 유효성 검사
    if (!validateForm()) {
      alert("입력 정보를 확인해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 전화번호 합치기
      const phone = `${formData.phone1}-${formData.phone2}-${formData.phone3}`;

      // API 호출
      const response = await axios.post("http://localhost:8000/api/users/register", {
        student_id: formData.studentId,
        name: formData.name,
        email: formData.email || null,
        phone: phone
      });

      // 성공
      alert("회원가입이 완료되었습니다!");
      console.log("회원가입 성공:", response.data);
      
      // 홈으로 이동
      navigate("/");
      
    } catch (error) {
      console.error("회원가입 실패:", error);
      
      if (error.response) {
        // 서버에서 응답이 온 경우
        if (error.response.status === 400) {
          alert(error.response.data.detail || "이미 등록된 학번입니다.");
        } else {
          alert("회원가입에 실패했습니다. 다시 시도해주세요.");
        }
      } else if (error.request) {
        // 요청은 보냈지만 응답이 없는 경우
        alert("서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
      } else {
        // 요청 설정 중 에러
        alert("오류가 발생했습니다: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="join-wrap">
      <h2 className="join-title">회원가입</h2>
      <div className="join-line"></div>

      <table className="join-table">
        <tbody>
          <tr>
            <th>* 학번/교번</th>
            <td colSpan={3}>
              <input 
                type="text" 
                className="input" 
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="학번 또는 교번을 입력하세요"
              />
              {errors.studentId && <div className="error-msg">{errors.studentId}</div>}
            </td>
          </tr>

          <tr>
            <th>* 비밀번호</th>
            <td colSpan={3}>
              <input 
                type="password" 
                className="input full" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
              />
              {errors.password && <div className="error-msg">{errors.password}</div>}
              <div className="info-msg">※ 현재는 비밀번호를 저장하지 않습니다 (추후 인증 기능 추가 예정)</div>
            </td>
          </tr>

          <tr>
            <th>* 비밀번호 확인</th>
            <td colSpan={3}>
              <input 
                type="password" 
                className="input full" 
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
              />
              {errors.passwordConfirm && <div className="error-msg">{errors.passwordConfirm}</div>}
            </td>
          </tr>

          <tr>
            <th>* 이름</th>
            <td colSpan={3}>
              <input 
                type="text" 
                className="input full" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
              />
              {errors.name && <div className="error-msg">{errors.name}</div>}
            </td>
          </tr>

          <tr>
            <th>* 연락처</th>
            <td colSpan={3}>
              <input 
                type="text" 
                className="input small" 
                name="phone1"
                value={formData.phone1}
                onChange={handleChange}
                placeholder="010"
                maxLength="3"
              /> -
              <input 
                type="text" 
                className="input small" 
                name="phone2"
                value={formData.phone2}
                onChange={handleChange}
                placeholder="1234"
                maxLength="4"
              /> -
              <input 
                type="text" 
                className="input small" 
                name="phone3"
                value={formData.phone3}
                onChange={handleChange}
                placeholder="5678"
                maxLength="4"
              />
              {errors.phone && <div className="error-msg">{errors.phone}</div>}
            </td>
          </tr>

          <tr>
            <th>이메일</th>
            <td colSpan={3}>
              <input 
                type="email" 
                className="input full" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com (선택사항)"
              />
              {errors.email && <div className="error-msg">{errors.email}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      <div 
        className={`join-submit ${isSubmitting ? 'disabled' : ''}`}
        onClick={isSubmitting ? null : handleSubmit}
      >
        {isSubmitting ? "처리 중..." : "저장하기"}
      </div>
    </div>
  );
}

export default RegisterPage;
