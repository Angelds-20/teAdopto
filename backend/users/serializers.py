from rest_framework import serializers
from .models import User
import re

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=False,
        min_length=8,
        error_messages={
            "min_length": "La contraseña debe tener al menos 8 caracteres.",
            "required": "Este campo es requerido."
        }
    )
    shelter_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=200,
        help_text="Nombre del refugio (requerido si role=shelter)"
    )
    shelter_address = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="Dirección del refugio (requerido si role=shelter)"
    )
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "phone", "shelter_name", "shelter_address"]
        extra_kwargs = {
            "password": {"write_only": True},
            "role": {"required": False},
            "username": {
                "error_messages": {
                    "required": "El nombre de usuario es requerido.",
                    "unique": "Este nombre de usuario ya está en uso."
                }
            },
            "email": {
                "error_messages": {
                    "required": "El correo electrónico es requerido.",
                    "invalid": "Ingresa un correo electrónico válido.",
                    "unique": "Este correo electrónico ya está registrado."
                }
            }
        }
    
    def validate_username(self, value):
        if self.instance is None:
            if not re.match(r'^[a-zA-Z0-9\s_-]{3,30}$', value):
                raise serializers.ValidationError(
                    "El nombre de usuario debe tener entre 3 y 30 caracteres y solo puede contener letras, números, espacios, guiones (-) y guiones bajos (_). Ejemplo: Juan Pérez"
                )
            return value.strip()
        return value
    
    def validate_email(self, value):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise serializers.ValidationError(
                "Ingresa un correo electrónico válido. Ejemplo: juan.perez@ejemplo.com"
            )
        return value.lower()
    
    def validate_phone(self, value):
        if value:
            phone_pattern = r'^(\+?[0-9]{10,15}|[0-9]{10})$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError(
                    "El teléfono debe tener 10 dígitos o formato internacional (+ seguido de 10-15 dígitos). Ejemplo: +1234567890 o 1234567890"
                )
        return value
    
    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("La contraseña es requerida.")
        
        if len(value) < 8:
            raise serializers.ValidationError("La contraseña debe tener al menos 8 caracteres.")
        
        if not re.search(r'[A-Za-z]', value):
            raise serializers.ValidationError("La contraseña debe contener al menos una letra.")
        
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("La contraseña debe contener al menos un número.")
        
        return value
    
    def validate_role(self, value):
        if self.instance is None:
            if value not in ["client", "shelter"]:
                raise serializers.ValidationError(
                    "El rol debe ser 'client' (adoptador) o 'shelter' (refugio)."
                )
        return value
    
    def validate(self, data):
        if data.get('role') == 'shelter':
            if not data.get('shelter_name') or not data.get('shelter_name').strip():
                raise serializers.ValidationError({
                    'shelter_name': 'El nombre del refugio es requerido cuando te registras como refugio.'
                })
            if not data.get('shelter_address') or not data.get('shelter_address').strip():
                raise serializers.ValidationError({
                    'shelter_address': 'La dirección del refugio es requerida cuando te registras como refugio.'
                })
        return data
    
    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "Este campo es requerido."})
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
