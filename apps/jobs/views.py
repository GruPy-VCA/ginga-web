from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db.models import Count
from django.urls import reverse_lazy
from django.views.generic import CreateView, UpdateView, ListView

from .forms import JobForm
from .models import Job


class JobCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    """View for creating a new job posting."""
    model = Job
    form_class = JobForm
    template_name = 'jobs/job_form.html'
    success_url = reverse_lazy('companies:dashboard')

    def test_func(self):
        """Only allow users who own at least one company."""
        return self.request.user.companies.exists()

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_initial(self):
        initial = super().get_initial()
        company_id = self.request.GET.get('company')
        if company_id:
            # Verify the company belongs to the user
            company = self.request.user.companies.filter(pk=company_id).first()
            if company:
                initial['company'] = company
        return initial

    def form_valid(self, form):
        messages.success(self.request, 'Vaga publicada com sucesso!')
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_edit'] = False
        context['page_title'] = 'Publicar Vaga'
        return context


class JobUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """View for updating an existing job posting."""
    model = Job
    form_class = JobForm
    template_name = 'jobs/job_form.html'
    success_url = reverse_lazy('companies:dashboard')

    def test_func(self):
        """Only allow the company owner to edit the job."""
        job = self.get_object()
        return job.company.owner == self.request.user

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        messages.success(self.request, 'Vaga atualizada com sucesso!')
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_edit'] = True
        context['page_title'] = 'Editar Vaga'
        return context


class JobListView(LoginRequiredMixin, ListView):
    """Dashboard view listing all jobs from user's companies."""
    model = Job
    template_name = 'jobs/job_dashboard.html'
    context_object_name = 'jobs'

    def get_queryset(self):
        """Filter jobs to only show those from companies owned by the user."""
        return Job.objects.filter(
            company__owner=self.request.user
        ).select_related('company').annotate(
            applications_count=Count('applications')
        ).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        jobs = self.get_queryset()
        context['total_jobs'] = jobs.count()
        context['active_jobs'] = jobs.filter(is_active=True).count()
        context['total_applications'] = sum(job.applications_count for job in jobs)
        return context
