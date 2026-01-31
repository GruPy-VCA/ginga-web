from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, Profile, ProfessionalExperience, Education, TechProject


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin."""
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')


class ProfessionalExperienceInline(admin.TabularInline):
    model = ProfessionalExperience
    extra = 0


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0


class TechProjectInline(admin.TabularInline):
    model = TechProject
    extra = 0


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """Profile admin with inlines."""
    list_display = ('user', 'city', 'is_portfolio_public', 'is_published', 'slug')
    list_filter = ('is_portfolio_public', 'is_published')
    search_fields = ('user__username', 'user__email', 'city')
    prepopulated_fields = {'slug': ('user',)}
    inlines = [ProfessionalExperienceInline, EducationInline, TechProjectInline]


@admin.register(ProfessionalExperience)
class ProfessionalExperienceAdmin(admin.ModelAdmin):
    list_display = ('profile', 'company', 'role', 'start_date', 'end_date')
    list_filter = ('start_date',)
    search_fields = ('company', 'role', 'profile__user__username')


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('profile', 'institution', 'course', 'status')
    list_filter = ('status',)
    search_fields = ('institution', 'course', 'profile__user__username')


@admin.register(TechProject)
class TechProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'profile', 'project_type', 'url')
    list_filter = ('project_type',)
    search_fields = ('name', 'profile__user__username')
