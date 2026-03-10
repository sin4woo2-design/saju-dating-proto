import { Link } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout";

export default function InyeonPage() {
  return (
    <PageLayout title="인연" subtitle="관계/궁합 중심의 아카이브 허브예요.">
      <section className="heroCard utilityCard inyeonHero">
        <h3>오늘의 인연 포인트</h3>
        <p className="statusHint">속도보다 결이 맞는 대화에서 연결 신호가 강하게 들어오는 흐름이에요.</p>
      </section>

      <section className="homeHubGrid">
        <article className="hubCard summaryCard">
          <strong>궁합 리포트</strong>
          <p>생년월일/시간 기반으로 핵심 신호를 확인하는 현재 버전 메인 기능이에요.</p>
          <Link to="/compatibility">궁합 계산하러 가기</Link>
        </article>
        <article className="hubCard utilityCard inyeonStatusCard">
          <strong>인연 콘텐츠 (준비 중)</strong>
          <p>인연 카드 큐레이션, 상황별 대화 템플릿은 다음 업데이트에서 열려요.</p>
          <span className="smallPill">업데이트 예정</span>
        </article>
      </section>
    </PageLayout>
  );
}
