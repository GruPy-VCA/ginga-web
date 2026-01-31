"""
Core views for the Ginga project.
"""
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView


class HomeView(TemplateView):
    """Home page view - always shows landing page."""
    template_name = 'home.html'


class DashboardView(LoginRequiredMixin, TemplateView):
    """Dashboard view for authenticated users."""
    template_name = 'dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        user = self.request.user
        profile = getattr(user, 'profile', None)

        context['user'] = user
        context['profile'] = profile

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
