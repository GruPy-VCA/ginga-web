import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Home() {
  const { user } = useAuth();

  return (
    <>
      <section className="bg-gradient-to-br from-primary to-primary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Bem-vindo ao <span className="text-highlight">Ginga</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
            A plataforma que conecta profissionais de tecnologia às melhores
            oportunidades do mercado.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/jobs"
              className="bg-highlight text-primary font-bold px-8 py-4 rounded-xl hover:bg-highlight-400 transition-colors shadow-[var(--shadow-soft)]"
            >
              Ver Vagas Abertas
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="bg-surface text-primary font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-[var(--shadow-soft)]"
              >
                Meu painel
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-surface text-primary font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-[var(--shadow-soft)]"
              >
                Criar Meu Portfólio
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-20" id="vagas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nossos Módulos
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Ferramentas para impulsionar sua carreira tech.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              id="portfolio"
              className="bg-surface rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-primary-100 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold text-foreground mb-4">
                GingaVagas
              </h3>
              <p className="text-foreground/70 mb-6">
                Vagas com transparência salarial e requisitos por tags. Em
                breve: listagem integrada à API neste app.
              </p>
              <span className="inline-block bg-highlight text-primary text-xs font-bold px-3 py-1 rounded-full">
                Em evolução
              </span>
            </div>
            <div className="bg-surface rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-primary-100 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                GingaPort
              </h3>
              <p className="text-foreground/70 mb-6">
                Portfólio técnico e perfil profissional. Faça login com Cognito
                para sincronizar com a API.
              </p>
              {!user && (
                <Link
                  to="/login"
                  className="text-secondary font-semibold hover:underline"
                >
                  Entrar →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
