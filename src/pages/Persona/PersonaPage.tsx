import { mockPersona } from "../../data/mockProfiles";

export default function PersonaPage() {
  return (
    <div className="pageWrap">
      <h2>운명의 이상형 페르소나</h2>
      <article className="personaCard">
        <p className="badge">SHAREABLE RESULT</p>
        <h3>Your Destined Partner</h3>
        <ul>
          <li><strong>나이 범위</strong> {mockPersona.ageRange}</li>
          <li><strong>성격</strong> {mockPersona.personality}</li>
          <li><strong>직업군</strong> {mockPersona.career}</li>
          <li><strong>외모 스타일</strong> {mockPersona.appearance}</li>
        </ul>
        <p className="hash">#SajuMatch #DestinyPersona</p>
      </article>
    </div>
  );
}
