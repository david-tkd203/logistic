import os

from django.conf import settings
from django.http import FileResponse, Http404


def spa_index(request):
    """Sirve el index.html del frontend para cualquier ruta no cubierta (SPA catch-all).

    Las rutas /api/, /admin/, /static/ se manejan antes en urlpatterns.
    """
    path = os.path.join(settings.STATIC_ROOT, "index.html")
    if not os.path.exists(path):
        raise Http404("Frontend no construido — ejecutá collectstatic primero.")
    return FileResponse(open(path, "rb"), content_type="text/html")
