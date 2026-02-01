"""
Comando de gerenciamento para popular o banco de dados com dados de teste.

Uso:
    python manage.py seed_test_data

Este comando é idempotente - pode ser executado múltiplas vezes sem criar duplicatas.
"""

import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from apps.accounts.models import User, ProfessionalExperience, Education
from apps.companies.models import Company
from apps.jobs.models import Job, Application
from taggit.models import Tag


fake = Faker('pt_BR')

# ============================================================================
# DADOS FIXOS - RECRUTADORES
# ============================================================================

RECRUTADORES = [
    {
        "username": "recrutador_master",
        "email": "master@techcorp.com.br",
        "password": "ginga@2024",
        "first_name": "Carlos",
        "last_name": "Mendes",
        "empresas": [
            {
                "name": "TechCorp Brasil",
                "cnpj": "12.345.678/0001-01",
                "website": "https://techcorp.com.br",
                "description": "Líder em soluções de tecnologia corporativa no Brasil.",
            },
            {
                "name": "DataFlow Solutions",
                "cnpj": "12.345.678/0001-02",
                "website": "https://dataflow.io",
                "description": "Especialistas em Big Data e Analytics.",
            },
        ],
    },
    {
        "username": "recrutador_ana",
        "email": "ana.rh@inovabr.com.br",
        "password": "ginga@2024",
        "first_name": "Ana",
        "last_name": "Silva",
        "empresas": [
            {
                "name": "InovaBR Tech",
                "cnpj": "23.456.789/0001-03",
                "website": "https://inovabr.tech",
                "description": "Startup de inovação em fintech.",
            },
        ],
    },
    {
        "username": "recrutador_pedro",
        "email": "pedro@cloudnine.dev",
        "password": "ginga@2024",
        "first_name": "Pedro",
        "last_name": "Oliveira",
        "empresas": [
            {
                "name": "CloudNine Development",
                "cnpj": "34.567.890/0001-04",
                "website": "https://cloudnine.dev",
                "description": "Consultoria especializada em cloud computing.",
            },
            {
                "name": "DevOps Masters",
                "cnpj": "34.567.890/0001-05",
                "website": "https://devopsmasters.io",
                "description": "Automação e infraestrutura como código.",
            },
            {
                "name": "API Factory",
                "cnpj": "34.567.890/0001-06",
                "website": "https://apifactory.com.br",
                "description": "Desenvolvimento de APIs RESTful e GraphQL.",
            },
        ],
    },
    {
        "username": "recrutador_maria",
        "email": "maria@fintechplus.com.br",
        "password": "ginga@2024",
        "first_name": "Maria",
        "last_name": "Santos",
        "empresas": [
            {
                "name": "Fintech Plus",
                "cnpj": "45.678.901/0001-07",
                "website": "https://fintechplus.com.br",
                "description": "Soluções financeiras digitais.",
            },
            {
                "name": "PaySimple Brasil",
                "cnpj": "45.678.901/0001-08",
                "website": "https://paysimple.com.br",
                "description": "Plataforma de pagamentos simplificados.",
            },
        ],
    },
    {
        "username": "recrutador_lucas",
        "email": "lucas@gamedev.studio",
        "password": "ginga@2024",
        "first_name": "Lucas",
        "last_name": "Ferreira",
        "empresas": [
            {
                "name": "GameDev Studio",
                "cnpj": "56.789.012/0001-09",
                "website": "https://gamedev.studio",
                "description": "Desenvolvimento de jogos mobile e PC.",
            },
        ],
    },
]

# ============================================================================
# DADOS FIXOS - CANDIDATOS EXCELENTES (7)
# ============================================================================

CANDIDATOS_EXCELENTES = [
    {
        "username": "flavio_senior",
        "email": "flavio.expert@email.com",
        "password": "ginga@2024",
        "first_name": "Flávio",
        "last_name": "Rodrigues",
        "bio": "Desenvolvedor Sênior com mais de 10 anos de experiência em arquiteturas escaláveis. Apaixonado por Clean Code, TDD e metodologias ágeis. Contribuidor ativo de projetos open source.",
        "city": "São Paulo, SP",
        "skills": "Python, Django, PostgreSQL, Docker, AWS, Kubernetes, FastAPI",
        "github_url": "https://github.com/flaviorodrigues",
        "linkedin_url": "https://linkedin.com/in/flaviorodrigues",
        "experiencias": [
            {"company": "Global Tech", "role": "Senior Software Engineer", "description": "Liderança técnica de equipe de 8 desenvolvedores. Arquitetura de microsserviços processando 1M+ requests/dia."},
            {"company": "StartupXYZ", "role": "Tech Lead", "description": "Definição de stack tecnológico e mentoria de desenvolvedores júnior."},
            {"company": "MegaCorp Brasil", "role": "Desenvolvedor Pleno", "description": "Desenvolvimento de APIs RESTful e integrações com sistemas legados."},
        ],
        "educacao": [
            {"institution": "USP", "course": "Ciência da Computação", "status": "completed"},
            {"institution": "MIT (Online)", "course": "Machine Learning", "status": "completed"},
        ],
    },
    {
        "username": "carolina_fullstack",
        "email": "carolina.dev@email.com",
        "password": "ginga@2024",
        "first_name": "Carolina",
        "last_name": "Almeida",
        "bio": "Full Stack Developer especializada em React e Node.js. Certificada AWS Solutions Architect. Mentora de mulheres na tecnologia.",
        "city": "Rio de Janeiro, RJ",
        "skills": "JavaScript, TypeScript, React, Node.js, MongoDB, AWS, GraphQL",
        "github_url": "https://github.com/carolinaalmeida",
        "linkedin_url": "https://linkedin.com/in/carolinaalmeida",
        "experiencias": [
            {"company": "Nubank", "role": "Full Stack Developer", "description": "Desenvolvimento de features para o app principal com milhões de usuários."},
            {"company": "iFood", "role": "Frontend Developer", "description": "Otimização de performance e acessibilidade do marketplace."},
        ],
        "educacao": [
            {"institution": "PUC-Rio", "course": "Engenharia de Software", "status": "completed"},
            {"institution": "AWS", "course": "Solutions Architect Professional", "status": "completed"},
        ],
    },
    {
        "username": "rafael_devops",
        "email": "rafael.ops@email.com",
        "password": "ginga@2024",
        "first_name": "Rafael",
        "last_name": "Costa",
        "bio": "DevOps Engineer com foco em automação e observabilidade. Especialista em Kubernetes e Terraform. Speaker em conferências de tecnologia.",
        "city": "Belo Horizonte, MG",
        "skills": "Docker, Kubernetes, Terraform, AWS, Azure, Jenkins, Prometheus, Grafana",
        "github_url": "https://github.com/rafaelcosta",
        "linkedin_url": "https://linkedin.com/in/rafaelcosta",
        "experiencias": [
            {"company": "Banco Inter", "role": "Senior DevOps Engineer", "description": "Implementação de pipelines CI/CD e infraestrutura como código."},
            {"company": "Locaweb", "role": "SRE", "description": "Garantia de disponibilidade 99.99% para serviços críticos."},
        ],
        "educacao": [
            {"institution": "UFMG", "course": "Sistemas de Informação", "status": "completed"},
            {"institution": "Linux Foundation", "course": "Certified Kubernetes Administrator", "status": "completed"},
        ],
    },
    {
        "username": "juliana_data",
        "email": "juliana.data@email.com",
        "password": "ginga@2024",
        "first_name": "Juliana",
        "last_name": "Martins",
        "bio": "Data Scientist com PhD em Estatística. Experiência em ML/AI aplicado a problemas de negócio. Publicações em conferências internacionais.",
        "city": "Campinas, SP",
        "skills": "Python, Pandas, Scikit-learn, TensorFlow, PyTorch, SQL, Spark",
        "github_url": "https://github.com/julianamartins",
        "linkedin_url": "https://linkedin.com/in/julianamartins",
        "experiencias": [
            {"company": "Itaú Unibanco", "role": "Senior Data Scientist", "description": "Modelos de credit scoring e detecção de fraude."},
            {"company": "Magazine Luiza", "role": "Data Scientist", "description": "Sistema de recomendação de produtos com aumento de 15% nas vendas."},
        ],
        "educacao": [
            {"institution": "Unicamp", "course": "Doutorado em Estatística", "status": "completed"},
            {"institution": "Stanford Online", "course": "Deep Learning Specialization", "status": "completed"},
        ],
    },
    {
        "username": "bruno_mobile",
        "email": "bruno.mobile@email.com",
        "password": "ginga@2024",
        "first_name": "Bruno",
        "last_name": "Nascimento",
        "bio": "Mobile Developer com expertise em Flutter e React Native. Apps publicados com milhões de downloads. Foco em UX e performance.",
        "city": "Curitiba, PR",
        "skills": "Flutter, Dart, React Native, TypeScript, Firebase, iOS, Android",
        "github_url": "https://github.com/brunonascimento",
        "linkedin_url": "https://linkedin.com/in/brunonascimento",
        "experiencias": [
            {"company": "99", "role": "Senior Mobile Developer", "description": "Desenvolvimento do app de motoristas com 500k+ usuários ativos."},
            {"company": "PicPay", "role": "Mobile Developer", "description": "Features de pagamento e wallet digital."},
        ],
        "educacao": [
            {"institution": "UTFPR", "course": "Análise e Desenvolvimento de Sistemas", "status": "completed"},
            {"institution": "Google", "course": "Flutter Development Bootcamp", "status": "completed"},
        ],
    },
    {
        "username": "amanda_security",
        "email": "amanda.sec@email.com",
        "password": "ginga@2024",
        "first_name": "Amanda",
        "last_name": "Lima",
        "bio": "Security Engineer com certificações CISSP e CEH. Especialista em AppSec e DevSecOps. Bug bounty hunter nas horas vagas.",
        "city": "Brasília, DF",
        "skills": "Python, Linux, Docker, AWS, OAuth 2.0, JWT, OWASP, Burp Suite",
        "github_url": "https://github.com/amandalima",
        "linkedin_url": "https://linkedin.com/in/amandalima",
        "experiencias": [
            {"company": "Banco do Brasil", "role": "Senior Security Engineer", "description": "Implementação de políticas de segurança e resposta a incidentes."},
            {"company": "Serpro", "role": "Security Analyst", "description": "Análise de vulnerabilidades em sistemas governamentais."},
        ],
        "educacao": [
            {"institution": "UnB", "course": "Ciência da Computação", "status": "completed"},
            {"institution": "ISC2", "course": "CISSP Certification", "status": "completed"},
        ],
    },
    {
        "username": "thiago_backend",
        "email": "thiago.back@email.com",
        "password": "ginga@2024",
        "first_name": "Thiago",
        "last_name": "Pereira",
        "bio": "Backend Developer com foco em sistemas distribuídos e alta disponibilidade. Experiência em e-commerce de grande escala.",
        "city": "Porto Alegre, RS",
        "skills": "Java, Spring Boot, Kotlin, PostgreSQL, Redis, Kafka, Microservices",
        "github_url": "https://github.com/thiagopereira",
        "linkedin_url": "https://linkedin.com/in/thiagopereira",
        "experiencias": [
            {"company": "Mercado Livre", "role": "Senior Backend Developer", "description": "Desenvolvimento de serviços de checkout processando R$1B+ por mês."},
            {"company": "Dell", "role": "Software Engineer", "description": "Sistemas de gestão de supply chain."},
        ],
        "educacao": [
            {"institution": "UFRGS", "course": "Engenharia de Computação", "status": "completed"},
            {"institution": "Oracle", "course": "Java SE 11 Developer", "status": "completed"},
        ],
    },
]

# ============================================================================
# DADOS FIXOS - CANDIDATOS MEDIANOS (8)
# ============================================================================

CANDIDATOS_MEDIANOS = [
    {
        "username": "lucas_junior",
        "email": "lucas.junior@email.com",
        "password": "ginga@2024",
        "first_name": "Lucas",
        "last_name": "Souza",
        "bio": "Desenvolvedor júnior buscando primeira oportunidade na área.",
        "city": "São Paulo, SP",
        "skills": "Python, Django, Git",
    },
    {
        "username": "mariana_trainee",
        "email": "mariana.trainee@email.com",
        "password": "ginga@2024",
        "first_name": "Mariana",
        "last_name": "Ferreira",
        "bio": "Recém-formada em Sistemas de Informação.",
        "city": "Rio de Janeiro, RJ",
        "skills": "JavaScript, React, HTML",
    },
    {
        "username": "gabriel_pleno",
        "email": "gabriel.pleno@email.com",
        "password": "ginga@2024",
        "first_name": "Gabriel",
        "last_name": "Santos",
        "bio": "Desenvolvedor pleno com 2 anos de experiência.",
        "city": "Belo Horizonte, MG",
        "skills": "Java, Spring Boot, MySQL",
    },
    {
        "username": "fernanda_dev",
        "email": "fernanda.dev@email.com",
        "password": "ginga@2024",
        "first_name": "Fernanda",
        "last_name": "Oliveira",
        "bio": "Frontend developer em transição de carreira.",
        "city": "Curitiba, PR",
        "skills": "Vue.js, CSS, Tailwind CSS",
    },
    {
        "username": "ricardo_backend",
        "email": "ricardo.back@email.com",
        "password": "ginga@2024",
        "first_name": "Ricardo",
        "last_name": "Lima",
        "bio": "Backend developer focado em APIs.",
        "city": "Salvador, BA",
        "skills": "Node.js, Express, MongoDB",
    },
    {
        "username": "patricia_qa",
        "email": "patricia.qa@email.com",
        "password": "ginga@2024",
        "first_name": "Patrícia",
        "last_name": "Costa",
        "bio": "Analista de QA buscando transição para desenvolvimento.",
        "city": "Fortaleza, CE",
        "skills": "Selenium, Cypress, Python",
    },
    {
        "username": "diego_mobile",
        "email": "diego.mob@email.com",
        "password": "ginga@2024",
        "first_name": "Diego",
        "last_name": "Alves",
        "bio": "Desenvolvedor mobile iniciante.",
        "city": "Recife, PE",
        "skills": "Flutter, Dart, Firebase",
    },
    {
        "username": "camila_frontend",
        "email": "camila.front@email.com",
        "password": "ginga@2024",
        "first_name": "Camila",
        "last_name": "Rocha",
        "bio": "Frontend developer com interesse em UX.",
        "city": "Goiânia, GO",
        "skills": "React, TypeScript, Figma",
    },
]

# ============================================================================
# DADOS FIXOS - CANDIDATOS INCOMPLETOS (5)
# ============================================================================

CANDIDATOS_INCOMPLETOS = [
    {"username": "user_incompleto_1", "email": "incomplete1@email.com", "password": "ginga@2024", "first_name": "João", "last_name": "Silva"},
    {"username": "user_incompleto_2", "email": "incomplete2@email.com", "password": "ginga@2024", "first_name": "Maria", "last_name": "Santos"},
    {"username": "user_incompleto_3", "email": "incomplete3@email.com", "password": "ginga@2024", "first_name": "Pedro", "last_name": "Oliveira"},
    {"username": "user_incompleto_4", "email": "incomplete4@email.com", "password": "ginga@2024", "first_name": "Ana", "last_name": "Costa"},
    {"username": "user_incompleto_5", "email": "incomplete5@email.com", "password": "ginga@2024", "first_name": "Carlos", "last_name": "Lima"},
]

# ============================================================================
# TEMPLATES DE VAGAS
# ============================================================================

JOB_TEMPLATES = [
    {
        "title": "Desenvolvedor Backend Sênior",
        "description": "Buscamos um desenvolvedor backend sênior para liderar o desenvolvimento de APIs escaláveis e microsserviços. Você será responsável por arquitetar soluções robustas, mentorar desenvolvedores júnior e garantir a qualidade do código através de code reviews e práticas de TDD.",
        "requirements": "- 5+ anos de experiência com desenvolvimento backend\n- Experiência com arquitetura de microsserviços\n- Conhecimento em bancos de dados SQL e NoSQL\n- Experiência com containerização (Docker/Kubernetes)\n- Inglês técnico",
        "salary_range": "R$ 15.000 - R$ 22.000",
        "tags": ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
    },
    {
        "title": "Full Stack Developer Pleno",
        "description": "Procuramos desenvolvedor full stack para atuar no desenvolvimento de novas features e manutenção de nossa plataforma. Trabalhará em um ambiente ágil com entregas contínuas.",
        "requirements": "- 3+ anos de experiência com desenvolvimento web\n- Conhecimento em React ou Vue.js\n- Experiência com Node.js ou Python\n- Familiaridade com Git e CI/CD",
        "salary_range": "R$ 8.000 - R$ 12.000",
        "tags": ["JavaScript", "React", "Node.js", "TypeScript", "MongoDB"],
    },
    {
        "title": "DevOps Engineer",
        "description": "Responsável por implementar e manter nossa infraestrutura na nuvem, pipelines de CI/CD e garantir a disponibilidade dos serviços em produção.",
        "requirements": "- Experiência com AWS ou GCP\n- Conhecimento em Terraform e Ansible\n- Experiência com Kubernetes\n- Familiaridade com monitoramento (Prometheus, Grafana)",
        "salary_range": "R$ 12.000 - R$ 18.000",
        "tags": ["Docker", "Kubernetes", "AWS", "Terraform", "Linux"],
    },
    {
        "title": "Data Scientist",
        "description": "Buscamos cientista de dados para desenvolver modelos de machine learning e gerar insights a partir de grandes volumes de dados.",
        "requirements": "- Mestrado ou Doutorado em área quantitativa\n- Experiência com Python e bibliotecas de ML\n- Conhecimento em estatística e modelagem\n- Experiência com SQL",
        "salary_range": "R$ 14.000 - R$ 20.000",
        "tags": ["Python", "Pandas", "Scikit-learn", "TensorFlow", "SQL"],
    },
    {
        "title": "Frontend Developer React",
        "description": "Desenvolvedor frontend para criar interfaces modernas e responsivas utilizando React e TypeScript.",
        "requirements": "- 2+ anos com React\n- Conhecimento em TypeScript\n- Experiência com CSS moderno (Tailwind, Styled Components)\n- Familiaridade com testes unitários",
        "salary_range": "R$ 7.000 - R$ 11.000",
        "tags": ["React", "TypeScript", "Tailwind CSS", "JavaScript", "Git"],
    },
    {
        "title": "Mobile Developer Flutter",
        "description": "Desenvolvedor mobile para criar e manter aplicativos multiplataforma utilizando Flutter.",
        "requirements": "- 2+ anos com desenvolvimento mobile\n- Experiência com Flutter e Dart\n- Conhecimento em integração com APIs REST\n- Apps publicados na Play Store ou App Store",
        "salary_range": "R$ 9.000 - R$ 14.000",
        "tags": ["Flutter", "Dart", "Firebase", "Android", "iOS"],
    },
    {
        "title": "Security Engineer",
        "description": "Engenheiro de segurança para implementar práticas de DevSecOps e garantir a segurança de nossas aplicações.",
        "requirements": "- Experiência com segurança de aplicações\n- Conhecimento em OWASP Top 10\n- Familiaridade com ferramentas de pentest\n- Certificações de segurança são um diferencial",
        "salary_range": "R$ 13.000 - R$ 19.000",
        "tags": ["Python", "Linux", "AWS", "Docker", "OAuth 2.0"],
    },
    {
        "title": "Backend Developer Java",
        "description": "Desenvolvedor backend Java para atuar no desenvolvimento de sistemas de alta performance.",
        "requirements": "- 3+ anos com Java e Spring Boot\n- Experiência com microsserviços\n- Conhecimento em bancos de dados relacionais\n- Familiaridade com Kafka ou RabbitMQ",
        "salary_range": "R$ 10.000 - R$ 15.000",
        "tags": ["Java", "Spring Boot", "PostgreSQL", "Microservices", "Docker"],
    },
    {
        "title": "QA Engineer / SDET",
        "description": "Engenheiro de qualidade para desenvolver e manter frameworks de automação de testes.",
        "requirements": "- Experiência com automação de testes\n- Conhecimento em Selenium, Cypress ou Playwright\n- Familiaridade com testes de API\n- Experiência com CI/CD",
        "salary_range": "R$ 8.000 - R$ 12.000",
        "tags": ["Selenium", "Cypress", "Python", "JavaScript", "API REST"],
    },
    {
        "title": "Analista de Infraestrutura (Pausada)",
        "description": "Vaga temporariamente pausada para revisão de headcount. Responsável por manutenção de servidores e redes.",
        "requirements": "- Experiência com Linux\n- Conhecimento em redes TCP/IP\n- Familiaridade com virtualização",
        "salary_range": "R$ 6.000 - R$ 9.000",
        "tags": ["Linux", "Nginx", "Docker", "Terraform"],
    },
]


class Command(BaseCommand):
    """
    Popula o banco de dados com dados de teste.
    
    Este comando é idempotente - pode ser executado múltiplas vezes
    sem criar duplicatas graças ao uso de get_or_create().
    """

    help = "Popula o banco de dados com dados de teste (idempotente)"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.stats = {
            'users_created': 0,
            'users_existing': 0,
            'companies_created': 0,
            'companies_existing': 0,
            'jobs_created': 0,
            'jobs_existing': 0,
            'applications_created': 0,
            'applications_existing': 0,
        }

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("\n🚀 Iniciando seed de dados de teste...\n"))

        # 1. Criar recrutadores e empresas
        self.stdout.write(self.style.NOTICE("📋 Criando recrutadores e empresas..."))
        self.create_recruiters()

        # 2. Criar vagas para cada empresa
        self.stdout.write(self.style.NOTICE("💼 Criando vagas..."))
        self.create_jobs()

        # 3. Criar candidatos excelentes
        self.stdout.write(self.style.NOTICE("⭐ Criando candidatos excelentes..."))
        self.create_excellent_candidates()

        # 4. Criar candidatos medianos
        self.stdout.write(self.style.NOTICE("📝 Criando candidatos medianos..."))
        self.create_medium_candidates()

        # 5. Criar candidatos incompletos
        self.stdout.write(self.style.NOTICE("👤 Criando candidatos incompletos..."))
        self.create_incomplete_candidates()

        # 6. Criar candidaturas
        self.stdout.write(self.style.NOTICE("📨 Criando candidaturas..."))
        self.create_applications()

        # Estatísticas finais
        self.print_stats()

    def create_recruiters(self):
        """Cria os recrutadores e suas empresas."""
        for recruiter_data in RECRUTADORES:
            user, created = User.objects.get_or_create(
                username=recruiter_data["username"],
                defaults={
                    "email": recruiter_data["email"],
                    "first_name": recruiter_data["first_name"],
                    "last_name": recruiter_data["last_name"],
                }
            )
            if created:
                user.set_password(recruiter_data["password"])
                user.save()
                self.stats['users_created'] += 1
                self.stdout.write(f"  ✓ Recrutador criado: {user.username}")
            else:
                self.stats['users_existing'] += 1

            # Criar empresas do recrutador
            for company_data in recruiter_data["empresas"]:
                company, created = Company.objects.get_or_create(
                    cnpj=company_data["cnpj"],
                    defaults={
                        "name": company_data["name"],
                        "website": company_data.get("website", ""),
                        "description": company_data.get("description", ""),
                        "owner": user,
                    }
                )
                if created:
                    self.stats['companies_created'] += 1
                    self.stdout.write(f"    ✓ Empresa criada: {company.name}")
                else:
                    self.stats['companies_existing'] += 1

    def create_jobs(self):
        """Cria 10 vagas para cada empresa (9 ativas + 1 inativa)."""
        companies = Company.objects.all()
        
        for company in companies:
            existing_jobs = company.jobs.count()
            jobs_to_create = 10 - existing_jobs
            
            if jobs_to_create <= 0:
                self.stdout.write(f"  - Empresa {company.name} já possui 10+ vagas")
                continue

            # Escolher templates aleatórios
            templates = random.sample(JOB_TEMPLATES, min(jobs_to_create, len(JOB_TEMPLATES)))
            
            for i, template in enumerate(templates):
                # A última vaga criada será inativa
                is_inactive = (i == jobs_to_create - 1) and not company.jobs.filter(is_active=False).exists()
                
                job, created = Job.objects.get_or_create(
                    company=company,
                    title=template["title"],
                    defaults={
                        "description": template["description"],
                        "requirements": template.get("requirements", ""),
                        "salary_range": template.get("salary_range", ""),
                        "is_active": not is_inactive,
                    }
                )
                
                if created:
                    # Adicionar tags
                    for tag_name in template.get("tags", [])[:7]:
                        tag, _ = Tag.objects.get_or_create(name=tag_name)
                        job.tags.add(tag)
                    
                    self.stats['jobs_created'] += 1
                    status = "🔴 INATIVA" if is_inactive else "🟢"
                    self.stdout.write(f"    {status} Vaga criada: {job.title} @ {company.name}")
                else:
                    self.stats['jobs_existing'] += 1

    def create_excellent_candidates(self):
        """Cria candidatos com perfil excelente."""
        for candidate_data in CANDIDATOS_EXCELENTES:
            user, created = User.objects.get_or_create(
                username=candidate_data["username"],
                defaults={
                    "email": candidate_data["email"],
                    "first_name": candidate_data["first_name"],
                    "last_name": candidate_data["last_name"],
                }
            )
            if created:
                user.set_password(candidate_data["password"])
                user.save()
                self.stats['users_created'] += 1
                self.stdout.write(f"  ✓ Candidato excelente criado: {user.username}")
            else:
                self.stats['users_existing'] += 1

            # Atualizar perfil
            profile = user.profile
            profile.bio = candidate_data.get("bio", "")
            profile.city = candidate_data.get("city", "")
            profile.skills = candidate_data.get("skills", "")
            profile.github_url = candidate_data.get("github_url", "")
            profile.linkedin_url = candidate_data.get("linkedin_url", "")
            profile.save()

            # Criar experiências profissionais
            for exp_data in candidate_data.get("experiencias", []):
                ProfessionalExperience.objects.get_or_create(
                    profile=profile,
                    company=exp_data["company"],
                    role=exp_data["role"],
                    defaults={
                        "description": exp_data.get("description", ""),
                        "start_date": self.random_past_date(years_back=5),
                        "end_date": self.random_past_date(years_back=1) if random.random() > 0.3 else None,
                    }
                )

            # Criar formação acadêmica
            for edu_data in candidate_data.get("educacao", []):
                Education.objects.get_or_create(
                    profile=profile,
                    institution=edu_data["institution"],
                    course=edu_data["course"],
                    defaults={
                        "status": edu_data.get("status", "completed"),
                        "start_date": self.random_past_date(years_back=8),
                        "end_date": self.random_past_date(years_back=2) if edu_data.get("status") == "completed" else None,
                    }
                )

    def create_medium_candidates(self):
        """Cria candidatos com perfil mediano."""
        for candidate_data in CANDIDATOS_MEDIANOS:
            user, created = User.objects.get_or_create(
                username=candidate_data["username"],
                defaults={
                    "email": candidate_data["email"],
                    "first_name": candidate_data["first_name"],
                    "last_name": candidate_data["last_name"],
                }
            )
            if created:
                user.set_password(candidate_data["password"])
                user.save()
                self.stats['users_created'] += 1
                self.stdout.write(f"  ✓ Candidato mediano criado: {user.username}")
            else:
                self.stats['users_existing'] += 1

            # Atualizar perfil básico
            profile = user.profile
            profile.bio = candidate_data.get("bio", "")
            profile.city = candidate_data.get("city", "")
            profile.skills = candidate_data.get("skills", "")
            profile.save()

    def create_incomplete_candidates(self):
        """Cria candidatos com perfil incompleto (apenas nome e email)."""
        for candidate_data in CANDIDATOS_INCOMPLETOS:
            user, created = User.objects.get_or_create(
                username=candidate_data["username"],
                defaults={
                    "email": candidate_data["email"],
                    "first_name": candidate_data["first_name"],
                    "last_name": candidate_data["last_name"],
                }
            )
            if created:
                user.set_password(candidate_data["password"])
                user.save()
                self.stats['users_created'] += 1
                self.stdout.write(f"  ✓ Candidato incompleto criado: {user.username}")
            else:
                self.stats['users_existing'] += 1

    def create_applications(self):
        """Cria candidaturas para candidatos com perfil pronto."""
        # Candidatos com perfil pronto (excelentes + medianos)
        candidate_usernames = [c["username"] for c in CANDIDATOS_EXCELENTES + CANDIDATOS_MEDIANOS]
        candidates = User.objects.filter(username__in=candidate_usernames)
        
        # Vagas ativas disponíveis
        active_jobs = list(Job.objects.filter(is_active=True))
        
        if not active_jobs:
            self.stdout.write(self.style.WARNING("  ⚠ Nenhuma vaga ativa disponível para candidaturas"))
            return

        for candidate in candidates:
            # Número aleatório de candidaturas (3 a 7)
            num_applications = random.randint(3, min(7, len(active_jobs)))
            jobs_to_apply = random.sample(active_jobs, num_applications)
            
            for job in jobs_to_apply:
                application, created = Application.objects.get_or_create(
                    user=candidate,
                    job=job,
                    defaults={
                        "status": random.choice([
                            Application.Status.APPLIED,
                            Application.Status.APPLIED,
                            Application.Status.APPLIED,
                            Application.Status.INTERVIEWING,
                        ]),
                        "cover_letter": fake.paragraph(nb_sentences=3) if random.random() > 0.5 else "",
                    }
                )
                
                if created:
                    self.stats['applications_created'] += 1
                else:
                    self.stats['applications_existing'] += 1
            
            self.stdout.write(f"  ✓ {candidate.username}: {num_applications} candidaturas")

    def random_past_date(self, years_back=5):
        """Gera uma data aleatória no passado."""
        days_back = random.randint(1, years_back * 365)
        return date.today() - timedelta(days=days_back)

    def print_stats(self):
        """Imprime estatísticas finais."""
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("✅ Seed concluído com sucesso!\n"))
        
        self.stdout.write("📊 Estatísticas:")
        self.stdout.write(f"   Usuários: {self.stats['users_created']} criados, {self.stats['users_existing']} já existiam")
        self.stdout.write(f"   Empresas: {self.stats['companies_created']} criadas, {self.stats['companies_existing']} já existiam")
        self.stdout.write(f"   Vagas: {self.stats['jobs_created']} criadas, {self.stats['jobs_existing']} já existiam")
        self.stdout.write(f"   Candidaturas: {self.stats['applications_created']} criadas, {self.stats['applications_existing']} já existiam")
        
        self.stdout.write("\n📌 Credenciais de teste:")
        self.stdout.write("   Senha padrão: ginga@2024")
        self.stdout.write("   Recrutadores: master@techcorp.com.br, ana.rh@inovabr.com.br, ...")
        self.stdout.write("   Candidatos: flavio.expert@email.com, carolina.dev@email.com, ...")
        self.stdout.write("=" * 50 + "\n")
