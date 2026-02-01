from django.urls import path

from .views import (
    JobCreateView,
    JobUpdateView,
    JobListView,
    TagListView,
    PublicJobListView,
    JobDetailView,
    ApplyJobView,
    WithdrawApplicationView,
    ApplicationListView,
)

app_name = 'jobs'

urlpatterns = [
    # Recruiter dashboard
    path('dashboard/', JobListView.as_view(), name='dashboard'),
    path('create/', JobCreateView.as_view(), name='create'),
    path('<int:pk>/edit/', JobUpdateView.as_view(), name='edit'),

    # Public job listings (for candidates)
    path('', PublicJobListView.as_view(), name='list'),
    path('<int:pk>/', JobDetailView.as_view(), name='detail'),
    path('<int:pk>/apply/', ApplyJobView.as_view(), name='apply'),

    # Applications
    path('candidaturas/', ApplicationListView.as_view(), name='application_list'),
    path('application/<int:pk>/withdraw/', WithdrawApplicationView.as_view(), name='withdraw'),

    # API
    path('api/tags/', TagListView.as_view(), name='tags_api'),
]
