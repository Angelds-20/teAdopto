from django.db import models
from django.conf import settings
import os
from django.utils.text import slugify
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

def shelter_photo_upload_path(instance, filename):

    ext = 'jpg'
    slug_name = slugify(instance.name) if instance.name else 'shelter'
    from django.utils import timezone
    timestamp = int(timezone.now().timestamp())
    filename = f"{slug_name}_{timestamp}.{ext}"
    return os.path.join('shelters', filename)

class Shelter(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    verified = models.BooleanField(default=False)
    photo = models.ImageField(upload_to=shelter_photo_upload_path, null=True, blank=True)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if self.photo:
            try:
                old_instance = Shelter.objects.get(pk=self.pk)
                photo_changed = old_instance.photo != self.photo
            except Shelter.DoesNotExist:
                photo_changed = True
            
            if photo_changed:
                img = Image.open(self.photo)
                
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                max_width = 1200
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                output = BytesIO()
                img.save(output, format='JPEG', quality=85, optimize=True)
                output.seek(0)
                
                self.photo = InMemoryUploadedFile(
                    output, 'ImageField', 
                    f"{os.path.splitext(self.photo.name)[0]}.jpg",
                    'image/jpeg', sys.getsizeof(output), None
                )
        
        super().save(*args, **kwargs)
