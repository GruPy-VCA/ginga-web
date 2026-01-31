from django.contrib import admin

from .models import Job, Application


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """Job admin configuration."""
    list_display = ('title', 'company', 'salary_range', 'is_active', 'created_at')
    list_filter = ('is_active', 'company', 'created_at')
    search_fields = ('title', 'description', 'company__name')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ()


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """Application admin configuration."""
    list_display = ('user', 'job', 'status', 'applied_at')
    list_filter = ('status', 'applied_at', 'job__company')
    search_fields = ('user__username', 'user__email', 'job__title')
    readonly_fields = ('applied_at', 'updated_at')
