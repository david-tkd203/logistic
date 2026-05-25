from django.contrib import admin
from django.urls import path, include, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from . import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    # Swagger / OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# SPA catch-all — debe ir al final, atrapa cualquier ruta no cubierta arriba
urlpatterns += [
    re_path(r"^.*$", views.spa_index),
]
