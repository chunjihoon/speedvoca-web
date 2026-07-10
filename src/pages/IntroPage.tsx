import { useEffect } from "react";
import "./intro-page.css";

const builtItems = [
  {
    title: "Loopeak",
    description:
      "현재 신규 론칭 중인 언어학습 서비스입니다. 반복 학습, TTS 음성, 다국어 콘텐츠, 사용자 맞춤 학습 흐름을 중심으로 개발하고 있습니다.",
  },
  {
    title: "YouTube Language Learning Content",
    description:
      "Loopeak과 연결되는 언어학습 콘텐츠를 유튜브에서도 제작하고 있습니다. 실제 학습자가 필요한 표현을 확인하고, 콘텐츠로 함께 서비스를 성장시키는 실험을 하고 있습니다.",
  },
  {
    title: "Picqly",
    description:
      "사이드프로젝트 Picqly에도 참여하며 모바일 서비스 운영과 배포, 제품 개선 경험을 쌓았습니다.",
  },
];

const lookingForItems = [
  "언어학습, 에듀테크, 콘텐츠 비즈니스에 관심 있는 분",
  "초기 서비스 런칭과 사용자 확보를 경험한 창업자",
  "웹/모바일 제품 개발자",
  "캐나다에서 사이드프로젝트나 스타트업을 운영하는 분",
  "Loopeak을 직접 써보고 피드백을 줄 수 있는 분",
];

const contactLinks = [
  { label: "Loopeak", href: "https://loopeak.app/" },
  { label: "LinkedIn", href: "http://www.linkedin.com/in/jihun-chun-96563b149" },
  { label: "Email", href: "mailto:guatemala3081@gmail.com" },
];

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="intro-paragraph">{children}</p>;
}

export default function IntroPage() {
  useEffect(() => {
    document.title = "June | Loopeak";
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.alert("현재 소개 페이지 링크를 복사했어요.");
    } catch {
      window.alert("링크 복사에 실패했어요. 브라우저 권한을 확인해 주세요.");
    }
  };

  const handleGoHome = () => {
    window.location.assign("/");
  };

  return (
    <main className="intro-page">
      <section className="intro-hero">
        <div className="intro-badge">Personal Intro</div>
        <div className="intro-brand">
          <img src="/logo.png" alt="Loopeak" className="intro-brand-logo" />
        </div>

        <h1>June</h1>
        <p className="intro-subtitle">Developer · Product Builder · Language Learning Content Creator</p>

        <div className="intro-cta-row">
          <button type="button" className="intro-button intro-button-primary" onClick={handleCopyLink}>
            페이지 링크 복사
          </button>
          <button type="button" className="intro-button intro-button-secondary" onClick={handleGoHome}>
            메인으로 이동
          </button>
        </div>
      </section>

      <section className="intro-grid">
        <article className="intro-card intro-card-wide">
          <h2>About</h2>
          <Paragraph>
            안녕하세요. 저는 한국에서 iOS와 서버 개발자로 일했고, 현재는 캐나다에서
            언어학습 서비스 <strong>Loopeak</strong>을 만들고 있는 June입니다.
          </Paragraph>
          <Paragraph>
            저는 오랫동안 “언어를 배운다”는 일이 단순히 단어를 외우거나 문법을 공부하는
            것만으로는 충분하지 않다고 느껴왔습니다. 실제로 말하고, 듣고, 반복하고, 다시
            꺼내 쓰는 과정이 있어야 언어가 몸에 남는다고 생각합니다.
          </Paragraph>
          <Paragraph>
            그 고민에서 시작한 서비스가 <strong>Loopeak</strong>입니다.
          </Paragraph>
          <Paragraph>
            Loopeak은 사용자가 영어, 프랑스어, 중국어 등 다양한 언어 표현을 반복해서 보고,
            듣고, 말할 수 있도록 돕는 언어 반복학습 서비스입니다. 단순한 단어장보다는 더
            살아 있는 학습 경험을 만들고 싶었고, 실제 학습자가 매일 부담 없이 다시 돌아올 수
            있는 구조를 목표로 만들고 있습니다.
          </Paragraph>
        </article>

        <article className="intro-card">
          <h2>What I’ve Built</h2>
          <div className="intro-stack">
            {builtItems.map((item) => (
              <div key={item.title} className="intro-stack-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="intro-card">
          <h2>My Background</h2>
          <Paragraph>
            한국에서는 약 5년간 개발자로 일했습니다. 서버 개발과 iOS 개발을 경험했고, 실제
            사용자에게 제공되는 서비스 개발과 운영에 참여했습니다.
          </Paragraph>
          <Paragraph>
            특히 모바일 서비스, 결제/교통 관련 서비스, 대규모 데이터 처리 흐름을 다루며
            단순히 코드를 작성하는 것보다 “서비스가 실제로 안정적으로 작동하게 만드는 일”에
            관심을 갖게 되었습니다.
          </Paragraph>
          <Paragraph>
            캐나다에 온 이후에는 해밀턴 지역의 로컬 음식점에서 일하며 현지 고객 응대, 매장
            운영, 팀 커뮤니케이션, 재고와 매출 관리 등 실제 비즈니스 운영 경험도 쌓고
            있습니다. 이 경험은 기술만으로는 알기 어려운 사용자 행동, 현장 운영, 고객 경험을
            이해하는 데 큰 도움이 되었습니다.
          </Paragraph>
        </article>

        <article className="intro-card">
          <h2>Education &amp; Content Experience</h2>
          <Paragraph>
            저는 개발자이기 전에 사람을 가르치고, 동기를 만들고, 계속 참여하게 만드는 일에도
            관심이 많았습니다.
          </Paragraph>
          <Paragraph>
            한국에서는 치어리딩 레슨과 관련 콘텐츠를 운영하며 사람들에게 움직임을 가르치고,
            수업을 기획하고, 콘텐츠를 만들어 왔습니다. 이 경험은 지금 Loopeak을 만들 때도
            이어지고 있습니다.
          </Paragraph>
          <Paragraph>
            좋은 학습 서비스는 단순히 기능이 많은 앱이 아니라, 사용자가 다시 돌아오고 싶게
            만드는 경험이어야 한다고 생각합니다.
          </Paragraph>
        </article>

        <article className="intro-card intro-card-wide">
          <h2>What I’m Looking For</h2>
          <Paragraph>
            현재 저는 Loopeak을 더 좋은 언어학습 서비스로 발전시키기 위해 다양한 사람들과
            연결되고 싶습니다.
          </Paragraph>
          <Paragraph>특히 이런 분들과 이야기 나누고 싶습니다.</Paragraph>
          <ul className="intro-list">
            {lookingForItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Paragraph>
            저는 개발, 교육, 콘텐츠, 현장 비즈니스 경험을 연결해 실제로 사람들이 꾸준히
            사용하는 언어학습 서비스를 만들고 싶습니다.
          </Paragraph>
          <Paragraph>편하게 연락 주세요.</Paragraph>
        </article>

        <article className="intro-card intro-card-wide">
          <h2>Contact</h2>
          <div className="intro-links">
            {contactLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
