from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db import IntegrityError, models
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, UpdateView, ListView, DetailView
from taggit.models import Tag

from .forms import JobForm
from .models import Job, Application


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


class TagListView(LoginRequiredMixin, View):
    """API endpoint to return existing tags as JSON for Tagify autocomplete."""

    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', '')
        tags = Tag.objects.all()

        if query:
            tags = tags.filter(name__icontains=query)

        # Return tags in Tagify format
        tag_list = [{'value': tag.name} for tag in tags.order_by('name')[:20]]
        return JsonResponse(tag_list, safe=False)


# ============================================================================
# PUBLIC JOB VIEWS (for candidates)
# ============================================================================


class PublicJobListView(ListView):
    """Public listing of all active jobs for candidates."""
    model = Job
    template_name = 'jobs/job_list.html'
    context_object_name = 'jobs'
    paginate_by = 12

    def get_queryset(self):
        """Return all active jobs, ordered by creation date."""
        queryset = Job.objects.filter(
            is_active=True
        ).select_related('company').prefetch_related('tags').order_by('-created_at')

        # Optional: filter by tag
        tag = self.request.GET.get('tag')
        if tag:
            queryset = queryset.filter(tags__name__iexact=tag)

        # Optional: search by title, company, description or tags
        search = self.request.GET.get('q')
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(company__name__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(tags__name__icontains=search)
            )

        return queryset.distinct()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['total_jobs'] = Job.objects.filter(is_active=True).count()
        context['search_query'] = self.request.GET.get('q', '')
        context['selected_tag'] = self.request.GET.get('tag', '')
        # Popular tags for filter sidebar
        context['popular_tags'] = Tag.objects.annotate(
            job_count=Count('taggit_taggeditem_items')
        ).order_by('-job_count')[:15]
        return context


class JobDetailView(DetailView):
    """Detailed view of a single job posting."""
    model = Job
    template_name = 'jobs/job_detail.html'
    context_object_name = 'job'

    def get_queryset(self):
        """Only show active jobs, unless user is the company owner."""
        queryset = Job.objects.select_related('company').prefetch_related('tags')
        if self.request.user.is_authenticated:
            # Allow owner to see their inactive jobs
            return queryset.filter(
                models.Q(is_active=True) |
                models.Q(company__owner=self.request.user)
            )
        return queryset.filter(is_active=True)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        job = self.object

        # Check if user already applied
        context['already_applied'] = False
        context['user_application'] = None
        if self.request.user.is_authenticated:
            application = Application.objects.filter(
                user=self.request.user,
                job=job
            ).first()
            if application:
                context['already_applied'] = True
                context['user_application'] = application

        # Check if user is the company owner
        context['is_owner'] = (
            self.request.user.is_authenticated and
            job.company.owner == self.request.user
        )

        # Related jobs (same company or same tags)
        context['related_jobs'] = Job.objects.filter(
            is_active=True
        ).exclude(pk=job.pk).filter(
            models.Q(company=job.company) |
            models.Q(tags__in=job.tags.all())
        ).distinct().select_related('company')[:4]

        return context


class ApplyJobView(LoginRequiredMixin, View):
    """Handle job application submissions."""

    def post(self, request, pk):
        job = get_object_or_404(Job, pk=pk, is_active=True)

        # Check if user is the company owner (can't apply to own jobs)
        if job.company.owner == request.user:
            messages.error(request, 'Você não pode se candidatar a vagas da sua própria empresa.')
            return redirect('jobs:detail', pk=job.pk)

        try:
            Application.objects.create(
                user=request.user,
                job=job,
                cover_letter=request.POST.get('cover_letter', ''),
            )
            messages.success(
                request,
                f'Candidatura enviada com sucesso para "{job.title}"!'
            )
        except IntegrityError:
            messages.warning(request, 'Você já se candidatou a esta vaga.')

        return redirect('jobs:detail', pk=job.pk)


class WithdrawApplicationView(LoginRequiredMixin, View):
    """Allow user to withdraw their application."""

    def post(self, request, pk):
        application = get_object_or_404(
            Application,
            pk=pk,
            user=request.user,
            status=Application.Status.APPLIED  # Only withdraw pending applications
        )
        job_title = application.job.title
        job_pk = application.job.pk
        application.delete()
        messages.success(request, f'Candidatura para "{job_title}" retirada com sucesso.')
        return redirect('jobs:detail', pk=job_pk)


class ApplicationListView(LoginRequiredMixin, ListView):
    """List all applications for the logged-in user."""
    model = Application
    template_name = 'jobs/application_list.html'
    context_object_name = 'applications'
    paginate_by = 10

    def get_queryset(self):
        """Return all applications for the current user."""
        queryset = Application.objects.filter(
            user=self.request.user
        ).select_related('job', 'job__company').order_by('-applied_at')

        # Filter by status if provided
        status = self.request.GET.get('status')
        if status and status in dict(Application.Status.choices):
            queryset = queryset.filter(status=status)

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user_applications = Application.objects.filter(user=self.request.user)

        # Stats
        context['total_applications'] = user_applications.count()
        context['applied_count'] = user_applications.filter(
            status=Application.Status.APPLIED
        ).count()
        context['interviewing_count'] = user_applications.filter(
            status=Application.Status.INTERVIEWING
        ).count()
        context['approved_count'] = user_applications.filter(
            status=Application.Status.APPROVED
        ).count()
        context['rejected_count'] = user_applications.filter(
            status=Application.Status.REJECTED
        ).count()

        # Current filter
        context['selected_status'] = self.request.GET.get('status', '')
        context['status_choices'] = Application.Status.choices

        return context
