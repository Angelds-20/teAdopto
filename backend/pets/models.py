from django.db import models
from django.conf import settings
import os
from django.utils.text import slugify
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

def pet_photo_upload_path(instance, filename):
    ext = 'jpg'
    slug_name = slugify(instance.pet.name) if instance.pet and instance.pet.name else 'pet'
    pet_type = instance.pet.pet_type if instance.pet else 'unknown'
    from django.utils import timezone
    timestamp = int(timezone.now().timestamp())
    filename = f"{pet_type}_{slug_name}_{timestamp}.{ext}"
    return os.path.join('pets', pet_type, filename)

def shelter_photo_upload_path(instance, filename):
    ext = 'jpg'
    slug_name = slugify(instance.name) if instance.name else 'shelter'
    from django.utils import timezone
    timestamp = int(timezone.now().timestamp())
    filename = f"{slug_name}_{timestamp}.{ext}"
    return os.path.join('shelters', filename)

class Pet(models.Model):
    TYPE_CHOICES = (("dog","Perro"),("cat","Gato"))

    name = models.CharField(max_length=120)
    pet_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    breed = models.CharField(max_length=120, blank=True)
    age = models.IntegerField(null=True, blank=True, help_text="Edad numérica")
    AGE_UNIT_CHOICES = (
        ("months", "Meses"),
        ("years", "Años"),
    )
    age_unit = models.CharField(max_length=10, choices=AGE_UNIT_CHOICES, default="years", blank=True, help_text="Unidad de edad (meses o años)")
    size = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    shelter = models.ForeignKey("shelters.Shelter", on_delete=models.CASCADE, related_name="pets", null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_pets", null=True, blank=True)
    photo = models.ImageField(upload_to=pet_photo_upload_path, null=True, blank=True)
    status = models.CharField(max_length=20, default="available")

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.owner and not self.shelter:
            raise ValidationError("La mascota debe tener un dueño (cliente) o un refugio asociado.")
        if self.owner and self.shelter:
            raise ValidationError("Una mascota no puede tener tanto un dueño (cliente) como un refugio al mismo tiempo. Debe ser uno u otro.")

    def save(self, *args, **kwargs):
        self.full_clean()  
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.pet_type})"
    
    @property
    def primary_photo(self):
        photos = self.photos.all().order_by('id')
        if photos.exists():
            return photos.first()
        if self.photo:
            return self
        return None

class PetPhoto(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="photos")
    photo = models.ImageField(upload_to=pet_photo_upload_path)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.IntegerField(default=0)  # Para ordenar las fotos

    class Meta:
        ordering = ['is_primary', 'order', 'id']

    def save(self, *args, **kwargs):
        if self.photo:
            try:
                old_instance = PetPhoto.objects.get(pk=self.pk)
                photo_changed = old_instance.photo != self.photo
            except PetPhoto.DoesNotExist:
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

    def __str__(self):
        return f"Foto de {self.pet.name}"


class AdoptionRequest(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="pending")

    class Meta:
        unique_together = [['pet', 'user']]

    def __str__(self):
        return f"Request {self.id} - {self.pet.name}"
