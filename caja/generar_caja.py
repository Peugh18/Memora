"""Plantilla de corte láser de la caja Memora (trupán/MDF).

Uso: python generar_caja.py  -> crea memora-caja-corte.svg (para el taller) y memora-caja-guia.svg (con nombres).
Todas las medidas en mm. Cambia las de arriba si el trupán mide distinto o quieres otros huecos.
"""

T = 3                   # grosor del trupán
HUECO = (30, 30, 25)    # cada hueco del pastillero: ancho, fondo, profundidad
DIAS, TOMAS = 7, 4      # columnas (lunes a domingo) y filas (mañana, mediodía, tarde, noche)
ALTO_ELECTRONICA = 40   # compartimiento de abajo: protoboard + ESP32 + cables

# Bandeja = pastillero: 28 huecos hechos con separadores encajados (sale de la caja para cargarla)
BI_L = DIAS * HUECO[0] + (DIAS - 1) * T    # interior
BI_A = TOMAS * HUECO[1] + (TOMAS - 1) * T
B_L, B_A = BI_L + 2 * T, BI_A + 2 * T      # exterior
SEP_ALTO = HUECO[2]                        # separadores
B_PARED = SEP_ALTO + 3  # el acrílico de la tapa baja 2 mm: queda 1 mm sobre los separadores (no pasa una pastilla)
# Caja: 2 mm de aire alrededor de la bandeja
CI_L, CI_A = B_L + 4, B_A + 4
C_L, C_A = CI_L + 2 * T, CI_A + 2 * T
C_PARED = ALTO_ELECTRONICA + T + (T + B_PARED)  # piso -> electrónica -> repisa -> bandeja

CORTE = 'fill="none" stroke="#FF0000" stroke-width="0.1"'
GRABADO = 'fill="#000000"'


def rect(x, y, w, h):
    return f'M{x},{y} h{w} v{h} h{-w} Z '


def circulo(cx, cy, r):
    return f'M{cx - r},{cy} a{r},{r} 0 1 0 {2 * r},0 a{r},{r} 0 1 0 {-2 * r},0 Z '


def ranura(cx, cy, w, h):  # rectángulo de puntas redondas
    r = h / 2
    return (f'M{cx - w / 2 + r},{cy - r} h{w - h} a{r},{r} 0 0 1 0,{h} '
            f'h{-(w - h)} a{r},{r} 0 0 1 0,{-h} Z ')


def con_muesca(x, y, w, h, r):  # borde superior con media luna para meter los dedos
    return (f'M{x},{y} h{w / 2 - r} a{r},{r} 0 0 0 {2 * r},0 h{w / 2 - r} '
            f'v{h} h{-w} Z ')


def separador(x, y, largo, posiciones, desde_arriba):
    """Tira con ranuras de medio alto que encajan en cruz con las otras (como una caja de huevos)."""
    h, d = SEP_ALTO, SEP_ALTO / 2
    puntos = []
    borde = 0 if desde_arriba else h
    hacia = 1 if desde_arriba else -1
    puntos.append((0, borde))
    for p in posiciones:
        puntos += [(p, borde), (p, borde + hacia * d), (p + T, borde + hacia * d), (p + T, borde)]
    puntos.append((largo, borde))
    puntos += [(largo, h - borde), (0, h - borde)]
    return 'M' + ' L'.join(f'{x + a:.2f},{y + b:.2f}' for a, b in puntos) + ' Z '


def letras_huecos(x, y):  # grabado en el piso de la bandeja: día y toma en cada hueco
    dias = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']
    tomas = ['mañana', 'mediodía', 'tarde', 'noche']  # la mañana va adelante
    g = f'<g {GRABADO} font-family="Arial, sans-serif" text-anchor="middle">'
    for i in range(DIAS):
        for j in range(TOMAS):
            cx = x + T + i * (HUECO[0] + T) + HUECO[0] / 2
            y0 = y + T + (TOMAS - 1 - j) * (HUECO[1] + T)
            g += (f'<text x="{cx:.2f}" y="{y0 + 15:.2f}" font-size="8" font-weight="700">{dias[i]}</text>'
                  f'<text x="{cx:.2f}" y="{y0 + 23:.2f}" font-size="4">{tomas[j]}</text>')
    return g + '</g>'


def logo(x, y, ancho):  # logo Memora en una sola tinta para grabar
    e = ancho / 560
    return f'''<g transform="translate({x},{y}) scale({e})" {GRABADO}>
<g font-family="Onest, 'Segoe UI', Arial, sans-serif" font-weight="800" font-size="104">
<text x="6" y="128" textLength="288" lengthAdjust="spacingAndGlyphs">MEM</text>
<text x="398" y="128" textLength="152" lengthAdjust="spacingAndGlyphs">RA</text></g>
<circle cx="345" cy="91" r="35" fill="none" stroke="#000" stroke-width="15"/>
<g transform="rotate(-45 345 91)">
<path d="M345 80 H333 a11 11 0 0 0 0 22 H345 Z" fill="none" stroke="#000" stroke-width="3.5"/>
<path d="M345 80 H357 a11 11 0 0 1 0 22 H345 Z"/></g>
<g stroke="#000" stroke-width="7" stroke-linecap="round" fill="none">
<path d="M345 36 V22"/><path d="M323 42 L314 31"/><path d="M367 42 L376 31"/></g></g>'''


def piezas():
    """(nombre, ancho, alto, función que dibuja en x,y -> (corte, grabado))"""
    y_ctrl = C_PARED - ALTO_ELECTRONICA / 2  # altura de LED/pulsador: mitad del compartimiento de abajo

    def frente(x, y):
        c = rect(x, y, C_L, C_PARED)
        c += circulo(x + 55, y + y_ctrl, 2.6)          # LED 5 mm
        c += circulo(x + C_L / 2, y + y_ctrl, 6.25)    # pulsador 12 mm
        for i in range(3):                             # rejilla del buzzer
            for j in range(3):
                c += circulo(x + C_L - 60 + i * 5, y + y_ctrl - 5 + j * 5, 1.5)
        return c, logo(x + (C_L - 80) / 2, y + 21, 80)  # debajo del broche de cierre (ocupa ~2 cm arriba)

    def costado(x, y):  # con muesca arriba para agarrar la bandeja por los lados
        return con_muesca(x, y, CI_A, C_PARED, 12), ''

    def costado_usb(x, y):
        return con_muesca(x, y, CI_A, C_PARED, 12) + ranura(x + CI_A / 2, y + y_ctrl, 16, 12), ''

    def tapa(x, y):
        return rect(x, y, C_L, C_A) + rect(x + 20, y + 20, C_L - 40, C_A - 40), ''

    def repisa(x, y):  # se apoya en los listones; con agujero para levantarla
        return rect(x, y, CI_L - 2, CI_A - 2) + circulo(x + 25, y + (CI_A - 2) / 2, 12.5), ''

    simple = lambda w, h: (lambda x, y: (rect(x, y, w, h), ''))
    holgura = .5  # los separadores son medio mm más cortos que el interior para que entren sin forzar
    largo_l, largo_c = BI_L - holgura, BI_A - holgura
    pos_l = [i * (HUECO[0] + T) - T - holgura / 2 for i in range(1, DIAS)]
    pos_c = [j * (HUECO[1] + T) - T - holgura / 2 for j in range(1, TOMAS)]
    sep_l = lambda x, y: (separador(x, y, largo_l, pos_l, True), '')
    sep_c = lambda x, y: (separador(x, y, largo_c, pos_c, False), '')
    return [
        ('1 Piso', C_L, C_A, simple(C_L, C_A)),
        ('2 Tapa con ventana', C_L, C_A, tapa),
        ('3 Repisa (sacable)', CI_L - 2, CI_A - 2, repisa),
        ('4 Bandeja: piso (grabado)', B_L, B_A, lambda x, y: (rect(x, y, B_L, B_A), letras_huecos(x, y))),
        ('5 Frente', C_L, C_PARED, frente),
        ('6 Atrás (bisagras)', C_L, C_PARED, simple(C_L, C_PARED)),
        ('7 Costado izq. (USB)', CI_A, C_PARED, costado_usb),
        ('8 Costado der.', CI_A, C_PARED, costado),
        ('9 Bandeja: frente', B_L, B_PARED, simple(B_L, B_PARED)),
        ('10 Bandeja: atrás', B_L, B_PARED, simple(B_L, B_PARED)),
        ('11 Bandeja: costado', BI_A, B_PARED, simple(BI_A, B_PARED)),
        ('12 Bandeja: costado', BI_A, B_PARED, simple(BI_A, B_PARED)),
        ('13 Listón', CI_A - 6, 10, simple(CI_A - 6, 10)),
        ('14 Listón', CI_A - 6, 10, simple(CI_A - 6, 10)),
    ] + [(f'{15 + i} Separador largo', largo_l, SEP_ALTO, sep_l) for i in range(TOMAS - 1)]       + [(f'{15 + TOMAS - 1 + i} Separador corto', largo_c, SEP_ALTO, sep_c) for i in range(DIAS - 1)]


def acomodar(lista, ancho_hoja=760, sep=5):  # filas simples, de mayor a menor alto
    x = y = sep
    alto_fila = 0
    for nombre, w, h, dibujar in lista:
        if x + w + sep > ancho_hoja:
            x, y, alto_fila = sep, y + alto_fila + sep, 0
        yield nombre, w, h, dibujar, x, y
        x += w + sep
        alto_fila = max(alto_fila, h)


def generar(guia):
    lista = sorted(piezas(), key=lambda p: -p[2])
    cortes, grabados, textos = '', '', ''
    W = H = 0
    for nombre, w, h, dibujar, x, y in acomodar(lista):
        c, g = dibujar(x, y)
        cortes += c
        grabados += g
        textos += f'<text x="{x + 3}" y="{y + h - 3}" font-size="6" fill="#1565C0" font-family="Arial">{nombre} · {w / 10:g} × {h / 10:g} cm</text>'
        W, H = max(W, x + w + 5), max(H, y + h + 5)
    fondo = f'<rect width="{W}" height="{H}" fill="#F3E2C3"/>' if guia else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">'
            f'{fondo}<path d="{cortes}" {CORTE}/>{grabados}{textos if guia else ""}</svg>')


def comprobar():
    """Que todo encaje: falla si un cambio de medidas rompe algo."""
    assert SEP_ALTO / 2 * 2 == SEP_ALTO                        # ranuras de medio alto se completan
    alto_tapa = T + C_PARED                                    # donde apoya la tapa
    alto_bandeja = T + ALTO_ELECTRONICA + T + T + B_PARED      # piso + electrónica + repisa + bandeja
    assert alto_bandeja == alto_tapa                           # la bandeja queda al ras
    aire = (alto_tapa - 2) - (T + ALTO_ELECTRONICA + T + T + SEP_ALTO)
    assert 0 < aire <= 1.5, aire                               # acrílico no toca y no pasa una pastilla
    assert CI_L - B_L == 4 and CI_A - B_A == 4                 # 2 mm de aire por lado
    assert 15 > 2 * T + 2                                      # el acrílico cae dentro de la bandeja, no sobre sus paredes
    y_ctrl = C_PARED - ALTO_ELECTRONICA / 2
    assert 21 + 80 * 150 / 560 < y_ctrl - 6.25                 # el logo no choca con el pulsador
    assert ALTO_ELECTRONICA - 10 > 20 + 6.25                   # los listones quedan sobre los controles


if __name__ == '__main__':
    comprobar()
    open('memora-caja-corte.svg', 'w', encoding='utf-8').write(generar(False))
    open('memora-caja-guia.svg', 'w', encoding='utf-8').write(generar(True))
    print(f'Caja exterior: {C_L} x {C_A} x {C_PARED + 2 * T} mm (con tapa)')
    print(f'Bandeja exterior: {B_L} x {B_A} x {B_PARED + T} mm; {DIAS * TOMAS} huecos de {HUECO[0]} x {HUECO[1]} x {SEP_ALTO} mm')
    print(f'Piezas de trupán: {len(piezas())}')
    print(f'Acrílico de la ventana (aparte, 2 mm): {C_L - 30} x {C_A - 30} mm')
