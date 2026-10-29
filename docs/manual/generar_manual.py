"""Manual de usuario de Memora en PDF. Uso: python generar_manual.py (necesita Microsoft Edge)."""
import os
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))


def pantalla(img, pie):
    return f'<figure><img src="img/{img}.png" alt="{pie}"><figcaption>{pie}</figcaption></figure>'


def seccion(num, titulo, cuerpo, pantallas=(), salto=False):
    figs = ''.join(pantalla(i, p) for i, p in pantallas)
    clase = 'sec salto' if salto else 'sec'
    lado = f'<div class="figs n{len(pantallas)}">{figs}</div>' if pantallas else ''
    return f'<section class="{clase}"><h2><span>{num}</span>{titulo}</h2><div class="fila"><div class="txt">{cuerpo}</div>{lado}</div></section>'


def pasos(*items):
    return '<ol>' + ''.join(f'<li>{i}</li>' for i in items) + '</ol>'


def nota(texto):
    return f'<p class="nota">{texto}</p>'


S = []

S.append(seccion(1, 'Qué es Memora', """
<p>Memora tiene dos partes que trabajan juntas:</p>
<ul>
<li>El <b>pastillero</b>: una caja de 7 días por 4 tomas (mañana, mediodía, tarde y noche). A la hora de cada toma suena y prende su luz verde. Cuando tomas la pastilla, presionas su botón.</li>
<li>La <b>app Memora</b> en tu celular: ahí armas tu rutina, ves qué toca hoy y confirmas tus tomas. Tu familia también puede instalarla para acompañarte.</li>
</ul>
<p>Si pasan 30 minutos y la toma no se confirma, Memora les avisa a las personas que te cuidan.</p>
<h3>Lo que necesitas</h3>
<ul>
<li>Un celular Android con internet.</li>
<li>El pastillero enchufado a un cargador de celular (5 V).</li>
<li>Una red Wi-Fi de <b>2,4 GHz</b> para el pastillero. Las redes de 5 GHz no funcionan.</li>
<li>El código QR que viene pegado dentro de la tapa del pastillero.</li>
</ul>
""", [('Bienvenida', 'Pantalla de inicio')], salto=True))

S.append(seccion(2, 'Instalar la app', pasos(
    'Abre en tu celular el enlace de descarga del archivo <b>Memora.apk</b>.',
    'Toca <b>Descargar</b> y, al terminar, abre el archivo.',
    'Si Android pide permiso para instalar apps de fuentes desconocidas, actívalo solo para tu navegador o tu gestor de archivos.',
    'Toca <b>Instalar</b>. El ícono de Memora aparece en tu pantalla de inicio.',
) + nota('La primera vez que abras Memora, el celular te preguntará si permites notificaciones. Toca <b>Permitir</b>: así te llega el recordatorio a la hora de cada toma y, si cuidas a alguien, el aviso cuando no confirma.')))

S.append(seccion(3, 'Conoce tu pastillero', """
<table>
<tr><th>Lo que ves u oyes</th><th>Qué significa</th></tr>
<tr><td>Luz verde fija</td><td>Está conectado a internet y a Memora.</td></tr>
<tr><td>Luz verde apagada</td><td>Está sin internet. Igual suena a sus horas.</td></tr>
<tr><td>Bip-bip y luz que parpadea</td><td>Es hora de una toma.</td></tr>
<tr><td>Botón</td><td>Presiónalo cuando suene: apaga la alarma y avisa en la app que ya tomaste.</td></tr>
<tr><td>Botón presionado 10 segundos (sin alarma)</td><td>Borra el Wi-Fi guardado, para conectarlo a otra red.</td></tr>
</table>
<p>Las 4 filas de colores son las 4 tomas del día: <b>mañana</b> (amarilla), <b>mediodía</b> (celeste), <b>tarde</b> (lila) y <b>noche</b> (rosa). Cada columna es un día, de lunes a domingo.</p>
<p>El pastillero guarda tu horario y la hora, así que suena aunque se vaya el internet.</p>
"""))

S.append(seccion(4, 'Crear tu cuenta', pasos(
    'En la pantalla de inicio toca <b>Crear mi rutina</b>.',
    'Escribe tus nombres, tus apellidos y cómo quieres que te llamemos. Ese nombre corto es el que verás en el saludo.',
    'Escribe tu celular. Marca <b>Este número tiene WhatsApp</b> si lo usas, para que tu familia pueda escribirte con un toque.',
    'Elige cómo usarás Memora: <b>Tomo medicamentos</b>, <b>Cuido a alguien</b> o <b>Las dos cosas</b>.',
), [('OnbNombre', 'Paso 1: tu nombre'), ('OnbCelular', 'Paso 2: tu celular')], salto=True))

S.append(seccion('', '', pasos(
    'Pon la hora de cada toma. Son las 4 filas de colores de tu pastillero; puedes cambiarlas después.',
    'Agrega tu primer medicamento: nombre, dosis y en qué momentos del día lo tomas. Si prefieres, toca <b>Lo agrego después</b>.',
    'Escribe tu correo y una contraseña de al menos 8 caracteres, y toca <b>Crear cuenta</b>.',
) + nota('Si solo cuidas a alguien, la app no te pide horarios ni medicamentos. Después de crear la cuenta te pide el código de invitación (sección 12).'),
    [('OnbRol', 'Paso 3: cómo usarás Memora'), ('OnbHorarios', 'Paso 4: tus horarios')]))

S.append(seccion('', '', '', [('OnbMedicamento', 'Paso 5: primer medicamento'), ('OnbCuenta', 'Paso 6: tu cuenta')]))

S.append(seccion(5, 'Conectar el pastillero', """
<p><b>Vincúlalo a tu cuenta</b></p>
""" + pasos(
    'En la pantalla <b>Conecta tu pastillero</b>, apunta la cámara al QR pegado dentro de la tapa.',
    'Si la cámara no lo lee, toca <b>Escribir el código a mano</b> y copia el código que está debajo del QR, por ejemplo MEM-0001-XXXXXX.',
) + """
<p><b>Dale tu Wi-Fi (solo la primera vez)</b></p>
""" + pasos(
    'Enchufa el pastillero. Si no conoce ninguna red, crea la suya: <b>Memora-MEM-0001</b>.',
    'En los ajustes de Wi-Fi de tu celular, conéctate a <b>Memora-MEM-0001</b>. Se abre una página; si no, entra a 192.168.4.1 en el navegador.',
    'Toca <b>Configure WiFi</b>, elige tu red de 2,4 GHz, escribe su clave y guarda.',
    'Cuando la luz verde quede fija, ya está listo. Vuelve tu celular a tu Wi-Fi de siempre.',
) + nota('Si usas la zona Wi-Fi de otro celular, desactiva su apagado automático. Muchos celulares la apagan cuando nadie está conectado y el pastillero se queda sin internet.'),
    [('Vincular', 'Conecta tu pastillero'), ('Listo', 'Tu rutina, lista')], salto=True))

S.append(seccion(6, 'Tu día: la pantalla Hoy', """
<p>Es la pantalla principal. Arriba ves la toma que toca y qué compartimento abrir. En la esquina, <b>En línea</b> indica que el pastillero está conectado.</p>
<p>Cuando el pastillero suena tienes tres opciones:</p>
<ul>
<li><b>Presionar el botón del pastillero.</b> Se calla y la app marca la toma como tomada en pocos segundos.</li>
<li><b>Ya la tomé</b>, en la app: apaga el sonido y marca la toma.</li>
<li><b>Solo apagar el sonido</b>: se calla, pero la toma sigue pendiente. Confírmala cuando la tomes. Si pasan 30 minutos, tu familia recibe un aviso.</li>
</ul>
<p>A la misma hora te llega una notificación al celular, por ejemplo <b>Hora de tus pastillas de la tarde</b>. Llega aunque la app esté cerrada.</p>
<p>Si te equivocaste, toca <b>Deshacer</b> y la toma vuelve a quedar pendiente.</p>
<p>Abajo está la lista del día: <b>Tomada</b> con su hora, <b>Ahora</b>, <b>Pendiente</b> o <b>Libre</b> (sin medicamentos en ese momento).</p>
""", [('Hoy', 'Hoy, con la alarma sonando')], salto=True))

S.append(seccion(7, 'Pastillero y horarios', """
<p>Toca la pestaña <b>Pastillero</b>.</p>
<ul>
<li>La cuadrícula es igual a tu pastillero: el número dice cuántos medicamentos van en cada compartimento. La columna de hoy está resaltada.</li>
<li><b>Probar sonido</b> hace sonar el pastillero; vuelve a tocar el botón, que ahora dice <b>Apagar</b>, para callarlo.</li>
<li>Para cambiar una hora, toca <b>−</b> o <b>+</b> (en pasos de 15 minutos) y luego <b>Guardar horarios</b>. El pastillero recibe la hora nueva en segundos.</li>
</ul>
""", [('Pastillero', 'Pastillero y horarios')]))

S.append(seccion(8, 'Medicamentos', pasos(
    'Desde Pastillero toca <b>Medicamentos</b>, o toca el botón <b>+</b> de la barra de abajo.',
    'Para uno nuevo: escribe nombre y dosis, elige los momentos del día y los días de la semana, y toca <b>Guardar medicamento</b>.',
    'Para cambiar uno, tócalo en la lista. Para quitarlo, entra y toca <b>Quitar medicamento</b>.',
) + '<p>Cada cambio actualiza solo el horario del pastillero: solo suena en los momentos que tienen medicamento.</p>',
    [('Medicamentos', 'Lista de medicamentos'), ('NuevoMedicamento', 'Nuevo medicamento')], salto=True))

S.append(seccion(9, 'Historial', """
<p>La pestaña <b>Historial</b> muestra tu semana: cada barra es un día, en turquesa las tomas confirmadas y en naranja las que no se confirmaron.</p>
<p>Debajo ves el porcentaje de tomas confirmadas de las últimas 4 semanas y la lista de tomas sin confirmar de esta semana.</p>
""", [('Historial', 'Historial de la semana')]))

S.append(seccion(10, 'Mi familia', pasos(
    'Toca la pestaña <b>Familia</b>.',
    'En <b>Invita a un familiar</b> aparece tu código (vence en 24 horas). Cópialo o toca <b>Compartir por WhatsApp</b>.',
    'Tu familiar lo escribe en su app (sección 12) y aparece en tu lista.',
) + """
<p>Junto a cada familiar tienes botones para llamarlo o escribirle por WhatsApp. El interruptor <b>Puede editar mis horarios</b> le da permiso para cambiar tus horas y medicamentos. Las tomas solo las confirmas tú.</p>
""", [('Cuidadores', 'Mi familia')], salto=True))

S.append(seccion(11, 'Perfil y ajustes', """
<p>Toca tu inicial, arriba a la izquierda en <b>Hoy</b>.</p>
<ul>
<li><b>Datos personales</b>: nombre, cómo te llamamos, celular, correo y contraseña.</li>
<li><b>Avisar a mi familia tras</b>: tócalo para elegir 15, 30, 45 o 60 minutos.</li>
<li><b>Avisos en el celular</b>: el recordatorio a la hora de cada toma y, si cuidas a alguien, el aviso cuando no confirma. <b>Avisos por WhatsApp</b>: actívalo si prefieres ese medio.</li>
<li><b>Cambiar el Wi-Fi del pastillero</b>: repite los pasos de la sección 5.</li>
<li><b>Cerrar sesión</b>, al final de la pantalla.</li>
</ul>
""", [('Perfil', 'Mi perfil y ajustes'), ('DatosPersonales', 'Datos personales')]))

S.append(seccion(12, 'Si cuidas a alguien', pasos(
    'Crea tu cuenta eligiendo <b>Cuido a alguien</b>.',
    'Escribe el código de invitación que te pasó tu familiar, elige qué es de ti (mamá, papá, etc.) y toca <b>Unirme</b>.',
    'En <b>Personas que cuido</b> ves a cada persona con sus tomas de hoy. Si alguien no confirmó a tiempo, aparece un aviso naranja arriba.',
    'Toca a la persona para ver su semana, llamarla o escribirle por WhatsApp. Si te dio permiso, verás <b>Editar sus horarios</b>.',
) + nota('Como cuidador no puedes confirmar tomas. Si tu familiar ya la tomó, pídele que presione el botón del pastillero.'),
    [('Codigo', 'Código de invitación'), ('MisPacientes', 'Personas que cuido')], salto=True))

S.append(seccion('', '', '', [('PacienteDetalle', 'Detalle de la persona')]))

S.append(seccion(13, 'Volver a entrar', """
<p>Si cambias de celular o cerraste sesión, toca <b>Iniciar sesión</b> en la pantalla de inicio y escribe tu correo y contraseña. Tu rutina sigue guardada.</p>
<p>Si no recuerdas la contraseña:</p>
""" + pasos(
    'Toca <b>Olvidé mi contraseña</b>, escribe tu correo y toca <b>Enviar código</b>.',
    'Revisa tu correo (también la carpeta de spam). Te llega un mensaje de Memora con un código de 6 números.',
    'Escribe ese código y tu contraseña nueva (mínimo 8 caracteres) y toca <b>Guardar y entrar</b>.',
) + nota('El código vence en 15 minutos y sirve una sola vez. Si te equivocas 5 veces, pide uno nuevo después de 15 minutos. Al cambiar la contraseña se cierra tu sesión en los otros celulares.') + """
""", [('Login', 'Iniciar sesión'), ('OlvideClave', 'Olvidé mi contraseña')], salto=True))

S.append(seccion(14, 'Si algo no funciona', """
<table>
<tr><th>Problema</th><th>Qué hacer</th></tr>
<tr><td>La app dice <b>Sin conexión</b> o la luz verde no queda fija</td><td>Revisa que el Wi-Fi del pastillero esté prendido y sea de 2,4 GHz. Si cambiaste de red, mantén su botón 10 segundos y repite la sección 5.</td></tr>
<tr><td>No aparece la red <b>Memora-MEM-0001</b></td><td>Desenchufa el pastillero y vuelve a enchufarlo. La red aparece cerca de un minuto después y dura 3 minutos.</td></tr>
<tr><td>No sonó a la hora</td><td>Ese momento del día debe tener un medicamento para ese día. Revisa la cuadrícula en <b>Pastillero</b>.</td></tr>
<tr><td>La app no muestra la toma como tomada</td><td>Espera unos segundos: la app se actualiza sola cada 5 segundos. Si no hay internet, confírmala con <b>Ya la tomé</b>.</td></tr>
<tr><td>No me llegan las notificaciones</td><td>Revisa que Memora tenga permiso de notificaciones en los ajustes del celular y que <b>Avisos en el celular</b> esté activado en tu perfil. Luego cierra sesión y vuelve a entrar. Si tu celular ahorra batería, quita a Memora de esa lista.</td></tr>
<tr><td>Mi familiar no recibe avisos</td><td>Debe tener la app instalada, haber aceptado las notificaciones y tener activado <b>Avisos en el celular</b> en su perfil.</td></tr>
<tr><td>No me llega el código para cambiar la contraseña</td><td>Espera un minuto y revisa spam. Comprueba que escribiste el mismo correo de tu cuenta. Si pediste varios, usa solo el último.</td></tr>
<tr><td>El QR no se lee</td><td>Toca <b>Escribir el código a mano</b> y copia el código escrito debajo del QR.</td></tr>
</table>
""", salto=True))

PORTADA = """<section class="portada">
<img class="logo" src="../../assets/marca/logo-horizontal.png" alt="Memora">
<h1>Manual de usuario</h1>
<p class="sub">App Memora y pastillero inteligente</p>
<img class="icono" src="../../assets/marca/icono-app.png" alt="">
<p class="pie">Versión 1.1 · octubre de 2026</p>
</section>"""

INDICE = """<section class="indice"><h2>Contenido</h2><ol>
<li>Qué es Memora</li><li>Instalar la app</li><li>Conoce tu pastillero</li><li>Crear tu cuenta</li><li>Conectar el pastillero</li>
<li>Tu día: la pantalla Hoy</li><li>Pastillero y horarios</li><li>Medicamentos</li><li>Historial</li><li>Mi familia</li>
<li>Perfil y ajustes</li><li>Si cuidas a alguien</li><li>Volver a entrar</li><li>Si algo no funciona</li></ol></section>"""

CSS = """
@page { size: A4; margin: 16mm 15mm 16mm; }
body { font-family: "Segoe UI", Arial, sans-serif; color: #0E2733; font-size: 11.5pt; line-height: 1.5; margin: 0; }
.portada { height: 255mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; }
.portada .logo { width: 70mm; } .portada h1 { font-size: 34pt; color: #0A4A66; margin: 14mm 0 2mm; }
.portada .sub { font-size: 15pt; color: #4A5F68; margin: 0; } .portada .icono { width: 55mm; margin: 16mm 0; } .portada .pie { color: #4A5F68; }
.indice { page-break-after: always; } .indice ol { font-size: 13pt; line-height: 2; }
h2 { font-size: 18pt; color: #0A4A66; margin: 0 0 4mm; display: flex; align-items: center; gap: 3mm; border-bottom: 2px solid #0E8FA3; padding-bottom: 2mm; }
h2 span { background: #0D7385; color: #fff; border-radius: 50%; width: 9mm; height: 9mm; display: inline-flex; align-items: center; justify-content: center; font-size: 13pt; }
h2:empty, h2 span:empty { display: none; }
h3 { color: #0A4A66; margin: 5mm 0 1mm; }
.sec { margin-bottom: 9mm; } .salto { break-before: page; }
.fila { display: block; }
.txt { flex: 1; } .txt p { margin: 0 0 3mm; } ol, ul { margin: 0 0 3mm; padding-left: 6mm; } li { margin-bottom: 2mm; }
.figs { display: flex; gap: 6mm; justify-content: center; margin-top: 4mm; } .figs.n0 { display: none; }
figure { margin: 0; width: 50mm; text-align: center; break-inside: avoid; }
figure img { width: 50mm; border-radius: 5mm; border: 1px solid #C9DCE2; box-shadow: 0 2mm 4mm rgba(10,74,102,.15); }
figcaption { font-size: 9pt; color: #4A5F68; margin-top: 2mm; }
.fila:has(.txt:empty) .txt { display: none; }
h2 { break-after: avoid; } table, .nota { break-inside: avoid; }
.nota { background: #FFF6E0; border-left: 4px solid #E5A823; padding: 2.5mm 3.5mm; font-size: 10.5pt; }
table { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-bottom: 3mm; }
th, td { border: 1px solid #D6E5EA; padding: 2mm 3mm; text-align: left; vertical-align: top; } th { background: #0A4A66; color: #fff; }
"""

if __name__ == '__main__':
    html = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Memora: manual de usuario</title><style>{CSS}</style></head><body>{PORTADA}{INDICE}{"".join(S)}</body></html>'
    ruta = os.path.join(AQUI, 'manual-usuario-memora.html')
    open(ruta, 'w', encoding='utf-8').write(html)
    pdf = os.path.join(AQUI, 'Manual-de-usuario-Memora.pdf')
    edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    subprocess.run([edge, '--headless', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={pdf}',
                    'file:///' + ruta.replace('\\', '/')], check=True)
    print('listo:', pdf)
