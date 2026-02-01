from django import forms

from .models import Job


class JobForm(forms.ModelForm):
    """Form for creating and updating jobs."""

    tags_input = forms.CharField(
        required=False,
        label='Tecnologias',
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
            'placeholder': 'Ex: Python, Django, PostgreSQL, Docker',
        }),
        help_text='Separe as tecnologias por vírgula',
    )

    class Meta:
        model = Job
        fields = ('company', 'title', 'description', 'requirements', 'salary_range', 'is_active')
        widgets = {
            'company': forms.Select(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
            }),
            'title': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Ex: Desenvolvedor Full Stack Python',
            }),
            'description': forms.Textarea(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'rows': 5,
                'placeholder': 'Descreva as responsabilidades e atividades da vaga...',
            }),
            'requirements': forms.Textarea(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'rows': 4,
                'placeholder': 'Liste os requisitos técnicos e comportamentais...',
            }),
            'salary_range': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Ex: R$ 8.000 - R$ 12.000',
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary',
            }),
        }
        labels = {
            'company': 'Empresa',
            'title': 'Título da Vaga',
            'description': 'Descrição',
            'requirements': 'Requisitos',
            'salary_range': 'Faixa Salarial',
            'is_active': 'Vaga Ativa',
        }

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        # Filter companies to show only those owned by the user
        if user:
            self.fields['company'].queryset = user.companies.all()

        # Populate tags_input if editing
        if self.instance and self.instance.pk:
            self.fields['tags_input'].initial = ', '.join(
                tag.name for tag in self.instance.tags.all()
            )

    def save(self, commit=True):
        instance = super().save(commit=commit)

        if commit:
            # Clear existing tags and add new ones
            instance.tags.clear()
            tags_input = self.cleaned_data.get('tags_input', '')
            if tags_input:
                tags = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
                for tag in tags:
                    instance.tags.add(tag)

        return instance
