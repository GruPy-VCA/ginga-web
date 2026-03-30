import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAmplifyConfigured } from "../config/amplify";

function cognitoMessage(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    const name = String((err as { name: string }).name);
    if (name === "UserNotConfirmedException") {
      return "Confirme seu e-mail antes de entrar (código enviado pelo Cognito).";
    }
    if (name === "NotAuthorizedException") {
      return "E-mail ou senha incorretos.";
    }
    if (name === "UserAlreadyAuthenticatedException") {
      return "Você já está autenticado.";
    }
    if (name === "InvalidPasswordException") {
      return "A nova senha não atende à política do Cognito (tamanho, maiúsculas, etc.).";
    }
    if (name === "UsernameExistsException") {
      return "Já existe uma conta com este e-mail. Entre ou use outro e-mail.";
    }
    if (name === "CodeMismatchException") {
      return "Código incorreto. Verifique o e-mail ou solicite um novo código.";
    }
    if (name === "ExpiredCodeException") {
      return "Código expirado. Solicite um novo código.";
    }
    if (name === "LimitExceededException") {
      return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    }
    if (name === "InvalidParameterException") {
      return "Dados inválidos. Verifique nome, e-mail e senha.";
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Não foi possível entrar. Tente novamente.";
}

const ATTR_LABELS: Record<string, string> = {
  email: "E-mail",
  phone_number: "Telefone",
  name: "Nome",
  given_name: "Nome",
  family_name: "Sobrenome",
  preferred_username: "Nome de usuário",
};

export function Login() {
  const {
    user,
    loading,
    me,
    meLoading,
    meError,
    refreshMe,
    signInWithEmail,
    completeNewPasswordSignIn,
    signOutUser,
    registerWithEmail,
    completeSignUpWithCode,
    tryCompleteSignUpWithoutConfirmation,
    resendSignUpEmailCode,
  } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [phase, setPhase] = useState<
    "credentials" | "newPassword" | "signup" | "confirmEmail"
  >("credentials");
  const [missingAttributes, setMissingAttributes] = useState<string[]>([]);
  const [extraAttrValues, setExtraAttrValues] = useState<Record<string, string>>({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [pendingSignupEmail, setPendingSignupEmail] = useState("");
  const [pendingSignupPassword, setPendingSignupPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  /** Deve ficar antes de qualquer return condicional (regras dos hooks). */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  if (!isAmplifyConfigured()) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-6">
          <p className="font-semibold mb-2">Cognito não configurado</p>
          <p className="text-sm">
            Copie <code className="bg-amber-100 px-1 rounded">frontend/.env.example</code> para{" "}
            <code className="bg-amber-100 px-1 rounded">.env</code> e preencha{" "}
            <code className="bg-amber-100 px-1 rounded">VITE_COGNITO_*</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!loading && user) {
    if (meLoading) {
      return (
        <div className="max-w-md mx-auto px-4 py-16 text-center text-foreground/80">
          <p>Preparando sua sessão…</p>
        </div>
      );
    }
    if (!me) {
      return (
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-red-800 text-sm">{meError ?? "Não foi possível carregar o perfil."}</p>
          <button
            type="button"
            onClick={() => void refreshMe()}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    if (!me.is_profile_complete) {
      return <Navigate to="/profile" replace state={{ from }} />;
    }
    return <Navigate to={from} replace />;
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const out = await signInWithEmail(email, password);
      if (out.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        const missing = out.nextStep.missingAttributes ?? [];
        setMissingAttributes(missing);
        const initial: Record<string, string> = {};
        for (const key of missing) {
          if (key === "email") initial[key] = email.trim();
        }
        setExtraAttrValues(initial);
        setPhase("newPassword");
        setNewPassword("");
        setConfirmNewPassword("");
        return;
      }
      if (!out.isSignedIn && out.nextStep.signInStep !== "DONE") {
        setError(
          "Este login exige outro passo no Cognito (MFA ou confirmação). Entre em contato com o suporte ou use o console AWS.",
        );
      }
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNewPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmNewPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres (regra mínima do pool).");
      return;
    }
    setSubmitting(true);
    try {
      const attrs: Record<string, string> = {};
      for (const key of missingAttributes) {
        const v = extraAttrValues[key]?.trim();
        if (!v) {
          setError(`Preencha o campo: ${ATTR_LABELS[key] ?? key}.`);
          setSubmitting(false);
          return;
        }
        attrs[key] = v;
      }
      const out = await completeNewPasswordSignIn(
        newPassword,
        missingAttributes.length > 0 ? attrs : undefined,
      );
      if (!out.isSignedIn && out.nextStep.signInStep !== "DONE") {
        setError(
          "Ainda há um passo pendente no login. Atualize a página e tente de novo ou use o console Cognito.",
        );
      }
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelNewPassword() {
    setError(null);
    setPhase("credentials");
    setMissingAttributes([]);
    setExtraAttrValues({});
    setNewPassword("");
    setConfirmNewPassword("");
    try {
      await signOutUser();
    } catch {
      /* limpa estado local mesmo se signOut falhar */
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres (política do Cognito).");
      return;
    }
    if (!givenName.trim() || givenName.trim().length < 2) {
      setError("Informe seu nome (mínimo 2 caracteres).");
      return;
    }
    if (!familyName.trim() || familyName.trim().length < 2) {
      setError("Informe seu sobrenome (mínimo 2 caracteres).");
      return;
    }
    setSubmitting(true);
    try {
      const out = await registerWithEmail(email, password, givenName, familyName);
      if (out.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setPendingSignupEmail(email.trim());
        setPendingSignupPassword(password);
        setConfirmationCode("");
        setPhase("confirmEmail");
        setResendCooldown(0);
        return;
      }
      const done = await tryCompleteSignUpWithoutConfirmation(out, email, password);
      if (!done) {
        setError(
          "Conta criada, mas não foi possível entrar automaticamente. Use «Entrar» com seu e-mail e senha.",
        );
        setPhase("credentials");
      }
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmationCode.trim()) {
      setError("Informe o código de verificação enviado ao seu e-mail.");
      return;
    }
    setSubmitting(true);
    try {
      await completeSignUpWithCode(pendingSignupEmail, confirmationCode, pendingSignupPassword);
      setPendingSignupPassword("");
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmationCode() {
    if (resendCooldown > 0 || !pendingSignupEmail) return;
    setError(null);
    try {
      await resendSignUpEmailCode(pendingSignupEmail);
      setResendCooldown(60);
    } catch (err) {
      setError(cognitoMessage(err));
    }
  }

  function goBackToLoginFromSignup() {
    setError(null);
    setPhase("credentials");
    setPendingSignupPassword("");
    setConfirmationCode("");
    setGivenName("");
    setFamilyName("");
    setConfirmPassword("");
  }

  if (phase === "newPassword") {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-surface rounded-2xl shadow-[var(--shadow-soft)] border border-primary-100 p-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Definir nova senha</h1>
          <p className="text-foreground/70 text-sm mb-6">
            Você entrou com a <strong>senha temporária</strong> enviada por e-mail. Agora escolha uma
            senha definitiva (mín. 8 caracteres, com maiúscula, minúscula e número, conforme o pool
            Ginga).
          </p>
          <form onSubmit={(e) => void handleNewPasswordSubmit(e)} className="space-y-4">
            {missingAttributes.map((key) => (
              <div key={key}>
                <label htmlFor={`attr-${key}`} className="block text-sm font-medium text-foreground mb-1">
                  {ATTR_LABELS[key] ?? key}
                </label>
                <input
                  id={`attr-${key}`}
                  type={key === "email" ? "email" : "text"}
                  required
                  value={extraAttrValues[key] ?? ""}
                  onChange={(e) =>
                    setExtraAttrValues((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1">
                Nova senha
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Confirmar nova senha
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {submitting ? "Salvando…" : "Definir senha e entrar"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleCancelNewPassword()}
              className="w-full border border-primary-200 text-primary font-medium py-3 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              Cancelar e voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === "confirmEmail") {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-surface rounded-2xl shadow-[var(--shadow-soft)] border border-primary-100 p-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Confirmar e-mail</h1>
          <p className="text-foreground/70 text-sm mb-6">
            Enviamos um código para <strong>{pendingSignupEmail}</strong>. Digite-o abaixo para
            ativar sua conta. Em seguida você entrará automaticamente e seu{" "}
            <strong>perfil no Ginga</strong> será criado na primeira sincronização.
          </p>
          <form onSubmit={(e) => void handleConfirmEmailSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="confirmCode" className="block text-sm font-medium text-foreground mb-1">
                Código de verificação
              </label>
              <input
                id="confirmCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary tracking-widest text-center text-lg"
                placeholder="000000"
              />
            </div>
            {error && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {submitting ? "Confirmando…" : "Confirmar e entrar"}
            </button>
            <button
              type="button"
              disabled={resendCooldown > 0 || submitting}
              onClick={() => void handleResendConfirmationCode()}
              className="w-full border border-primary-200 text-primary font-medium py-3 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Reenviar código (${resendCooldown}s)` : "Reenviar código"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setPendingSignupPassword("");
                setPhase("signup");
                setError(null);
              }}
              className="w-full text-foreground/70 text-sm hover:text-primary"
            >
              Voltar ao cadastro
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-foreground/70">
            <Link to="/" className="text-secondary font-medium hover:underline">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (phase === "signup") {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-surface rounded-2xl shadow-[var(--shadow-soft)] border border-primary-100 p-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Criar conta</h1>
          <p className="text-foreground/70 text-sm mb-6">
            Cadastre-se com e-mail e senha.
          </p>
          <form onSubmit={(e) => void handleSignupSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="givenName" className="block text-sm font-medium text-foreground mb-1">
                  Nome
                </label>
                <input
                  id="givenName"
                  type="text"
                  autoComplete="given-name"
                  required
                  minLength={2}
                  value={givenName}
                  onChange={(e) => setGivenName(e.target.value)}
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="familyName" className="block text-sm font-medium text-foreground mb-1">
                  Sobrenome
                </label>
                <input
                  id="familyName"
                  type="text"
                  autoComplete="family-name"
                  required
                  minLength={2}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1">
                E-mail
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1">
                Senha
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-foreground/60 mt-1">Mínimo 8 caracteres.</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {submitting ? "Criando conta…" : "Criar conta"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => goBackToLoginFromSignup()}
              className="text-secondary font-medium hover:underline"
            >
              Já tenho conta — entrar
            </button>
          </p>
          <p className="mt-4 text-center text-sm text-foreground/70">
            <Link to="/" className="text-secondary font-medium hover:underline">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-surface rounded-2xl shadow-[var(--shadow-soft)] border border-primary-100 p-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Entrar</h1>
        <p className="text-foreground/70 text-sm mb-6">
          Use o e-mail e a senha do seu usuário no{" "}
          <strong>Amazon Cognito</strong> (pool Ginga). Se você recebeu uma senha temporária por
          e-mail, use-a aqui; na sequência pediremos uma senha nova.
        </p>
        <form onSubmit={(e) => void handleCredentialsSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-primary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && (
            <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setPhase("signup");
            }}
            className="text-secondary font-medium hover:underline"
          >
            Criar conta
          </button>
        </p>
        <p className="mt-4 text-center text-sm text-foreground/70">
          <Link to="/" className="text-secondary font-medium hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
