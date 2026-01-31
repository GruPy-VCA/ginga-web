from django.contrib import admin

from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    """Company admin configuration."""
    list_display = ('name', 'cnpj', 'owner', 'website', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'cnpj', 'owner__username', 'owner__email')
    readonly_fields = ('created_at', 'updated_at')
