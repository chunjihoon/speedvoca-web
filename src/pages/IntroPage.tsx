import { useEffect, useState, type ReactNode } from "react";
import loopeakImportImage from "../assets/loopeak-import.jpg";
import loopeakMylearningImage from "../assets/loopeak-mylearning.jpg";
import loopeakStudyImage from "../assets/loopeak-study.jpg";
import loopeakLevelupImage from "../assets/loopeak-levelup.jpg";
import gmailIcon from "../assets/icon-gmail.png";
import linkedinIcon from "../assets/icon-linkedin.png";
import youtubeIcon from "../assets/icon-youtube.png";
import "./intro-page.css";

type IntroLanguage = "ko" | "en";

const INTRO_LANGUAGE_STORAGE_KEY = "speedvoca_intro_language";

const INTRO_COPY = {
  ko: {
    hero: {
      badge: "개인 소개",
      subtitle: "스피킹 반복학습 서비스를 만드는 개발자입니다.",
      body: "캐나다 해밀턴에서 Loopeak을 만들고 있습니다. 보고, 듣고, 말하는 반복을 통해 회화 표현이 자연스럽게 습득되도록 돕는 서비스입니다.",
      meta: "한국 개발자 5년 경력 · 제품 빌더 · 콘텐츠 크리에이터",
      secondaryCta: "LinkedIn 연결",
      toggleAria: "영어로 전환",
      secondaryLinks: [
        {
          label: "LinkedIn",
          href: "http://www.linkedin.com/in/jihun-chun-96563b149",
          icon: linkedinIcon,
        },
        {
          label: "Email",
          href: "mailto:guatemala3081@gmail.com",
          icon: gmailIcon,
        },
        {
          label: "YouTube",
          href: "https://youtube.com/shorts/XvAIM1Qt3Ms?si=Vp49zNsgbvVvo06b",
          icon: youtubeIcon,
        },
      ],
    },
    background: {
      title: "소개",
      lead: "",
      items: [
        {
          title: "소프트웨어 개발 5년 경력",
          items: [
            "Tmoney GO (Asiana IDT): 대국민 모빌리티 서비스, 1,000만+ 사용자 규모",
            "삼성생명 웹앱 (Asiana IDT): Vue.js / TypeScript / Spring Boot REST API",
            "VAN 배치 서버 개발 (SPC Networks): 300만+ 일일 거래 정산 처리",
            "Picqly: 사진 검색 앱 사이드 프로젝트",
          ],
        },
        {
          title: "캐나다 로컬 경험",
          items: [
            "Ramen Isshin Hamilton: Assistant Manager, 매장 운영, 팀 커뮤니케이션, 고객 응대",
            "Ami’s Table: 음식 제조, 고객 응대",
          ],
        },
      ],
    },
    looking: {
      title: "찾고 있는 것",
      lead: "",
      intro: "Loopeak을 더 좋은 스피킹 반복학습 서비스로 키우기 위해 다양한 사람들과 교류하기를 원합니다.",
      items: [
        "Loopeak을 써보고 피드백을 줄 수 있으신 분",
        "제품을 만드는 개발자",
        "초기 서비스를 운영한 창업자",
        "언어학습 · 에듀테크 · 콘텐츠에 관심 있으신 분",
      ],
    },
    contact: {
      title: "연락",
      lead: "LinkedIn, 이메일, 유튜브로 편하게 연결해 주세요.",
      buttons: [
        {
          label: "LinkedIn",
          href: "http://www.linkedin.com/in/jihun-chun-96563b149",
          icon: linkedinIcon,
        },
        {
          label: "Email",
          href: "mailto:guatemala3081@gmail.com",
          icon: gmailIcon,
        },
        {
          label: "YouTube",
          href: "https://youtube.com/shorts/XvAIM1Qt3Ms?si=Vp49zNsgbvVvo06b",
          icon: youtubeIcon,
        },
      ],
    },
  },
  en: {
    hero: {
      badge: "Personal Intro",
      subtitle: "I am a developer building a speaking repetition-learning service.",
      body: "I’m building Loopeak in Hamilton, Canada. It is a service that helps conversation expressions become naturally learned through repetition of seeing, listening, and speaking.",
      meta: "5 years of development experience in Korea · Product Builder · Content Creator",
      secondaryCta: "Connect on LinkedIn",
      toggleAria: "Switch to Korean",
      secondaryLinks: [
        {
          label: "LinkedIn",
          href: "http://www.linkedin.com/in/jihun-chun-96563b149",
          icon: linkedinIcon,
        },
        {
          label: "Email",
          href: "mailto:guatemala3081@gmail.com",
          icon: gmailIcon,
        },
        {
          label: "YouTube",
          href: "https://youtube.com/shorts/XvAIM1Qt3Ms?si=Vp49zNsgbvVvo06b",
          icon: youtubeIcon,
        },
      ],
    },
    background: {
      title: "Background",
      lead: "A concise view of my background through short cards.",
      items: [
        {
          title: "Software Development 5 years",
          items: [
            "Tmoney GO (Asiana IDT) · public mobility service · 10M+ user scale",
            "Samsung Life Insurance web app (Asiana IDT) · Vue.js / TypeScript / Spring Boot REST API",
            "SPC Networks VAN batch server · Oracle DB-based settlement batch development · 3M+ daily transactions",
            "Picqly · photo search app side project",
          ],
        },
        {
          title: "Canadian Local Business",
          items: [
            "Ramen Isshin Hamilton · Assistant Manager · store operations / team communication / customer service",
            "Ami’s Table · food preparation / customer service",
          ],
        },
      ],
    },
    looking: {
      title: "Looking For",
      lead: "I want to connect with different people to grow Loopeak into a better speaking repetition-learning service.",
      intro: "I would especially like to talk with people like these:",
      items: [
        "People who can try Loopeak and share feedback",
        "Developers who build products",
        "Founders who have run early services",
        "People interested in language learning, EdTech, and content",
      ],
    },
    contact: {
      title: "Contact",
      lead: "Feel free to connect through LinkedIn, email, or YouTube.",
      buttons: [
        {
          label: "LinkedIn",
          href: "http://www.linkedin.com/in/jihun-chun-96563b149",
          icon: linkedinIcon,
        },
        {
          label: "Email",
          href: "mailto:guatemala3081@gmail.com",
          icon: gmailIcon,
        },
        {
          label: "YouTube",
          href: "https://youtube.com/shorts/XvAIM1Qt3Ms?si=Vp49zNsgbvVvo06b",
          icon: youtubeIcon,
        },
      ],
    },
  },
} as const;

type IntroCopy = (typeof INTRO_COPY)[IntroLanguage];

const FEATURE_ITEMS = [
  {
    image: loopeakImportImage,
    text: {
      ko: "문장과 해석을 포맷에 맞춰 입력하면 나만의 학습 챕터를 만들 수 있습니다.",
      en: "You can create your own learning chapter by entering sentences and translations in the right format.",
    },
  },
  {
    image: loopeakMylearningImage,
    text: {
      ko: "생성된 챕터는 내 학습 세트로 관리 됩니다.",
      en: "Created chapters are organized inside My Learning.",
    },
  },
  {
    image: loopeakStudyImage,
    text: {
      ko: "TTS 음성이 나오면 따라 말하면서 스피킹을 반복 연습할 수 있습니다.\n반복횟수, 순서셔플, 성우변경, 즐겨찾기 등 개인화 기능을 지원합니다.",
      en: "When the TTS voice plays, you can repeat out loud and practice speaking.\nIt also supports personalization features like repeat count, shuffled order, voice switching, and favorites.",
    },
  },
  {
    image: loopeakLevelupImage,
    text: {
      ko: "반복 버튼을 누르면 경험치가 쌓이고 레벨업을 하게 됩니다.",
      en: "Each repeat builds experience points and helps you level up.",
    },
  },
] as const;

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="intro-paragraph">{children}</p>;
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="intro-section-header">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export default function IntroPage() {
  const [language, setLanguage] = useState<IntroLanguage>(() => {
    if (typeof window === "undefined") {
      return "ko";
    }

    const stored = window.localStorage.getItem(INTRO_LANGUAGE_STORAGE_KEY);
    if (stored === "ko" || stored === "en") {
      return stored;
    }

    return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
  });

  useEffect(() => {
    window.localStorage.setItem(INTRO_LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    document.title = "June | Loopeak";
  }, [language]);

  const copy = INTRO_COPY[language];

  return (
    <main className="intro-page">
      <LanguageToggle copy={copy.hero} language={language} onToggle={() => setLanguage(language === "ko" ? "en" : "ko")} />
      <HeroSection
        copy={copy.hero}
      />
      <FeatureFlowSection language={language} />
      <TryLoopeakSection language={language} />
      <BackgroundSection copy={copy.background} />
      <LookingForSection copy={copy.looking} />
      <ContactSection copy={copy.contact} />
    </main>
  );
}

function HeroSection({
  copy,
}: {
  copy: IntroCopy["hero"];
}) {
  return (
    <section className="intro-hero intro-reveal intro-hero-center">
      <div className="intro-hero-topbar">
        <div className="intro-badge">{copy.badge}</div>
      </div>

      <h1>June</h1>
      <p className="intro-subtitle">{copy.subtitle}</p>
      <Paragraph>{copy.body}</Paragraph>
      <p className="intro-meta">{copy.meta}</p>
      <SocialIconLinks links={copy.secondaryLinks ?? []} />
    </section>
  );
}

function LanguageToggle({
  copy,
  language,
  onToggle,
}: {
  copy: IntroCopy["hero"];
  language: IntroLanguage;
  onToggle: () => void;
}) {
  return (
    <button
      className={`topbar-language-toggle intro-language-toggle-float ${language === "en" ? "is-en" : "is-ko"}`}
      type="button"
      onClick={onToggle}
      aria-label={copy.toggleAria}
    >
      <span className="topbar-language-thumb" aria-hidden="true" />
      <span className="topbar-language-label topbar-language-label-ko">KO</span>
      <span className="topbar-language-label topbar-language-label-en">EN</span>
    </button>
  );
}

function FeatureFlowSection({ language }: { language: IntroLanguage }) {
  return (
    <section className="intro-section intro-reveal">
      <div className="feature-flow-list">
        {FEATURE_ITEMS.map((item, index) => (
          <article key={item.image} className="feature-card">
            <div className="feature-card-media">
              <img src={item.image} alt="" className="feature-card-image" />
            </div>
            <div className="feature-card-copy">
              <span className="feature-card-index">0{index + 1}</span>
              <p>{item.text[language]}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TryLoopeakSection({ language }: { language: IntroLanguage }) {
  return (
    <section className="intro-section intro-reveal">
      <div className="try-cta-panel">
        <div className="try-cta-copy">
          <p className="try-cta-label">{language === "ko" ? "룹픽 시작하기" : "Start Loopeak"}</p>
          <a className="intro-button intro-button-primary intro-button-featured" href="https://loopeak.app/" target="_blank" rel="noreferrer">
            {language === "ko" ? "룹픽 시작하기" : "Try Loopeak"}
          </a>
        </div>
      </div>
    </section>
  );
}

function BackgroundSection({ copy }: { copy: IntroCopy["background"] }) {
  return (
    <section className="intro-section intro-reveal">
      <SectionHeader title={copy.title} description={copy.lead} />
      <div className="build-grid">
        {copy.items.map((item) => (
          <article key={item.title} className="build-card build-card-muted">
            <h3>{item.title}</h3>
            <ul className="background-item-list">
              {item.items.map((listItem) => (
                <li key={listItem}>{listItem}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function LookingForSection({ copy }: { copy: IntroCopy["looking"] }) {
  return (
    <section className="intro-section intro-reveal">
      <SectionHeader title={copy.title} description={copy.lead} />
      <div className="looking-box">
        <Paragraph>{copy.intro}</Paragraph>
        <div className="pill-list">
          {copy.items.map((item) => (
            <span key={item} className="pill-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ copy }: { copy: IntroCopy["contact"] }) {
  return (
    <section className="intro-section intro-reveal intro-section-contact">
      <SectionHeader title={copy.title} description={copy.lead} />

      <SocialIconLinks links={copy.buttons} />
    </section>
  );
}

function SocialIconLinks({
  links,
}: {
  links: ReadonlyArray<{
    label: string;
    href: string;
    icon: string;
  }>;
}) {
  return (
    <div className="social-icon-row" aria-label="Social links">
      {links.map((item) => (
        <a
          key={item.label}
          className="social-icon-button"
          href={item.href}
          target={item.href.startsWith("mailto:") ? undefined : "_blank"}
          rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
          aria-label={item.label}
          title={item.label}
        >
          <img src={item.icon} alt="" className="social-icon-image" />
        </a>
      ))}
    </div>
  );
}
