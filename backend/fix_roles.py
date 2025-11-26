#!/usr/bin/env python3
"""Script to fix user roles for superusers"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

superusers = User.objects.filter(is_superuser=True, is_staff=True)
for user in superusers:
    if user.role != 'admin':
        print(f"Updating {user.username}: {user.role} -> admin")
        user.role = 'admin'
        user.save()
    else:
        print(f"{user.username} already has admin role")

print("\nAll superusers updated!")
