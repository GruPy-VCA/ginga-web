"""
Core views for the Ginga project.
"""
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.views.generic import TemplateView

from apps.jobs.models import Application, Job


class HomeView(TemplateView):
    """Home page view - always shows landing page."""
    template_name = 'home.html'


class DashboardView(LoginRequiredMixin, TemplateView):
    """Dashboard view for authenticated users."""
    template_name = 'dashboard.html'

    def get_recommended_jobs(self, profile):
        """
        Get recommended jobs based on user skills.
        Returns jobs that match at least 1 skill, or latest jobs if no match.
        """
        if profile and profile.skills:
            # Parse user skills (comma-separated)
            user_skills = [
                skill.strip().lower()
                for skill in profile.skills.split(',')
                if skill.strip()
            ]

            if user_skills:
                # Build Q object for matching tags
                tag_query = Q()
                for skill in user_skills:
                    tag_query |= Q(tags__name__iexact=skill)

                # Get jobs with matching tags
                recommended_jobs = Job.objects.filter(
                    is_active=True
                ).filter(tag_query).select_related(
                    'company'
                ).prefetch_related('tags').distinct().order_by('-created_at')[:5]

                if recommended_jobs.exists():
                    return recommended_jobs

        # Fallback: return latest active jobs
        return Job.objects.filter(
            is_active=True
        ).select_related('company').prefetch_related('tags').order_by('-created_at')[:5]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        user = self.request.user
        profile = getattr(user, 'profile', None)

        context['user'] = user
        context['profile'] = profile

        # Get recommended jobs
        context['recommended_jobs'] = self.get_recommended_jobs(profile)

        # Get user's recent applications (last 3)
        context['recent_applications'] = Application.objects.filter(
            user=user
        ).select_related('job', 'job__company').order_by('-applied_at')[:3]
        context['total_applications'] = Application.objects.filter(user=user).count()

        if profile:
            context['tech_projects'] = profile.tech_projects.all()[:5]
            context['experiences'] = profile.experiences.all()[:5]
            context['education_list'] = profile.education.all()[:5]
            context['tech_projects_count'] = profile.tech_projects.count()
            context['experiences_count'] = profile.experiences.count()
            context['education_count'] = profile.education.count()
        else:
            context['tech_projects'] = []
            context['experiences'] = []
            context['education_list'] = []
            context['tech_projects_count'] = 0
            context['experiences_count'] = 0
            context['education_count'] = 0

        return context
