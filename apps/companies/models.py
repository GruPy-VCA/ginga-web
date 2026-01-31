from django.db import models
from django.conf import settings


class Company(models.Model):
    """Company model for job postings."""
    
    name = models.CharField(max_length=200, verbose_name='Name')
    cnpj = models.CharField(
        max_length=18,
        unique=True,
        verbose_name='CNPJ',
        help_text='Format: XX.XXX.XXX/XXXX-XX'
    )
    logo = models.ImageField(
        upload_to='company_logos/',
        blank=True,
        null=True,
        verbose_name='Logo'
    )
    website = models.URLField(blank=True, verbose_name='Website')
    description = models.TextField(blank=True, verbose_name='Description')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='companies',
        verbose_name='Owner'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']

    def __str__(self):
        return self.name
