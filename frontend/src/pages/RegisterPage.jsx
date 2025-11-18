import React from "react";
import "./RegisterPage.css";

function RegisterPage() {
  return (
    <div className="join-wrap">
      <h2 className="join-title">회원가입</h2>
      <div className="join-line"></div>

      <table className="join-table">

        <tr>
          <th>* 학번/교번</th>
          <td><input type="text" className="input" /></td>

          <th>* 학번/교번입력 (학번이 없을 경우 핸드폰번호입력)</th>
        </tr>

        <tr>
          <th>* 비밀번호</th>
          <td colSpan={3}><input type="password" className="input full" /></td>
        </tr>

        <tr>
          <th>* 비밀번호 확인</th>
          <td colSpan={3}><input type="password" className="input full" /></td>
        </tr>

        <tr>
          <th>* 이름</th>
          <td colSpan={3}><input type="text" className="input full" /></td>
        </tr>

        <tr>
          <th>* 연락처</th>
          <td colSpan={3}>
            <input type="text" className="input small" /> -
            <input type="text" className="input small" /> -
            <input type="text" className="input small" />
          </td>
        </tr>

        <tr>
          <th>* 이메일</th>
          <td colSpan={3}><input type="text" className="input full" /></td>
        </tr>

      </table>

      <div className="join-submit">저장하기</div>
    </div>
  );
}

export default RegisterPage;
