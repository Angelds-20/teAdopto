from rest_framework import serializers
from django.conf import settings
from .models import Pet, AdoptionRequest, PetPhoto

def get_base_url(request=None):
    if request:
        return request.build_absolute_uri('/').rstrip('/')
    import os
    from django.conf import settings
    base_url = os.getenv('BASE_URL', getattr(settings, 'BASE_URL', 'http://127.0.0.1:8000'))
    return base_url.rstrip('/')

class PetPhotoSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PetPhoto
        fields = ['id', 'photo_url', 'is_primary', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            base_url = get_base_url(request)
            photo_url = obj.photo.url
            return f"{base_url}{photo_url}"
        return None

class PetSerializer(serializers.ModelSerializer):
    photos = PetPhotoSerializer(many=True, read_only=True)
    primary_photo_url = serializers.SerializerMethodField()
    age_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Pet
        fields = "__all__"
    
    def get_age_display(self, obj):
        """Retorna la edad formateada con su unidad"""
        if obj.age is None:
            return None
        if obj.age_unit == "months":
            return f"{obj.age} {'mes' if obj.age == 1 else 'meses'}"
        else:
            return f"{obj.age} {'año' if obj.age == 1 else 'años'}"
    
    def get_primary_photo_url(self, obj):
        primary_photo = obj.primary_photo
        if primary_photo:
            request = self.context.get('request')
            base_url = get_base_url(request)
            return f"{base_url}{primary_photo.photo.url}"
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        base_url = get_base_url(request)
        if representation.get('photo') and instance.photo:
            representation['photo'] = f"{base_url}{instance.photo.url}"
        if representation.get('photos') and len(representation['photos']) > 0:
            representation['photo'] = representation['photos'][0]['photo_url']
        return representation

class AdoptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdoptionRequest
        fields = "__all__"
        read_only_fields = ['user', 'created_at']
    
    def validate_pet(self, value):
        if not value:
            raise serializers.ValidationError("Debes seleccionar una mascota.")
        return value
