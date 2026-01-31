from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.views.generic import CreateView, UpdateView

from .forms import SignUpForm, UserUpdateForm, ProfileUpdateForm
from .models import User


class RegisterView(CreateView):
    """User registration view."""
    model = User
    form_class = SignUpForm
    template_name = 'registration/signup.html'
    success_url = reverse_lazy('dashboard')


class ProfileUpdateView(LoginRequiredMixin, UpdateView):
    """Profile update view."""
    template_name = 'accounts/profile_edit.html'
    success_url = reverse_lazy('dashboard')

    def get_object(self, queryset=None):
        return self.request.user.profile

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if 'user_form' not in context:
            context['user_form'] = UserUpdateForm(instance=self.request.user)
        return context

    def get_form_class(self):
        return ProfileUpdateForm

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        user_form = UserUpdateForm(request.POST, instance=request.user)
        profile_form = ProfileUpdateForm(
            request.POST,
            request.FILES,
            instance=self.object
        )

        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Perfil atualizado com sucesso!')
            return self.form_valid(profile_form)
        else:
            return self.render_to_response(
                self.get_context_data(
                    form=profile_form,
                    user_form=user_form
                )
            )

    def form_valid(self, form):
        return super().form_valid(form)
