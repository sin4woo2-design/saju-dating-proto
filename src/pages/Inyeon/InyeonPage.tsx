import { Link } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout";
import "./InyeonPage.css";

export default function InyeonPage() {
  return (
    <PageLayout title="인연" subtitle="관계와 궁합을 확인하는 매칭 아카이브예요.">
      
      {/* ── HERO ── */}
      <section className="inyeonHero anim-slide-up">
        <div className="inyeonHeroHeader">
          <span className="inyeonSparkle">✨</span>
          <h3 className="inyeonHeroTitle">오늘의 인연 포인트</h3>
        </div>
        <p className="inyeonHeroDesc">
          속도보다 결이 맞는 대화에서 연결 신호가 강하게 들어오는 흐름이에요.
        </p>
      </section>

      {/* ── MAIN ACTION ── */}
      <section className="inyeonMainCard anim-fade-in anim-delay-1">
        <div className="inyeonMainIcon">💌</div>
        <div className="inyeonMainContent">
          <h3>궁합 리포트</h3>
          <p>생년월일과 태어난 시간 기반으로 나와 상대방의 핵심 연결 신호를 확인해보세요.</p>
        </div>
        <Link to="/compatibility" className="inyeonMainCta">
          궁합 계산하러 가기
        </Link>
      </section>

      {/* ── UPCOMING FEATURES ── */}
      <section className="inyeonUpcomingSection anim-fade-in anim-delay-2">
        <div className="upcomingDivider" />
        
        <article className="upcomingCard disabled">
          <div className="upcomingHead">
            <strong>인연 카드 큐레이션</strong>
            <span className="upcomingBadge">업데이트 예정</span>
          </div>
          <p>나와 주파수가 맞는 사람들의 카드를 매일 조금씩 소개해요.</p>
        </article>

        <article className="upcomingCard disabled">
          <div className="upcomingHead">
            <strong>상황별 대화 템플릿</strong>
            <span className="upcomingBadge">업데이트 예정</span>
          </div>
          <p>사주 기반으로 어색함을 깨는 첫인사부터 속마음 대화법까지 제안해요.</p>
        </article>
      </section>

    </PageLayout>
  );
}
