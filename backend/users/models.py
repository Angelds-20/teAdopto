from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

username_validator = RegexValidator(
    regex=r'^[a-zA-Z0-9\s_-]{3,30}$',
    message='El nombre de usuario debe tener entre 3 y 30 caracteres y solo puede contener letras, números, espacios, guiones (-) y guiones bajos (_).'
)

class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Administrador"),
        ("shelter", "Refugio"),
        ("client", "Cliente"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="client")
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text='Requerido. 3-30 caracteres. Letras, números, espacios, guiones (-) y guiones bajos (_).',
        validators=[username_validator],
        error_messages={
            'unique': "Un usuario con ese nombre ya existe.",
        },
    )
