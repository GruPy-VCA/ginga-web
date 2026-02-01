from django import forms

from .models import Company


class CompanyForm(forms.ModelForm):
    """Form for creating and updating companies."""

    class Meta:
        model = Company
        fields = ('name', 'cnpj', 'logo', 'website', 'description')
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Nome da empresa'
            }),
            'cnpj': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'XX.XXX.XXX/XXXX-XX'
            }),
            'logo': forms.FileInput(attrs={
                'class': 'hidden',
                'accept': 'image/*'
            }),
            'website': forms.URLInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'https://www.suaempresa.com.br'
            }),
            'description': forms.Textarea(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Descreva a empresa, sua missão e área de atuação...',
                'rows': 4
            }),
        }
        labels = {
            'name': 'Nome da Empresa',
            'cnpj': 'CNPJ',
            'logo': 'Logo',
            'website': 'Website',
            'description': 'Descrição',
        }
