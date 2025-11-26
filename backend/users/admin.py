from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email", "phone")}),
        ("Roles y permisos", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas importantes", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "password1", "password2", "role", "phone", "is_staff", "is_superuser"),
        }),
    )

    list_display = ("username", "email", "role_badge", "phone", "is_active", "is_staff", "is_superuser", "date_joined")
    list_filter = ("role", "is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("username", "email", "phone", "first_name", "last_name")
    actions = ["make_admin", "make_staff", "remove_staff", "activate_users", "deactivate_users"]
    
    def role_badge(self, obj):
        colors = {
            "admin": "red",
            "shelter": "blue",
            "client": "green"
        }
        color = colors.get(obj.role, "gray")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_role_display()
        )
    role_badge.short_description = 'Rol'
    
    def save_model(self, request, obj, form, change):
        """Asignar automáticamente is_staff e is_superuser cuando role=admin"""
        if obj.role == "admin":
            obj.is_staff = True
            obj.is_superuser = True
        super().save_model(request, obj, form, change)
    
    def make_admin(self, request, queryset):
        """Convertir usuarios seleccionados en administradores"""
        count = queryset.update(role="admin", is_staff=True, is_superuser=True)
        self.message_user(request, f'{count} usuario(s) convertido(s) en administrador(es).')
    make_admin.short_description = "Convertir en administradores"
    
    def make_staff(self, request, queryset):
        """Dar permisos de staff a usuarios seleccionados"""
        count = queryset.update(is_staff=True)
        self.message_user(request, f'{count} usuario(s) ahora tiene(n) permisos de staff.')
    make_staff.short_description = "Dar permisos de staff"
    
    def remove_staff(self, request, queryset):
        """Quitar permisos de staff a usuarios seleccionados (excepto admins)"""
        count = queryset.exclude(role="admin").update(is_staff=False, is_superuser=False)
        self.message_user(request, f'{count} usuario(s) sin permisos de staff.')
    remove_staff.short_description = "Quitar permisos de staff"
    
    def activate_users(self, request, queryset):
        """Activar usuarios seleccionados"""
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} usuario(s) activado(s).')
    activate_users.short_description = "Activar usuarios"
    
    def deactivate_users(self, request, queryset):
        """Desactivar usuarios seleccionados"""
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} usuario(s) desactivado(s).')
    deactivate_users.short_description = "Desactivar usuarios"
