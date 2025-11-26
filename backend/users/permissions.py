from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsShelter(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "shelter"

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "client"

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.role == "admin" or obj.user == request.user

class IsPetOwnerOrAdmin(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        if request.user.role == "shelter":
            try:
                return obj.shelter and obj.shelter.user == request.user
            except:
                return False
        if request.user.role == "client":
            try:
                return obj.owner == request.user
            except:
                return False
        return False

class IsShelterOrClient(permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role == "shelter" or request.user.role == "client")

class IsAdoptionRequestOwnerOrAdmin(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        if obj.user == request.user:
            return True
        if request.user.role == "shelter" and obj.pet.shelter:
            try:
                return obj.pet.shelter.user == request.user
            except:
                return False
        return False
