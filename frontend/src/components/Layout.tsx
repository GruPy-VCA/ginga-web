import { useEffect, useId, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function navItemClass(isActive: boolean) {
  return `rounded-lg px-2.5 py-2 text-sm sm:text-base font-medium transition-colors min-h-[44px] sm:min-h-0 inline-flex items-center ${
    isActive ? "bg-primary/12 text-primary" : "text-foreground hover:text-primary hover:bg-primary/5"
  }`;
}

export function Layout() {
  const location = useLocation();
  const menuId = useId();
  const { user, loading, me, meLoading, meError, isProfileComplete, refreshMe, signOutUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const waitingProfile = Boolean(user && meLoading);
  const showProfileGateError = Boolean(user && !meLoading && meError && !me);
  const mustCompleteProfile =
    Boolean(user && !meLoading && me && !isProfileComplete) &&
    location.pathname !== "/profile" &&
    location.pathname !== "/login";

  if (loading || waitingProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-surface shadow-[var(--shadow-soft)] border-b border-primary-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              Ginga
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div
              className="inline-block size-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"
              aria-hidden
            />
            <p className="text-foreground/80 font-medium">Carregando sua conta…</p>
            <p className="text-sm text-foreground/60 mt-2">Sincronizando perfil com o servidor.</p>
          </div>
        </main>
      </div>
    );
  }

  if (showProfileGateError) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-surface shadow-[var(--shadow-soft)] border-b border-primary-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              Ginga
            </Link>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="text-foreground hover:text-primary font-medium"
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center rounded-2xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-lg font-semibold text-red-900 mb-2">Não foi possível carregar seu perfil</h1>
            <p className="text-sm text-red-800 mb-6">{meError}</p>
            <button
              type="button"
              onClick={() => void refreshMe()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 min-h-[44px]"
            >
              Tentar novamente
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (mustCompleteProfile) {
    return (
      <Navigate
        to="/profile"
        replace
        state={{ from: location.pathname === "/" ? "/dashboard" : location.pathname }}
      />
    );
  }

  const showRecruiterNav = Boolean(user && isProfileComplete);
  const isRecruiterRoute = location.pathname.startsWith("/recruiter");
  const portfolioActive = location.pathname === "/" && location.hash === "#portfolio";

  return (
    <div className="min-h-screen flex flex-col">
      <nav
        className="bg-surface shadow-[var(--shadow-soft)] sticky top-0 z-50 border-b border-primary-100"
        aria-label="Principal"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between h-16 items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-primary shrink-0">
              Ginga
            </Link>

            {/* Desktop */}
            <div className="hidden lg:flex items-center gap-1 flex-wrap justify-end max-w-[calc(100%-8rem)]">
              {!isRecruiterRoute ? (
                <>
                  <NavLink to="/jobs" className={({ isActive }) => navItemClass(isActive)}>
                    Vagas
                  </NavLink>
                  <NavLink to="/companies" className={({ isActive }) => navItemClass(isActive)}>
                    Empresas
                  </NavLink>
                  <Link to="/#portfolio" className={navItemClass(portfolioActive)}>
                    Portfólios
                  </Link>
                </>
              ) : null}

              {user ? (
                <>
                  {!isRecruiterRoute ? (
                    <span className="w-px h-6 bg-primary/15 mx-1 shrink-0" aria-hidden />
                  ) : null}
                  {user && !isProfileComplete ? (
                    <NavLink to="/profile" className={({ isActive }) => navItemClass(isActive)}>
                      Completar perfil
                    </NavLink>
                  ) : (
                    <>
                      {!isRecruiterRoute ? (
                        <>
                          <NavLink to="/profile" className={({ isActive }) => navItemClass(isActive)}>
                            Perfil
                          </NavLink>
                          {showRecruiterNav ? (
                            <NavLink
                              to="/applications"
                              className={({ isActive }) => navItemClass(isActive)}
                            >
                              Candidaturas
                            </NavLink>
                          ) : null}
                          <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                              isActive
                                ? "rounded-lg px-3 py-2 text-sm sm:text-base font-semibold bg-primary text-white shadow-sm min-h-[44px] inline-flex items-center"
                                : `${navItemClass(false)} border border-primary/20`
                            }
                          >
                            Dashboard
                          </NavLink>
                        </>
                      ) : null}
                      {showRecruiterNav && isRecruiterRoute ? (
                        <>
                          <NavLink to="/recruiter" end className={({ isActive }) => navItemClass(isActive)}>
                            Painel
                          </NavLink>
                          <NavLink
                            to="/recruiter/companies"
                            className={({ isActive }) => navItemClass(isActive)}
                          >
                            Empresas
                          </NavLink>
                          <NavLink
                            to="/recruiter/jobs"
                            className={({ isActive }) => navItemClass(isActive)}
                          >
                            Vagas
                          </NavLink>
                          <NavLink
                            to="/recruiter/applications"
                            className={({ isActive }) => navItemClass(isActive)}
                          >
                            Candidaturas
                          </NavLink>
                          <NavLink
                            to="/dashboard"
                            className={({ isActive }) => navItemClass(isActive)}
                          >
                            Área do candidato
                          </NavLink>
                        </>
                      ) : null}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => void signOutUser()}
                    className="ml-1 rounded-lg px-2.5 py-2 text-sm sm:text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 min-h-[44px] inline-flex items-center"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive
                      ? "rounded-lg px-4 py-2 text-sm sm:text-base font-semibold bg-primary text-white min-h-[44px] inline-flex items-center"
                      : "rounded-lg px-4 py-2 text-sm sm:text-base font-semibold bg-primary text-white hover:bg-primary-600 min-h-[44px] inline-flex items-center"
                  }
                >
                  Entrar
                </NavLink>
              )}
            </div>

            {/* Mobile: menu + ação principal */}
            <div className="flex lg:hidden items-center gap-2">
              {user && isProfileComplete ? (
                <NavLink
                  to={isRecruiterRoute ? "/recruiter" : "/dashboard"}
                  className={({ isActive }) =>
                    isActive
                      ? "rounded-lg px-3 py-2 text-sm font-semibold bg-primary text-white"
                      : "rounded-lg px-3 py-2 text-sm font-medium text-foreground border border-primary/20"
                  }
                >
                  {isRecruiterRoute ? "Painel" : "Dashboard"}
                </NavLink>
              ) : null}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-background p-2.5 text-foreground hover:bg-primary/5 min-h-[44px] min-w-[44px]"
                aria-expanded={mobileOpen}
                aria-controls={menuId}
                aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile painel */}
          {mobileOpen ? (
            <div
              id={menuId}
              className="lg:hidden border-t border-primary/10 bg-surface py-3 px-2 pb-4 shadow-[var(--shadow-soft)] max-h-[min(70vh,calc(100dvh-4rem))] overflow-y-auto"
            >
              <div className="flex flex-col gap-0.5">
                {!isRecruiterRoute ? (
                  <>
                    <NavLink to="/jobs" className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}>
                      Vagas
                    </NavLink>
                    <NavLink
                      to="/companies"
                      className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                    >
                      Empresas
                    </NavLink>
                    <Link to="/#portfolio" className={`${navItemClass(portfolioActive)} w-full justify-start`}>
                      Portfólios
                    </Link>
                  </>
                ) : null}

                {user ? (
                  <>
                    {!isRecruiterRoute ? (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45 px-3 pt-3 pb-1">
                        Sua conta
                      </p>
                    ) : null}
                    {user && !isProfileComplete ? (
                      <NavLink
                        to="/profile"
                        className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                      >
                        Completar perfil
                      </NavLink>
                    ) : (
                      <>
                        {!isRecruiterRoute ? (
                          <>
                            <NavLink
                              to="/profile"
                              className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                            >
                              Perfil
                            </NavLink>
                            {showRecruiterNav ? (
                              <NavLink
                                to="/applications"
                                className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                              >
                                Candidaturas
                              </NavLink>
                            ) : null}
                            <NavLink
                              to="/dashboard"
                              className={({ isActive }) =>
                                isActive
                                  ? "rounded-lg px-3 py-2.5 text-sm font-semibold bg-primary text-white w-full justify-start min-h-[44px] inline-flex items-center"
                                  : `${navItemClass(false)} w-full justify-start`
                              }
                            >
                              Dashboard
                            </NavLink>
                          </>
                        ) : null}
                        {showRecruiterNav && isRecruiterRoute ? (
                          <>
                            <NavLink
                              to="/recruiter"
                              end
                              className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                            >
                              Painel
                            </NavLink>
                            <NavLink
                              to="/recruiter/companies"
                              className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                            >
                              Empresas
                            </NavLink>
                            <NavLink
                              to="/recruiter/jobs"
                              className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                            >
                              Vagas
                            </NavLink>
                            <NavLink
                              to="/recruiter/applications"
                              className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                            >
                              Candidaturas
                            </NavLink>
                            <NavLink
                              to="/dashboard"
                              className={({ isActive }) => `${navItemClass(isActive)} w-full justify-start`}
                            >
                              Área do candidato
                            </NavLink>
                          </>
                        ) : null}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => void signOutUser()}
                      className="mt-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-primary/5 min-h-[44px] w-full"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <NavLink
                    to="/login"
                    className="mt-2 rounded-lg px-3 py-2.5 text-center text-sm font-semibold bg-primary text-white min-h-[44px] inline-flex items-center justify-center"
                  >
                    Entrar
                  </NavLink>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </nav>
      <main className="flex-1" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="bg-primary text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm opacity-90">
          Ginga — vagas e portfólios tech
        </div>
      </footer>
    </div>
  );
}
