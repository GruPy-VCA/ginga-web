from django.urls import path

from .views import JobCreateView, JobUpdateView, JobListView, TagListView

app_name = 'jobs'

urlpatterns = [
    path('dashboard/', JobListView.as_view(), name='dashboard'),
    path('create/', JobCreateView.as_view(), name='create'),
    path('<int:pk>/edit/', JobUpdateView.as_view(), name='edit'),
    path('api/tags/', TagListView.as_view(), name='tags_api'),
]
