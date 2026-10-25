# Memora

Pastillero inteligente (ESP32, 7 × 3 compartimentos: lunes a domingo × mañana, tarde y noche) más una app Android (React Native/Expo, APK). El pastillero suena a la hora; el paciente confirma con el botón o en la app; si no confirma en 30 minutos, sus cuidadores reciben un aviso.

Proyecto universitario que simula un producto real. Detalle técnico: [docs/plan-memora.md](docs/plan-memora.md).

## Usuarios

- **Paciente:** cualquier persona que toma medicación (no solo adultos mayores). Usa la app en el celular, muchas veces con poca vista o apurado. Necesita saber qué tomar ahora y confirmarlo en un toque.
- **Cuidador:** familiar o enfermera que cuida a uno o varios pacientes. Necesita enterarse rápido si alguien no tomó su medicación. No confirma tomas; puede editar horarios si el paciente le da permiso.
- Una misma persona puede ser las dos cosas.

## Tono

Cercano, tranquilo y confiable. Español claro de Perú, sin jerga técnica. Nada de culpas: "No se confirmó", nunca "Fallaste".

## Dirección visual (decidida con el usuario)

- Nivel de app comercial moderna, inspirada en apps financieras recientes: tarjeta principal de color profundo, íconos en baldosas redondeadas, sombras suaves, barra inferior con botón central.
- Color principal: verde azulado profundo con degradado suave.
- Onboarding guiado tipo Fitia: "Crea mi rutina", nombre, rol y horarios, paso a paso.
- Solo celular (Android).

## Restricciones

- Accesibilidad WCAG 2.2 AA: contraste, texto grande, toques de 48 px o más.
- Solo 3 franjas por día. El cuidador no confirma tomas.
