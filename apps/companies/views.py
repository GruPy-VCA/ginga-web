from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db.models import Count, Q
from django.urls import reverse_lazy
from django.views.generic import CreateView, UpdateView, DeleteView, TemplateView

from .forms import CompanyForm
from .models import Company


class CompanyDashboardView(LoginRequiredMixin, TemplateView):
    """Dashboard for company owners to manage their companies and jobs."""
    template_name = 'companies/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Get all companies owned by the current user
        companies = Company.objects.filter(owner=self.request.user).prefetch_related(
            'jobs'
        ).annotate(
            total_jobs=Count('jobs'),
            active_jobs=Count('jobs', filter=Q(jobs__is_active=True)),
        )

        # For each company, add job details with application counts
        companies_with_jobs = []
        for company in companies:
            jobs_with_counts = company.jobs.annotate(
                applications_count=Count('applications')
            ).order_by('-created_at')

            companies_with_jobs.append({
                'company': company,
                'jobs': jobs_with_counts,
                'total_jobs': jobs_with_counts.count(),
                'active_jobs': jobs_with_counts.filter(is_active=True).count(),
            })

        context['companies'] = companies_with_jobs
        context['has_companies'] = companies.exists()

        return context


class CompanyCreateView(LoginRequiredMixin, CreateView):
    """View for creating a new company."""
    model = Company
    form_class = CompanyForm
    template_name = 'companies/company_form.html'
    success_url = reverse_lazy('companies:dashboard')

    def form_valid(self, form):
        """Assign the current user as the company owner."""
        form.instance.owner = self.request.user
        messages.success(self.request, 'Empresa registada com sucesso!')
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_edit'] = False
        context['page_title'] = 'Registar Empresa'
        return context


class CompanyUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """View for updating an existing company."""
    model = Company
    form_class = CompanyForm
    template_name = 'companies/company_form.html'
    success_url = reverse_lazy('companies:dashboard')

    def test_func(self):
        """Only allow the company owner to edit."""
        company = self.get_object()
        return company.owner == self.request.user

    def form_valid(self, form):
        messages.success(self.request, 'Empresa atualizada com sucesso!')
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_edit'] = True
        context['page_title'] = 'Editar Empresa'
        return context


class CompanyDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """View for deleting a company."""
    model = Company
    template_name = 'companies/company_confirm_delete.html'
    success_url = reverse_lazy('companies:dashboard')

    def test_func(self):
        """Only allow the company owner to delete."""
        company = self.get_object()
        return company.owner == self.request.user

    def form_valid(self, form):
        messages.success(self.request, 'Empresa excluída com sucesso!')
        return super().form_valid(form)
