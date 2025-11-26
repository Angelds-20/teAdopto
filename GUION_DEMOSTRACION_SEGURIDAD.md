# Guion de Demostración: Seguridad y Cumplimiento Normativo (Ley 21.459)

**Objetivo:** Demostrar las características de seguridad del prototipo "Te Adopto", destacando cómo protegen la información y cumplen con la normativa vigente sobre delitos informáticos.

---

## 1. Introducción (Contexto)

**Presentador:**
"Para el desarrollo de 'Te Adopto', la seguridad no es un añadido, sino un pilar fundamental. Hemos diseñado el sistema considerando la confidencialidad, integridad y disponibilidad de los datos, alineándonos con los estándares de la industria y la legislación chilena, específicamente la **Ley 21.459 sobre Delitos Informáticos**."

---

## 2. Control de Acceso (Access Control)

**Acción en Pantalla:**
*Mostrar la pantalla de inicio de sesión (Login) y realizar un inicio de sesión exitoso.*

**Presentador:**
"Nuestro primer nivel de defensa es un robusto sistema de **Control de Acceso**. Utilizamos autenticación basada en **Tokens JWT (JSON Web Tokens)**. Esto significa que cada vez que un usuario se identifica, el servidor le otorga una credencial digital cifrada y temporal."

**Detalle Técnico (Mencionar si hay audiencia técnica):**
"En el backend, implementamos permisos granulares. Por ejemplo, tenemos roles diferenciados: 'Administrador', 'Refugio' y 'Cliente'.
*   Un usuario 'Cliente' solo puede ver su propio perfil y adoptar.
*   Solo los usuarios con rol 'Administrador' tienen acceso a la gestión de usuarios, protegido por la clase de permiso `IsAdmin` en nuestra API."

**Vinculación Ley 21.459:**
"Esto mitiga el riesgo de **Acceso Ilícito (Art. 2)**, asegurando que nadie pueda entrar a secciones del sistema para las que no está autorizado."

---

## 3. Validaciones (Validations)

**Acción en Pantalla:**
*Ir al formulario de registro. Intentar registrar un usuario con un nombre inválido (ej. caracteres especiales no permitidos) o intentar registrar un usuario que ya existe.*

**Presentador:**
"Para proteger la integridad del sistema y evitar la inyección de datos maliciosos, implementamos **Validaciones Estrictas** tanto en el frontend como en el backend."

**Detalle Técnico:**
"Como pueden ver, si intento usar un nombre de usuario con caracteres inválidos, el sistema lo rechaza inmediatamente. Esto no es solo cosmético; en el servidor, utilizamos `RegexValidators` que fuerzan que los nombres de usuario cumplan patrones seguros (alfanuméricos), y prevenimos la creación de roles privilegiados (como Admin) desde el registro público."

**Vinculación Ley 21.459:**
"Estas validaciones son clave para prevenir el **Atentado contra la integridad de los datos informáticos (Art. 4)**, asegurando que la información que entra a nuestra base de datos sea legítima y no busque corromper el sistema."

---

## 4. Encriptación de Datos (Data Encryption)

**Acción en Pantalla:**
*Mostrar (si es posible, o mencionar) que no se ven contraseñas en texto plano en ninguna parte, ni siquiera en la respuesta del perfil de usuario.*

**Presentador:**
"Respecto a la protección de la información sensible, aplicamos **Encriptación** estándar de la industria."

**Detalle Técnico:**
"Las contraseñas de los usuarios **NUNCA** se almacenan en texto plano. Utilizamos algoritmos de hashing robustos (PBKDF2 con SHA256) proporcionados por el framework de seguridad de Django. Incluso si alguien tuviera acceso físico a la base de datos, no podría leer las contraseñas de los usuarios."

**Vinculación Ley 21.459:**
"Esto es fundamental para evitar la **Interceptación ilícita (Art. 3)** y proteger la privacidad de nuestros usuarios, dificultando enormemente cualquier intento de uso no autorizado de credenciales."

---

## 5. Conclusión y Cumplimiento Legal

**Presentador:**
"En resumen, 'Te Adopto' implementa una estrategia de defensa en profundidad:
1.  **Autenticación JWT y Roles** para controlar quién entra y qué puede hacer.
2.  **Validaciones de Entrada** para asegurar que los datos sean correctos y seguros.
3.  **Encriptación de Contraseñas** para proteger la identidad digital.

Con estas medidas, no solo construimos un software funcional, sino que demostramos diligencia en el cumplimiento de la **Ley 21.459**, protegiendo activamente contra el acceso ilícito y la manipulación de datos."
