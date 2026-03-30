import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  autoSignIn,
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  signIn,
  signOut,
  signUp,
  type ConfirmSignInOutput,
  type SignInOutput,
  type SignUpOutput,
} from "aws-amplify/auth";
import { isAmplifyConfigured } from "../config/amplify";
import { apiFetch } from "../lib/api";
import type { Me } from "../types/me";

type AuthUser = {
  userId: string;
  username: string;
};

type AuthUserAttributes = Record<string, string>;

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  me: Me | null;
  meLoading: boolean;
  meError: string | null;
  isProfileComplete: boolean;
  signInWithEmail: (email: string, password: string) => Promise<SignInOutput>;
  completeNewPasswordSignIn: (
    newPassword: string,
    userAttributes?: AuthUserAttributes,
  ) => Promise<ConfirmSignInOutput>;
  signOutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshMe: () => Promise<void>;
  /** Registro no Cognito (nome vai para given_name/family_name e depois para o token / perfil na API). */
  registerWithEmail: (
    email: string,
    password: string,
    givenName: string,
    familyName: string,
  ) => Promise<SignUpOutput>;
  /** Confirma e-mail e entra (auto sign-in ou signIn com senha). Dispara GET /me e cria perfil se for o primeiro acesso. */
  completeSignUpWithCode: (email: string, confirmationCode: string, password: string) => Promise<void>;
  /** Quando o pool não exige código (ex.: só dev), tenta auto sign-in ou signIn. */
  tryCompleteSignUpWithoutConfirmation: (
    signUpOutput: SignUpOutput,
    email: string,
    password: string,
  ) => Promise<boolean>;
  resendSignUpEmailCode: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [meError, setMeError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!isAmplifyConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await getCurrentUser();
      setUser({ userId: u.userId, username: u.username });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!isAmplifyConfigured()) {
      setMe(null);
      setMeError(null);
      return;
    }
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        setMe(null);
        setMeError(null);
        return;
      }
    } catch {
      setMe(null);
      setMeError(null);
      return;
    }

    setMeLoading(true);
    setMeError(null);
    try {
      const data = await apiFetch<Me>("/api/v1/me");
      setMe(data);
    } catch (e) {
      setMe(null);
      setMeError(e instanceof Error ? e.message : "Não foi possível carregar seu perfil.");
    } finally {
      setMeLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) {
      setMe(null);
      setMeError(null);
      setMeLoading(false);
      return;
    }
    void refreshMe();
  }, [user, refreshMe]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const out = await signIn({ username: email.trim(), password });
      if (out.isSignedIn) {
        await fetchAuthSession({ forceRefresh: true });
        await refreshUser();
      }
      return out;
    },
    [refreshUser],
  );

  const completeNewPasswordSignIn = useCallback(
    async (newPassword: string, userAttributes?: AuthUserAttributes) => {
      const out = await confirmSignIn({
        challengeResponse: newPassword,
        options:
          userAttributes && Object.keys(userAttributes).length > 0
            ? { userAttributes }
            : undefined,
      });
      if (out.isSignedIn) {
        await fetchAuthSession({ forceRefresh: true });
        await refreshUser();
      }
      return out;
    },
    [refreshUser],
  );

  const signOutUser = useCallback(async () => {
    await signOut({ global: true });
    setUser(null);
    setMe(null);
    setMeError(null);
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, givenName: string, familyName: string) => {
    return signUp({
      username: email.trim(),
      password,
      options: {
        userAttributes: {
          email: email.trim(),
          given_name: givenName.trim(),
          family_name: familyName.trim(),
        },
        autoSignIn: true,
      },
    });
  }, []);

  const tryCompleteSignUpWithoutConfirmation = useCallback(
    async (signUpOutput: SignUpOutput, email: string, password: string): Promise<boolean> => {
      if (signUpOutput.nextStep.signUpStep === "COMPLETE_AUTO_SIGN_IN") {
        try {
          const si = await autoSignIn();
          if (si.isSignedIn) {
            await fetchAuthSession({ forceRefresh: true });
            await refreshUser();
            return true;
          }
        } catch {
          /* continua para signIn manual */
        }
      }
      if (signUpOutput.isSignUpComplete && signUpOutput.nextStep.signUpStep === "DONE") {
        const si = await signIn({ username: email.trim(), password });
        if (si.isSignedIn) {
          await fetchAuthSession({ forceRefresh: true });
          await refreshUser();
          return true;
        }
      }
      return false;
    },
    [refreshUser],
  );

  const completeSignUpWithCode = useCallback(
    async (email: string, confirmationCode: string, password: string) => {
      const out = await confirmSignUp({
        username: email.trim(),
        confirmationCode: confirmationCode.trim(),
      });
      if (out.nextStep.signUpStep === "COMPLETE_AUTO_SIGN_IN") {
        try {
          const si = await autoSignIn();
          if (si.isSignedIn) {
            await fetchAuthSession({ forceRefresh: true });
            await refreshUser();
            return;
          }
        } catch {
          /* signIn abaixo */
        }
      }
      const si = await signIn({ username: email.trim(), password });
      if (si.isSignedIn) {
        await fetchAuthSession({ forceRefresh: true });
        await refreshUser();
      }
    },
    [refreshUser],
  );

  const resendSignUpEmailCode = useCallback(async (email: string) => {
    await resendSignUpCode({ username: email.trim() });
  }, []);

  const isProfileComplete = me?.is_profile_complete === true;

  const value = useMemo(
    () => ({
      user,
      loading,
      me,
      meLoading,
      meError,
      isProfileComplete,
      signInWithEmail,
      completeNewPasswordSignIn,
      signOutUser,
      refreshUser,
      refreshMe,
      registerWithEmail,
      completeSignUpWithCode,
      tryCompleteSignUpWithoutConfirmation,
      resendSignUpEmailCode,
    }),
    [
      user,
      loading,
      me,
      meLoading,
      meError,
      isProfileComplete,
      signInWithEmail,
      completeNewPasswordSignIn,
      signOutUser,
      refreshUser,
      refreshMe,
      registerWithEmail,
      completeSignUpWithCode,
      tryCompleteSignUpWithoutConfirmation,
      resendSignUpEmailCode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth precisa ficar no mesmo módulo que AuthProvider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
