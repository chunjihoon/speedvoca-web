import type { AppUiText } from "../constants/i18n";

type Props = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onLoginWithGoogle: () => void;
  ui: AppUiText;
};

export default function LoginPromptModal({
  open,
  title,
  description,
  onClose,
  onLoginWithGoogle,
  ui,
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <button className="control-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="login-provider-list">
          <button className="google-login-btn" onClick={onLoginWithGoogle}>
            <span className="google-mark">G</span>
            {ui.loginPrompt.continueWithGoogle}
          </button>
        </div>

        <div className="login-modal-footnote">
          {ui.loginPrompt.googleOnlyFootnote}
        </div>
      </div>
    </div>
  );
}
