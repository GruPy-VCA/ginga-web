from django.urls import path

from .views import RegisterView, ProfileUpdateView

app_name = 'accounts'

urlpatterns = [
    path('signup/', RegisterView.as_view(), name='signup'),
    path('profile/edit/', ProfileUpdateView.as_view(), name='profile_edit'),
]
