from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.forms import inlineformset_factory

from .models import User, Profile, ProfessionalExperience, Education


class SignUpForm(UserCreationForm):
    """Custom registration form with first_name, last_name, and email."""

    first_name = forms.CharField(
        max_length=150,
        required=True,
        label='Nome',
        widget=forms.TextInput(attrs={'placeholder': 'Seu nome'})
    )
    last_name = forms.CharField(
        max_length=150,
        required=True,
        label='Sobrenome',
        widget=forms.TextInput(attrs={'placeholder': 'Seu sobrenome'})
    )
    email = forms.EmailField(
        required=True,
        label='E-mail',
        widget=forms.EmailInput(attrs={'placeholder': 'seu@email.com'})
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'password1', 'password2')

    def clean_email(self):
        """Validate that the email is unique."""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('Este e-mail já está em uso.')
        return email

    def save(self, commit=True):
        """Save the user with email as username."""
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.username = self.cleaned_data['email']  # Use email as username
        if commit:
            user.save()
        return user


class UserUpdateForm(forms.ModelForm):
    """Form for updating user basic information."""

    first_name = forms.CharField(
        max_length=150,
        required=True,
        label='Nome',
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
            'placeholder': 'Seu nome'
        })
    )
    last_name = forms.CharField(
        max_length=150,
        required=True,
        label='Sobrenome',
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
            'placeholder': 'Seu sobrenome'
        })
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name')


class ProfileUpdateForm(forms.ModelForm):
    """Form for updating user profile."""

    class Meta:
        model = Profile
        fields = ('bio', 'avatar', 'city', 'contact_info', 'github_url', 'linkedin_url')
        widgets = {
            'bio': forms.Textarea(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Conte um pouco sobre você...',
                'rows': 4
            }),
            'avatar': forms.FileInput(attrs={
                'class': 'hidden',
                'accept': 'image/*'
            }),
            'city': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Ex: São Paulo, SP'
            }),
            'contact_info': forms.Textarea(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Telefone, email alternativo, etc.',
                'rows': 2
            }),
            'github_url': forms.URLInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'https://github.com/seu-usuario'
            }),
            'linkedin_url': forms.URLInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'https://linkedin.com/in/seu-perfil'
            }),
        }
        labels = {
            'bio': 'Biografia',
            'avatar': 'Foto de Perfil',
            'city': 'Cidade',
            'contact_info': 'Informações de Contato',
            'github_url': 'GitHub',
            'linkedin_url': 'LinkedIn',
        }


class ProfessionalExperienceForm(forms.ModelForm):
    """Form for professional experience."""

    class Meta:
        model = ProfessionalExperience
        fields = ('company', 'role', 'start_date', 'end_date', 'description')
        widgets = {
            'company': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Nome da empresa',
            }),
            'role': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Cargo/Função',
            }),
            'start_date': forms.DateInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'type': 'date',
            }),
            'end_date': forms.DateInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'type': 'date',
            }),
            'description': forms.Textarea(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Descreva suas responsabilidades e conquistas...',
                'rows': 3,
            }),
        }
        labels = {
            'company': 'Empresa',
            'role': 'Cargo',
            'start_date': 'Data de Início',
            'end_date': 'Data de Término',
            'description': 'Descrição',
        }


class EducationForm(forms.ModelForm):
    """Form for education."""

    class Meta:
        model = Education
        fields = ('institution', 'course', 'status', 'start_date', 'end_date')
        widgets = {
            'institution': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Nome da instituição',
            }),
            'course': forms.TextInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'placeholder': 'Nome do curso',
            }),
            'status': forms.Select(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
            }),
            'start_date': forms.DateInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'type': 'date',
            }),
            'end_date': forms.DateInput(attrs={
                'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                'type': 'date',
            }),
        }
        labels = {
            'institution': 'Instituição',
            'course': 'Curso',
            'status': 'Status',
            'start_date': 'Data de Início',
            'end_date': 'Data de Término',
        }


class SkillsForm(forms.Form):
    """Form for managing skills/competencies."""

    skills = forms.CharField(
        required=False,
        label='Competências Técnicas',
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
            'placeholder': 'Ex: Python, Django, JavaScript, React',
        }),
        help_text='Separe as competências por vírgula',
    )


# Formsets
ProfessionalExperienceFormSet = inlineformset_factory(
    Profile,
    ProfessionalExperience,
    form=ProfessionalExperienceForm,
    extra=0,
    min_num=0,
    validate_min=False,
    can_delete=True,
)

EducationFormSet = inlineformset_factory(
    Profile,
    Education,
    form=EducationForm,
    extra=0,
    min_num=0,
    validate_min=False,
    can_delete=True,
)
