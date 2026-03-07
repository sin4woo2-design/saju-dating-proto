export default function PersonaPage() {
  return (
    <div className="page-grid">
      <h2>운명의 이상형 페르소나</h2>
      <p className="sub">SNS 공유용 결과 카드</p>

      <section className="persona-card">
        <p className="persona-title">Destined Partner Persona</p>
        <ul>
          <li>
            <strong>나이 범위</strong>
            <span>27–31</span>
          </li>
          <li>
            <strong>성격</strong>
            <span>Warm Strategist</span>
          </li>
          <li>
            <strong>직업군</strong>
            <span>Creative / Product / Design</span>
          </li>
          <li>
            <strong>외모 스타일</strong>
            <span>Calm / Intellectual</span>
          </li>
        </ul>
        <p className="share-hint">#SajuMatch #DestinyType</p>
      </section>
    </div>
  );
}
