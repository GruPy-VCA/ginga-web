from django.db import models
from django.conf import settings
from taggit.managers import TaggableManager

from apps.companies.models import Company


class Job(models.Model):
    """Job posting model."""
    
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='jobs',
        verbose_name='Company'
    )
    title = models.CharField(max_length=200, verbose_name='Title')
    description = models.TextField(verbose_name='Description')
    requirements = models.TextField(blank=True, verbose_name='Requirements')
    salary_range = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Salary Range',
        help_text='e.g., R$ 5.000 - R$ 8.000'
    )
    tags = TaggableManager(blank=True, verbose_name='Tags')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Job'
        verbose_name_plural = 'Jobs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company.name}"


class Application(models.Model):
    """Job application model linking User to Job."""
    
    class Status(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        INTERVIEWING = 'interviewing', 'Interviewing'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    class RejectionReason(models.TextChoices):
        NOT_QUALIFIED = 'not_qualified', 'Not Qualified'
        POSITION_FILLED = 'position_filled', 'Position Filled'
        SALARY_MISMATCH = 'salary_mismatch', 'Salary Mismatch'
        CULTURE_FIT = 'culture_fit', 'Culture Fit'
        EXPERIENCE_LEVEL = 'experience_level', 'Experience Level'
        OTHER = 'other', 'Other'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name='Applicant'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name='Job'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED,
        verbose_name='Status'
    )
    rejection_reason = models.CharField(
        max_length=30,
        choices=RejectionReason.choices,
        blank=True,
        verbose_name='Rejection Reason'
    )
    feedback_text = models.TextField(
        blank=True,
        verbose_name='Feedback'
    )
    cover_letter = models.TextField(
        blank=True,
        verbose_name='Cover Letter'
    )
    resume = models.FileField(
        upload_to='resumes/',
        blank=True,
        null=True,
        verbose_name='Resume'
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Application'
        verbose_name_plural = 'Applications'
        ordering = ['-applied_at']
        unique_together = ['user', 'job']

    def __str__(self):
        return f"{self.user.username} - {self.job.title}"
