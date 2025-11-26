from rest_framework import serializers
from django.conf import settings
from .models import Shelter

def get_base_url(request=None):
    if request:
        return request.build_absolute_uri('/').rstrip('/')
    import os
    from django.conf import settings
    base_url = os.getenv('BASE_URL', getattr(settings, 'BASE_URL', 'http://127.0.0.1:8000'))
    return base_url.rstrip('/')

class ShelterSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Shelter
        fields = "__all__"
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            base_url = get_base_url(request)
            photo_url = obj.photo.url
            return f"{base_url}{photo_url}"
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if representation.get('photo_url'):
            representation['photo'] = representation['photo_url']
        return representation
