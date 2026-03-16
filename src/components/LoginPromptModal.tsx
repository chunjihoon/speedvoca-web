type Props = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onLoginWithGoogle: () => void;
};

export default function LoginPromptModal({
  open,
  title = "로그인이 필요합니다",
  description = "이 기능은 로그인 후 사용할 수 있습니다.",
  onClose,
  onLoginWithGoogle,
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
            Continue with Google
          </button>
        </div>

        <div className="login-modal-footnote">
          현재는 Google 소셜 로그인만 지원합니다.
        </div>
      </div>
    </div>
  );
}