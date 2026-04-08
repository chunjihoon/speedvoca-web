import type { ReactNode } from "react";

type Props = {
  title: React.ReactNode;
  description?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "import";
};

export default function SectionBlock({
  title,
  description,
  children,
  variant = "primary",
}: Props) {
  return (
    <section className={`section-block section-${variant}`}>
      <div className="section-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
