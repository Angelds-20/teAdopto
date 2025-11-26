from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from users.views import UserViewSet
from shelters.views import ShelterViewSet
from pets.views import PetViewSet, AdoptionRequestViewSet

router = routers.DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"shelters", ShelterViewSet)
router.register(r"pets", PetViewSet)
router.register(r"adoptions", AdoptionRequestViewSet)

def api_root(request):
    """Root endpoint that redirects to API documentation"""
    return JsonResponse({
        "message": "TeAdopto API",
        "version": "1.0",
        "endpoints": {
            "api": "/api/",
            "admin": "/admin/",
            "login": "/api/login/",
            "refresh": "/api/refresh/",
        }
    })

urlpatterns = [
    path("", api_root, name="root"),
    path("admin/", admin.site.urls),

    # JWT
    path("api/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # API CRUD
    path("api/", include(router.urls)),
]

from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

