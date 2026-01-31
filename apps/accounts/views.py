from django.urls import reverse_lazy
from django.views.generic import CreateView

from .forms import SignUpForm
from .models import User


class RegisterView(CreateView):
    """User registration view."""
    model = User
    form_class = SignUpForm
    template_name = 'registration/signup.html'
    success_url = reverse_lazy('dashboard')
