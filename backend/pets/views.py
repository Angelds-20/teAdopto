from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Pet, AdoptionRequest, PetPhoto
from .serializers import PetSerializer, AdoptionRequestSerializer, PetPhotoSerializer
from users.permissions import IsShelter, IsClient, IsPetOwnerOrAdmin, IsShelterOrClient, IsAdoptionRequestOwnerOrAdmin

class PetViewSet(viewsets.ModelViewSet):
    queryset = Pet.objects.all()
    serializer_class = PetSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsShelterOrClient()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPetOwnerOrAdmin()]
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "shelter":
            try:
                shelter = user.shelter
                pet = serializer.save(shelter=shelter, owner=None)
            except:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Los usuarios con rol 'shelter' deben tener un refugio asociado. Contacta al administrador.")
        elif user.role == "client":
            pet = serializer.save(owner=user, shelter=None)
        else:
            pet = serializer.save()
        
        if not pet.owner and not pet.shelter:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("La mascota debe tener un dueño (cliente) o un refugio asociado.")
        
        photos = self.request.FILES.getlist('photos')
        if photos:
            if pet.photos.exists():
                pet.photos.update(is_primary=False)
            
            for index, photo_file in enumerate(photos):
                PetPhoto.objects.create(
                    pet=pet,
                    photo=photo_file,
                    is_primary=(index == 0),
                    order=index
                )
    
    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        
        if user.role != "admin":
            validated_data = serializer.validated_data
            if 'owner' in validated_data and validated_data['owner'] != instance.owner:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("No puedes cambiar el dueño de la mascota.")
            if 'shelter' in validated_data and validated_data['shelter'] != instance.shelter:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("No puedes cambiar el refugio de la mascota.")
        
        pet = serializer.save()
        photos = self.request.FILES.getlist('photos')
        if photos:
            if pet.photos.exists():
                pet.photos.update(is_primary=False)
            
            for index, photo_file in enumerate(photos):
                PetPhoto.objects.create(
                    pet=pet,
                    photo=photo_file,
                    is_primary=(index == 0),
                    order=index
                )

class AdoptionRequestViewSet(viewsets.ModelViewSet):
    queryset = AdoptionRequest.objects.all()
    serializer_class = AdoptionRequestSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsClient()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdoptionRequestOwnerOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        pet = serializer.validated_data.get('pet')
        
        if pet:
            if pet.owner == user:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("No puedes solicitar adoptar tu propia mascota.")
            
            if pet.shelter and pet.shelter.user == user:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("No puedes solicitar adoptar una mascota de tu propio refugio.")
            
            existing_request = AdoptionRequest.objects.filter(pet=pet, user=user).first()
            if existing_request:
                from rest_framework.exceptions import ValidationError
                raise ValidationError(f"Ya tienes una solicitud de adopción para esta mascota (Estado: {existing_request.status}).")
        
        serializer.save(user=user)

    def get_queryset(self):
        if self.request.user.role == "admin":
            return AdoptionRequest.objects.all()
        else:
            return AdoptionRequest.objects.filter(user=self.request.user)
