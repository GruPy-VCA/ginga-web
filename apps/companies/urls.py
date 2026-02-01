from django.urls import path

from .views import (
    CompanyDashboardView,
    CompanyCreateView,
    CompanyUpdateView,
    CompanyDeleteView,
)

app_name = 'companies'

urlpatterns = [
    path('dashboard/', CompanyDashboardView.as_view(), name='dashboard'),
    path('create/', CompanyCreateView.as_view(), name='create'),
    path('<int:pk>/edit/', CompanyUpdateView.as_view(), name='edit'),
    path('<int:pk>/delete/', CompanyDeleteView.as_view(), name='delete'),
]
