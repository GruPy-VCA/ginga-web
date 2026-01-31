"""
Core views for the Ginga project.
"""
from django.views.generic import TemplateView


class HomeView(TemplateView):
    """Home page view displaying the main portal."""
    template_name = 'home.html'
