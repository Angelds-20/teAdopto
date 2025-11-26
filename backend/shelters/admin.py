from django.contrib import admin
from django.utils.html import format_html
from .models import Shelter

@admin.register(Shelter)
class ShelterAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'address', 'verified_badge', 'photo_preview', 'shelter_id')
    list_filter = ('verified', 'user__role')
    search_fields = ('name', 'address', 'user__username', 'user__email')
    readonly_fields = ('photo_preview', 'shelter_id')
    fieldsets = (
        ('Información básica', {
            'fields': ('user', 'name', 'address')
        }),
        ('Verificación', {
            'fields': ('verified',)
        }),
        ('Foto', {
            'fields': ('photo', 'photo_preview')
        }),
        ('Información adicional', {
            'fields': ('shelter_id',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_shelters', 'unverify_shelters']
    
    def verified_badge(self, obj):
        if obj.verified:
            return format_html('<span style="color: green; font-weight: bold;">✓ Verificado</span>')
        return format_html('<span style="color: orange; font-weight: bold;">⏳ Pendiente</span>')
    verified_badge.short_description = 'Estado'
    
    def photo_preview(self, obj):
        if obj.photo:
            return format_html('<img src="{}" style="max-width: 200px; max-height: 200px;" />', obj.photo.url)
        return "Sin foto"
    photo_preview.short_description = 'Vista previa'
    
    def shelter_id(self, obj):
        """Mostrar el ID del refugio"""
        if hasattr(obj, 'id'):
            return f"ID: {obj.id}"
        return "-"
    shelter_id.short_description = 'ID'
    
    def verify_shelters(self, request, queryset):
        """Acción para verificar refugios seleccionados"""
        count = queryset.update(verified=True)
        self.message_user(request, f'{count} refugio(s) marcado(s) como verificado(s).')
    verify_shelters.short_description = "Verificar refugios seleccionados"
    
    def unverify_shelters(self, request, queryset):
        """Acción para desverificar refugios seleccionados"""
        count = queryset.update(verified=False)
        self.message_user(request, f'{count} refugio(s) marcado(s) como no verificado(s).')
    unverify_shelters.short_description = "Desverificar refugios seleccionados"
