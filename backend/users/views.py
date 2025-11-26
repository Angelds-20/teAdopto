from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer
from .permissions import IsAdmin

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]
    
    def perform_create(self, serializer):
        role = serializer.validated_data.get('role', 'client')
        
        if role not in ['client', 'shelter']:
            role = 'client'
        
        shelter_name = serializer.validated_data.pop('shelter_name', None)
        shelter_address = serializer.validated_data.pop('shelter_address', None)
        
        user = serializer.save(role=role)
        
        if role == 'shelter':
            from shelters.models import Shelter
            Shelter.objects.create(
                user=user,
                name=shelter_name.strip() if shelter_name else user.username,
                address=shelter_address.strip() if shelter_address else "",
                verified=False
            )
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
