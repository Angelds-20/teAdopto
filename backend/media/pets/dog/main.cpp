from machine import Pin
import time

# Configura el pin 14 como entrada con resistencia interna
sensor = Pin(14, Pin.IN, Pin.PULL_UP)
pulsos = 0

# Función que cuenta
def contar(pin):
    global pulsos
    pulsos += 1

# Interrupción (detecta el cambio de señal)
sensor.irq(trigger=Pin.IRQ_RISING, handler=contar)

while True:
    print("Pulsos detectados:", pulsos)
    pulsos = 0
    time.sleep(1)