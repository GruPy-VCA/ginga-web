import { NavLink, Outlet } from "react-router-dom";

const subLink =
  "px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap";
const subActive = "bg-primary text-white shadow-sm";
const subIdle = "text-foreground/80 hover:bg-primary/10 hover:text-primary";

export function RecruiterLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-wide mb-1">Recrutador</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Área do recrutador</h1>
        <p className="text-gray-600 mt-1">Gerencie empresas, vagas e candidaturas em um só lugar.</p>
      </div>

      <nav
        className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-gray-100"
        aria-label="Área do recrutador"
      >
        <NavLink to="/recruiter" end className={({ isActive }) => `${subLink} ${isActive ? subActive : subIdle}`}>
          Painel
        </NavLink>
        <NavLink
          to="/recruiter/companies"
          className={({ isActive }) => `${subLink} ${isActive ? subActive : subIdle}`}
        >
          Empresas
        </NavLink>
        <NavLink
          to="/recruiter/jobs"
          className={({ isActive }) => `${subLink} ${isActive ? subActive : subIdle}`}
        >
          Vagas
        </NavLink>
        <NavLink
          to="/recruiter/applications"
          className={({ isActive }) => `${subLink} ${isActive ? subActive : subIdle}`}
        >
          Candidaturas
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
