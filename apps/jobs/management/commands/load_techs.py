"""
Management command to populate taggit tags with technology names.
Idempotent: safe to run multiple times without duplicating data.
"""
from django.core.management.base import BaseCommand
from taggit.models import Tag


TECH_LIST = [
    # Linguagens de Programação
    "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust",
    "PHP", "Ruby", "Swift", "Kotlin", "Dart", "SQL", "Shell Script",
    # Frameworks Backend
    "Django", "Flask", "FastAPI", "Node.js", "Express", "NestJS",
    "Spring Boot", "ASP.NET Core", "Laravel", "Ruby on Rails", "Elixir Phoenix",
    # Frameworks Frontend
    "React", "Vue.js", "Angular", "Next.js", "Svelte", "Nuxt.js",
    "Remix", "Astro", "jQuery",
    # Mobile
    "Flutter", "React Native", "Android SDK", "iOS (SwiftUI)", "Ionic",
    # Bases de Dados
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle",
    "Microsoft SQL Server", "Cassandra", "DynamoDB", "Firebase",
    # DevOps & Cloud
    "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud (GCP)",
    "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI",
    "Nginx", "Prometheus", "Grafana",
    # Ferramentas & Skills Tech
    "Git", "Linux", "API REST", "GraphQL", "WebSockets", "Unit Testing",
    "TDD", "Clean Code", "Microservices", "Serverless", "OAuth 2.0", "JWT",
    # CSS & UI/UX
    "Tailwind CSS", "Bootstrap", "Sass", "Figma", "Adobe XD",
    "Material UI", "Chakra UI", "Styled Components",
    # Data Science & AI
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras",
    "Jupyter Notebook", "OpenAI API", "LangChain",
    # Outros
    "Selenium", "Cypress", "Playwright", "Postman", "Swagger",
    "Jira", "Scrum", "Kanban",
]


class Command(BaseCommand):
    """
    Popula a tabela de tags do django-taggit com tecnologias.
    
    Este comando é idempotente - pode ser executado múltiplas vezes
    sem criar duplicatas graças ao uso de get_or_create().
    """

    help = "Carrega tecnologias para o sistema de autocomplete (idempotente)"

    def handle(self, *args, **options):
        created_count = 0
        existing_count = 0

        for tech in TECH_LIST:
            _, created = Tag.objects.get_or_create(name=tech)
            if created:
                created_count += 1
            else:
                existing_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Sucesso: {len(TECH_LIST)} tecnologias processadas."
            )
        )
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f"  ✓ {created_count} novas tags criadas")
            )
        if existing_count > 0:
            self.stdout.write(
                f"  - {existing_count} tags já existiam (ignoradas)"
            )
