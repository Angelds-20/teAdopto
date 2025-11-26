from django.contrib import admin
from django.utils.html import format_html
from .models import Pet, AdoptionRequest, PetPhoto

class PetPhotoInline(admin.TabularInline):
    model = PetPhoto
    extra = 0
    readonly_fields = ('photo_preview',)
    fields = ('photo', 'photo_preview', 'is_primary', 'order')
    
    def photo_preview(self, obj):
        if obj.photo:
            return format_html('<img src="{}" style="max-width: 100px; max-height: 100px;" />', obj.photo.url)
        return "Sin foto"
    photo_preview.short_description = 'Vista previa'

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('name', 'pet_type', 'breed', 'age', 'size', 'owner_or_shelter', 'status_badge', 'pet_id')
    list_filter = ('pet_type', 'size', 'shelter', 'owner')
    search_fields = ('name', 'breed', 'description', 'shelter__name', 'owner__username')
    readonly_fields = ('primary_photo_preview', 'pet_id')
    inlines = [PetPhotoInline]
    fieldsets = (
        ('Información básica', {
            'fields': ('name', 'pet_type', 'breed', 'age', 'size', 'description')
        }),
        ('Propietario', {
            'fields': ('shelter', 'owner')
        }),
        ('Foto principal', {
            'fields': ('primary_photo_preview',)
        }),
        ('Información adicional', {
            'fields': ('pet_id',),
            'classes': ('collapse',)
        }),
    )
    
    def owner_or_shelter(self, obj):
        if obj.shelter:
            return format_html('<span style="color: blue;">Refugio: {}</span>', obj.shelter.name)
        elif obj.owner:
            return format_html('<span style="color: green;">Dueño: {}</span>', obj.owner.username)
        return "Sin propietario"
    owner_or_shelter.short_description = 'Propietario'
    
    def status_badge(self, obj):
        # Verificar si tiene fotos
        has_photos = obj.photos.exists()
        if has_photos:
            return format_html('<span style="color: green;">✓ Con fotos</span>')
        return format_html('<span style="color: orange;">⚠ Sin fotos</span>')
    status_badge.short_description = 'Estado'
    
    def primary_photo_preview(self, obj):
        primary_photo = obj.photos.filter(is_primary=True).first()
        if primary_photo and primary_photo.photo:
            return format_html('<img src="{}" style="max-width: 300px; max-height: 300px;" />', primary_photo.photo.url)
        return "Sin foto principal"
    primary_photo_preview.short_description = 'Foto principal'
    
    def pet_id(self, obj):
        """Mostrar el ID de la mascota"""
        if hasattr(obj, 'id'):
            return f"ID: {obj.id}"
        return "-"
    pet_id.short_description = 'ID'

@admin.register(AdoptionRequest)
class AdoptionRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'pet_name', 'status_badge', 'request_id_display')
    list_filter = ('status', 'pet__pet_type')
    search_fields = ('user__username', 'user__email', 'pet__name', 'message')
    readonly_fields = ('request_id',)
    fieldsets = (
        ('Información de la solicitud', {
            'fields': ('user', 'pet', 'status', 'message')
        }),
        ('Información adicional', {
            'fields': ('request_id',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_requests', 'reject_requests', 'pending_requests']
    
    def pet_name(self, obj):
        if obj.pet:
            return format_html('<strong>{}</strong> ({})', obj.pet.name, obj.pet.get_pet_type_display())
        return "-"
    pet_name.short_description = 'Mascota'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'completed': 'blue'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Estado'
    
    def request_id(self, obj):
        """Mostrar el ID de la solicitud"""
        if hasattr(obj, 'id'):
            return f"ID: {obj.id}"
        return "-"
    request_id.short_description = 'ID'
    
    def request_id_display(self, obj):
        """Mostrar el ID en la lista"""
        if hasattr(obj, 'id'):
            return f"#{obj.id}"
        return "-"
    request_id_display.short_description = 'ID'
    
    def approve_requests(self, request, queryset):
        """Aprobar solicitudes seleccionadas"""
        count = queryset.update(status='approved')
        self.message_user(request, f'{count} solicitud(es) aprobada(s).')
    approve_requests.short_description = "Aprobar solicitudes"
    
    def reject_requests(self, request, queryset):
        """Rechazar solicitudes seleccionadas"""
        count = queryset.update(status='rejected')
        self.message_user(request, f'{count} solicitud(es) rechazada(s).')
    reject_requests.short_description = "Rechazar solicitudes"
    
    def pending_requests(self, request, queryset):
        """Marcar solicitudes como pendientes"""
        count = queryset.update(status='pending')
        self.message_user(request, f'{count} solicitud(es) marcada(s) como pendiente(s).')
    pending_requests.short_description = "Marcar como pendientes"
