from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify


class User(AbstractUser):
    """Custom User model extending AbstractUser."""
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email or self.username


class Profile(models.Model):
    """User profile with portfolio information."""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    bio = models.TextField(blank=True, verbose_name='Biography')
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='Avatar'
    )
    city = models.CharField(max_length=100, blank=True, verbose_name='City')
    contact_info = models.TextField(blank=True, verbose_name='Contact Information')
    github_url = models.URLField(blank=True, verbose_name='GitHub URL')
    linkedin_url = models.URLField(blank=True, verbose_name='LinkedIn URL')
    is_portfolio_public = models.BooleanField(
        default=False,
        verbose_name='Portfolio is Public'
    )
    is_published = models.BooleanField(
        default=False,
        verbose_name='Is Published'
    )
    slug = models.SlugField(unique=True, blank=True, verbose_name='Slug')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'

    def __str__(self):
        return f"Profile of {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.user.username)
        super().save(*args, **kwargs)


class ProfessionalExperience(models.Model):
    """Professional work experience."""
    
    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='experiences'
    )
    company = models.CharField(max_length=200, verbose_name='Company')
    role = models.CharField(max_length=200, verbose_name='Role')
    start_date = models.DateField(verbose_name='Start Date')
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='End Date'
    )
    description = models.TextField(blank=True, verbose_name='Description')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Professional Experience'
        verbose_name_plural = 'Professional Experiences'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.role} at {self.company}"


class Education(models.Model):
    """Educational background."""
    
    class Status(models.TextChoices):
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        DROPPED = 'dropped', 'Dropped'
        ON_HOLD = 'on_hold', 'On Hold'

    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='education'
    )
    institution = models.CharField(max_length=200, verbose_name='Institution')
    course = models.CharField(max_length=200, verbose_name='Course')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
        verbose_name='Status'
    )
    start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Start Date'
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='End Date'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Education'
        verbose_name_plural = 'Education'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.course} at {self.institution}"


class TechProject(models.Model):
    """Technical projects for portfolio."""
    
    class ProjectType(models.TextChoices):
        OPEN_SOURCE = 'open_source', 'Open Source'
        COMMUNITY = 'community', 'Community'
        EVENT = 'event', 'Event'
        LECTURE = 'lecture', 'Lecture'

    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='tech_projects'
    )
    name = models.CharField(max_length=200, verbose_name='Name')
    description = models.TextField(blank=True, verbose_name='Description')
    url = models.URLField(blank=True, verbose_name='URL')
    project_type = models.CharField(
        max_length=20,
        choices=ProjectType.choices,
        default=ProjectType.OPEN_SOURCE,
        verbose_name='Type'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tech Project'
        verbose_name_plural = 'Tech Projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
