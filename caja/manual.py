"""Manual de armado de la caja Memora en PDF (usa las medidas de generar_caja.py).

Uso: python manual.py  -> memora-caja-manual.html y, con Edge, memora-caja-manual.pdf
"""
import math
import os
import subprocess

import generar_caja as g

T, CL, CA, CP = g.T, g.C_L, g.C_A, g.C_PARED
BL, BA, BP = g.B_L, g.B_A, g.B_PARED
CM = lambda mm: f'{mm / 10:g}'.replace('.', ',')

MADERA = ('#E9D3AE', '#F3E4C8', '#C9A774')
NUEVO = ('#8FD8DF', '#C4EEF1', '#4FB3C0')
GRIS = ('#9AA3A8', '#C3CACE', '#6F787D')


class Iso:
    """Dibujo en perspectiva simple: x = largo, y = fondo, z = alto (mm)."""

    def __init__(self, k=1.3, ox=30, oy=None, alto=300):
        self.k, self.ox, self.oy, self.alto, self.s = k, ox, oy or alto - 30, alto, []

    def p(self, x, y, z):
        return (round(self.ox + self.k * (x + .45 * y), 1), round(self.oy - self.k * (z + .26 * y), 1))

    def poly(self, pts, fill, op=1, sw=.7):
        pts = ' '.join(f'{a},{b}' for a, b in pts)
        self.s.append(f'<polygon points="{pts}" fill="{fill}" stroke="#7A5C33" stroke-width="{sw}" '
                      f'stroke-linejoin="round" opacity="{op}"/>')

    def caja(self, x0, y0, z0, dx, dy, dz, col=MADERA, op=1, muesca=0):
        x1, y1, z1, p = x0 + dx, y0 + dy, z0 + dz, self.p
        self.poly([p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], col[1], op)
        der = [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1)]
        if muesca:  # media luna en el borde de arriba de la cara derecha
            ym = (y0 + y1) / 2
            der += [p(x1, ym + muesca * math.cos(a / 10 * math.pi), z1 - muesca * math.sin(a / 10 * math.pi)) for a in range(11)]
        der.append(p(x1, y0, z1))
        self.poly(der, col[2], op)
        self.poly([p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)], col[0], op)

    def circulo(self, x, z, r, fill, y=0):
        cx, cy = self.p(x, y, z)
        self.s.append(f'<circle cx="{cx}" cy="{cy}" r="{r * self.k}" fill="{fill}" stroke="#5C4425" stroke-width=".5"/>')

    def texto(self, x, y, z, t, size=11, fill='#1F2D33', anchor='middle', peso=600):
        a, b = self.p(x, y, z)
        self.s.append(f'<text x="{a}" y="{b}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{peso}">{t}</text>')

    def linea(self, a, b, color='#0E6E7E', ancho=1.2, guion=''):
        self.s.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="{color}" stroke-width="{ancho}" '
                      f'{"stroke-dasharray=" + chr(34) + guion + chr(34) if guion else ""}/>')

    def svg(self, ancho=470):
        return f'<svg viewBox="0 0 {ancho} {self.alto}" width="100%">{"".join(self.s)}</svg>'


def frente_detalles(d, logo=True):
    yc = 20
    d.circulo(55, T + yc, 2.6, '#3FBF6F')
    d.circulo(CL / 2, T + yc, 6.25, '#E04848')
    for i in range(3):
        for j in range(3):
            d.circulo(CL - 60 + i * 5, T + yc - 5 + j * 5, 1.4, '#5C4425')
    if logo:
        d.texto(CL / 2, 0, T + CP - 40, 'MEMORA', 15, '#6B4E2A')


def caja_base(d, nuevos=(), der=True):
    c = lambda n: NUEVO if n in nuevos else MADERA
    d.caja(0, 0, 0, CL, CA, T, c('piso'))
    d.caja(0, CA - T, T, CL, T, CP, c('atras'))
    d.caja(0, T, T, T, CA - 2 * T, CP, c('lados'), muesca=12)
    if der:
        lado_der(d, nuevos)


def lado_der(d, nuevos=()):  # va después de la bandeja para que no la tape
    d.caja(CL - T, T, T, T, CA - 2 * T, CP, NUEVO if 'lados' in nuevos else MADERA, muesca=12)


def frente(d, nuevos=(), op=1):
    d.caja(0, 0, T, CL, T, CP, NUEVO if 'frente' in nuevos else MADERA, op)
    if op == 1:
        frente_detalles(d)


def bandeja(d, x, y, z, nuevo=False, rejilla=True, nueva_rejilla=False):
    col = NUEVO if nuevo else MADERA
    d.caja(x, y, z, BL, BA, T, col)
    d.caja(x, y + BA - T, z + T, BL, T, BP, col)
    d.caja(x, y + T, z + T, T, BA - 2 * T, BP, col)
    if rejilla:  # de atrás hacia adelante para que se tapen bien
        cr = NUEVO if nueva_rejilla else MADERA
        ix, iy, z0, (h0, h1, sh) = x + T, y + T, z + T, g.HUECO
        for k in range(g.TOMAS - 1, -1, -1):
            for i in range(1, g.DIAS):
                d.caja(ix + i * (h0 + T) - T, iy + k * (h1 + T), z0, T, h1, sh, cr)
            if k:
                d.caja(ix, iy + k * (h1 + T) - T, z0, g.BI_L, T, sh, cr)
    d.caja(x + BL - T, y + T, z + T, T, BA - 2 * T, BP, col)
    d.caja(x, y, z + T, BL, T, BP, col)


def tapa_abierta(d):
    z0 = T + CP
    d.caja(0, CA - T, z0, CL, T, CA, MADERA)
    a, b = d.p(20, CA - T, z0 + 20), d.p(CL - 20, CA - T, z0 + CA - 20)
    d.s.append(f'<rect x="{a[0]}" y="{b[1]}" width="{b[0] - a[0]}" height="{a[1] - b[1]}" fill="#D6ECF8" stroke="#7A5C33" stroke-width=".7"/>')
    for xb in (40, CL - 60):
        q = d.p(xb, CA, z0 - 4)
        d.s.append(f'<rect x="{q[0]}" y="{q[1] - 5}" width="{20 * d.k}" height="{8 * d.k}" rx="2" fill="#A07B3A" stroke="#5C4425" stroke-width=".5"/>')


def broche(d):
    q = d.p(CL / 2 - 6, 0, T + CP - 10)
    d.s.append(f'<rect x="{q[0]}" y="{q[1]}" width="{12 * d.k}" height="{12 * d.k}" rx="2" fill="#A07B3A" stroke="#5C4425" stroke-width=".5"/>')


def cota(d, a, b, texto, dx=0, dy=0):
    d.linea(a, b)
    m = ((a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy)
    d.s.append(f'<text x="{m[0]}" y="{m[1]}" font-size="15" fill="#0E6E7E" font-weight="700" text-anchor="middle">{texto}</text>')


# ---------- dibujos ----------
def dib_final():
    d = Iso(k=1.45, ox=70, alto=440)
    caja_base(d, der=False)
    bandeja(d, T + 2, T + 2, T + g.ALTO_ELECTRONICA + T)
    lado_der(d)
    frente(d)
    tapa_abierta(d)
    broche(d)
    cota(d, d.p(0, 0, -8), d.p(CL, 0, -8), f'{CM(CL)} cm', dy=16)
    cota(d, d.p(CL + 8, 0, 0), d.p(CL + 8, CA, 0), f'{CM(CA)} cm', dx=26, dy=10)
    cota(d, d.p(-8, 0, 0), d.p(-8, 0, CP + 2 * T), f'{CM(CP + 2 * T)} cm', dx=-22)
    return d.svg(560).replace('width="100%"', 'width="68%" style="display:block;margin:0 auto"')


def paso(n):
    d = Iso(k=1.15, ox=28, alto=270)
    zr = T + g.ALTO_ELECTRONICA
    if n == 1:
        d.caja(0, 0, 0, CL, CA, T, NUEVO)
        d.caja(0, CA - T, T, CL, T, CP, NUEVO)
        frente(d, ('frente',))
    elif n == 2:
        caja_base(d, ('lados',))
        frente(d)
        d.texto(0, CA / 2, T + CP + 34, 'lado del USB', 15, '#0E6E7E')
    elif n == 3:
        caja_base(d)
        d.caja(T, T + 3, zr - 10, T, CA - 2 * T - 6, 10, NUEVO)
        d.caja(CL - 2 * T, T + 3, zr - 10, T, CA - 2 * T - 6, 10, NUEVO)
        frente(d, op=.25)
        cota(d, d.p(T + 1, CA - T, T), d.p(T + 1, CA - T, zr), '4 cm', dx=-16)
    elif n == 4:
        caja_base(d)
        d.caja(30, CA - 70, T, 165, 55, 9, GRIS)
        d.caja(32, CA - 62, T + 9, 52, 28, 12, ('#2F3B44', '#46545E', '#1E272E'))
        d.linea(d.p(32, CA - 48, T + 16), d.p(-25, CA - 48, T + 16), '#222', 2.5)
        for x, col in ((55, '#3FBF6F'), (CL / 2, '#E04848'), (CL - 55, '#5C4425')):
            d.linea(d.p(x, 6, T + 20), d.p(110, CA - 60, T + 12), col, 1, '3 2')
        d.caja(0, 0, T, CL, T, CP, MADERA, .3)
        frente_detalles(d, logo=False)
    elif n == 5:
        caja_base(d)
        d.caja(T + 1, T + 1, zr, CL - 2 * T - 2, CA - 2 * T - 2, T, NUEVO)
        hx, hy = d.p(T + 25, CA / 2, zr + T)
        d.s.append(f'<ellipse cx="{hx}" cy="{hy}" rx="{12.5 * d.k}" ry="{6 * d.k}" fill="#4FB3C0" stroke="#7A5C33" stroke-width=".6"/>')
        d.caja(0, 0, T, CL, T, CP, MADERA, .3)
        frente_detalles(d, logo=False)
    elif n == 6:
        bandeja(d, 15, 10, 0, nuevo=True, rejilla=False)
        cota(d, d.p(15, 10, -8), d.p(15 + BL, 10, -8), f'{CM(BL)} cm', dy=16)
        d.texto(15 + BL / 2, 10 + T + 15, T, 'mañana (adelante)', 13, '#0E6E7E')
    elif n == 7:
        bandeja(d, 15, 10, 0, nueva_rejilla=True)
        d.texto(15 + BL / 2, 10, -14, '28 huecos de 3 × 3 cm', 15, '#0E6E7E')
    elif n == 8:
        caja_base(d, der=False)
        bandeja(d, T + 2, T + 2, T + g.ALTO_ELECTRONICA + T)
        lado_der(d)
        frente(d)
        q = d.p(CL, CA / 2, T + CP)
        d.s.append(f'<text x="{q[0] + 8}" y="{q[1] - 48}" font-size="15" fill="#0E6E7E" font-weight="700" text-anchor="end">muesca: aquí agarras la bandeja ↘</text>')
    elif n == 9:
        d = Iso(k=1.0, ox=40, alto=300)
        caja_base(d, der=False)
        bandeja(d, T + 2, T + 2, T + g.ALTO_ELECTRONICA + T)
        lado_der(d)
        frente(d)
        tapa_abierta(d)
        broche(d)
    return d.svg(500)


def dib_corte():
    """Corte visto de frente, con alturas."""
    k, x0, y0 = 1.9, 40, 250
    s = []
    R = lambda x, z, w, h, f, op=1: s.append(
        f'<rect x="{x0 + x * k}" y="{y0 - (z + h) * k}" width="{w * k}" height="{h * k}" fill="{f}" stroke="#7A5C33" stroke-width=".6" opacity="{op}"/>')
    zr, zb = T + g.ALTO_ELECTRONICA, T + g.ALTO_ELECTRONICA + T
    R(0, 0, CL, T, MADERA[0])
    R(0, T, T, CP, MADERA[2]); R(CL - T, T, T, CP, MADERA[2])
    R(T, zr - 10, T, 10, NUEVO[0]); R(CL - 2 * T, zr - 10, T, 10, NUEVO[0])
    R(T + 1, zr, CL - 2 * T - 2, T, NUEVO[2])
    R(30, T, 165, 9, GRIS[0]); R(34, T + 9, 52, 12, '#2F3B44')
    bx = T + 2
    R(bx, zb, BL, T, MADERA[0]); R(bx, zb + T, T, BP, MADERA[1]); R(bx + BL - T, zb + T, T, BP, MADERA[1])
    R(bx + T, zb + T, g.BI_L, g.SEP_ALTO, MADERA[1], .7)
    for i in range(1, g.DIAS):
        R(bx + T + i * (g.HUECO[0] + T) - T, zb + T, T, g.SEP_ALTO, MADERA[2])
    R(0, T + CP, CL, T, MADERA[0])
    R(15, T + CP - 2, CL - 30, 2, '#BFE0F5')
    xc = x0 + CL * k + 18

    def c(z1, z2, t):
        a, b = y0 - z1 * k, y0 - z2 * k
        s.append(f'<line x1="{xc}" y1="{a}" x2="{xc}" y2="{b}" stroke="#0E6E7E" stroke-width="1.2"/>'
                 f'<line x1="{xc - 4}" y1="{a}" x2="{xc + 4}" y2="{a}" stroke="#0E6E7E"/><line x1="{xc - 4}" y1="{b}" x2="{xc + 4}" y2="{b}" stroke="#0E6E7E"/>'
                 f'<text x="{xc + 8}" y="{(a + b) / 2 + 4}" font-size="11" fill="#1F2D33">{t}</text>')
    c(0, T, 'piso 0,3 cm')
    c(T, zr, 'electrónica 4 cm')
    c(zb, zb + T + BP, f'bandeja {CM(T + BP)} cm')
    c(T + CP, CP + 2 * T, 'tapa 0,3 cm')
    s.append(f'<text x="{x0 + 100 * k}" y="{y0 - (zb + 18) * k}" font-size="11" fill="#1F2D33" text-anchor="middle" font-weight="700" stroke="#fff" stroke-width="3" paint-order="stroke">huecos de 2,5 cm de hondo</text>')
    s.append(f'<text x="{x0 + 118 * k}" y="{y0 - (T + 26) * k}" font-size="10" fill="#1F2D33">protoboard + ESP32</text>')
    s.append(f'<text x="{x0 + CL * k / 2}" y="{y0 - (T + CP + 6) * k}" font-size="10" fill="#1F2D33" text-anchor="middle">acrílico (1 mm sobre los separadores: las pastillas no se pasan)</text>')
    return f'<svg viewBox="0 64 680 200" width="100%">{"".join(s)}</svg>'


def dib_pieza(dibujar, w, h, maxw=130, maxh=42):
    c, gr = dibujar(0, 0)
    e = min(maxw / w, maxh / h)
    return (f'<svg viewBox="-2 -2 {w + 4} {h + 4}" width="{w * e:.0f}" height="{h * e:.0f}">'
            f'<path d="{c}" fill="#F3E4C8" fill-rule="evenodd" stroke="#C0392B" stroke-width="{0.8 / e:.2f}"/>{gr}</svg>')


USO = {
    '1': 'Base de toda la caja. Las 4 paredes se pegan encima.',
    '2': 'Se abre con bisagras. La ventana deja ver las pastillas.',
    '3': 'Separa la electrónica del pastillero. Se saca por el agujero.',
    '4': 'Fondo del pastillero. Lleva grabado el día y la toma de cada hueco.',
    '5': 'Lleva el logo grabado, el LED, el pulsador y la rejilla del buzzer.',
    '6': 'Aquí se pegan las bisagras de la tapa.',
    '7': 'Muesca arriba y agujero para el cable USB.',
    '8': 'Muesca arriba para agarrar la bandeja.',
    '9': 'Pared de adelante del pastillero.', '10': 'Pared de atrás del pastillero.',
    '11': 'Paredes de los lados del pastillero (van entre el frente y la de atrás).',
    '13': 'Van por dentro de los costados, a 4 cm del piso. Sostienen la repisa.',
    '15': 'Separan las 4 tomas (filas). Ranuras hacia arriba.',
    '18': 'Separan los 7 días (columnas). Ranuras hacia abajo: encajan en cruz sobre los largos.',
}

PASOS = [
    ('Piso, frente y atrás', 'Pon cola sintética en el canto de abajo del frente (5) y de la parte de atrás (6), y pégalos <b>encima</b> del piso (1), al ras de los bordes. El logo mira hacia afuera. Sujeta con cinta de embalaje mientras seca (20 min).'),
    ('Costados', 'Pega el costado con el agujero USB (7) a la <b>izquierda</b> y el otro (8) a la derecha. Van <b>entre</b> el frente y la parte de atrás, también sobre el piso. Las muescas quedan arriba. Revisa con una escuadra que las esquinas queden rectas.'),
    ('Listones', 'Marca con lápiz una línea a <b>4 cm</b> del piso por dentro de cada costado. Pega los listones (13 y 14) con su borde de arriba sobre esa línea. Ahí se apoya la repisa.'),
    ('Electrónica', 'Mete el LED (5 mm), el pulsador (12 mm, con su tuerca) y el buzzer detrás de la rejilla, todo con silicona caliente por dentro. Pega la protoboard al fondo, con el <b>USB del ESP32 frente al agujero</b> del costado izquierdo. Conecta los cables hembra-macho como dice la guía de armado.'),
    ('Repisa', 'Prueba primero la electrónica (que suene y prenda). Después apoya la repisa (3) sobre los listones. <b>No se pega</b>: se levanta con el dedo por el agujero para mostrar la electrónica.'),
    ('Bandeja del pastillero', 'Pega el frente (9) y la parte de atrás (10) <b>encima</b> del piso grabado (4), y los costados (11 y 12) entre ellos, igual que la caja. El grabado queda <b>hacia arriba</b> y la fila que dice <b>mañana</b> va adelante, del lado del LED.'),
    ('Rejilla de 28 huecos', 'Pon los 3 separadores largos (15–17) <b>de pie</b> entre las filas, con las ranuras <b>hacia arriba</b>. Luego baja los 6 cortos (18–23) con las ranuras <b>hacia abajo</b> para que encajen en cruz. No necesita cola; si algo queda flojo, pon un punto de cola en los extremos. Cada hueco debe mostrar su día y su toma.'),
    ('Bandeja en la caja', 'Mete la bandeja sobre la repisa. Para sacarla, pon los dedos en las <b>muescas</b> de los costados y levántala.'),
    ('Tapa', f'Pega el acrílico ({CM(CL - 30)} × {CM(CA - 30)} cm) por <b>debajo</b> de la tapa (2) con silicona transparente, centrado en la ventana. Pega 2 bisagras chicas en la parte de atrás y el broche al centro del frente, con pegamento epóxico. Deja secar 1 hora antes de abrir y cerrar.'),
]


def html():
    grupos = []  # piezas iguales en una sola fila: 11–12, 13–14, 15–17, 18–23
    for nombre, w, h, dib in g.piezas():
        num, resto = nombre.split(' ', 1)
        base = resto.split(' (')[0].rstrip('.')
        if grupos and grupos[-1][1] == base and grupos[-1][2:4] == [w, h]:
            grupos[-1][5] += 1
        else:
            grupos.append([num, base, w, h, dib, 1, resto])
    filas = ''
    for num, base, w, h, dib, n, resto in grupos:
        nums = f'{num}–{int(num) + n - 1}' if n > 1 else num
        cant = f' <span class="m">× {n}</span>' if n > 1 else ''
        filas += (f'<tr><td class="n">{nums}</td><td>{dib_pieza(dib, w, h)}</td><td><b>{resto}</b>{cant}<br>'
                  f'<span class="m">{CM(w)} × {CM(h)} cm</span></td><td>{USO[num]}</td></tr>')
    pasos = [(f'<div class="paso"><div class="num">{i}</div><div class="dib">{paso(i)}</div>'
                    f'<div class="txt"><h3>{t}</h3><p>{d}</p></div></div>') for i, (t, d) in enumerate(PASOS, 1)]
    logo = open(os.path.join('..', 'assets', 'marca', 'logo-horizontal.svg'), encoding='utf-8').read()
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Caja Memora: manual de armado</title><style>
@page {{ size: A4; margin: 14mm 14mm 16mm; }}
body {{ font-family: "Segoe UI", Arial, sans-serif; color: #1F2D33; font-size: 11.5pt; line-height: 1.45; margin: 0; }}
h1 {{ font-size: 24pt; margin: 6px 0 4px; color: #0A4A66; }} h2 {{ font-size: 16pt; color: #0A4A66; margin: 0 0 8px; border-bottom: 2px solid #0E8FA3; padding-bottom: 4px; }}
h3 {{ margin: 0 0 4px; font-size: 13pt; color: #0A4A66; }} p {{ margin: 0 0 8px; }}
.hoja {{ page-break-after: always; }} .hoja:last-child {{ page-break-after: auto; }}
.logo svg {{ width: 200px; height: auto; }}
.datos {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0; }}
.dato {{ background: #E8F6F8; border-radius: 8px; padding: 8px 10px; }} .dato b {{ display: block; font-size: 15pt; color: #0A4A66; }}
table {{ width: 100%; border-collapse: collapse; font-size: 10pt; }} td, th {{ border-bottom: 1px solid #DDE5E8; padding: 3px 6px; vertical-align: middle; text-align: left; }}
th {{ background: #0A4A66; color: #fff; font-weight: 600; }} td.n {{ font-size: 12pt; font-weight: 700; color: #0E8FA3; text-align: center; width: 44px; white-space: nowrap; }}
.m {{ color: #0E6E7E; font-weight: 600; }}
.paso {{ display: grid; grid-template-columns: 34px 300px 1fr; gap: 10px; align-items: center; border: 1px solid #DDE5E8; border-radius: 10px; padding: 8px; margin-bottom: 9px; page-break-inside: avoid; }}
.paso .num {{ width: 30px; height: 30px; border-radius: 50%; background: #0E8FA3; color: #fff; font-weight: 700; display: grid; place-items: center; font-size: 14pt; }}
.nota {{ background: #FFF6E0; border-left: 4px solid #E5A823; padding: 8px 10px; margin: 8px 0; font-size: 10.5pt; }}
.ley {{ font-size: 10pt; color: #4A5A61; }} .chip {{ display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -1px; margin-right: 4px; border: 1px solid #7A5C33; }}
ul {{ margin: 4px 0 8px 18px; padding: 0; }} li {{ margin-bottom: 3px; }}
</style></head><body>

<section class="hoja">
<div class="logo">{logo}</div>
<h1>Caja del pastillero: manual de armado</h1>
<p>Cofre de trupán de 3 mm hecho con corte láser. Abajo va la electrónica y arriba un pastillero de 28 huecos (7 días × 4 tomas) que se saca para cargarlo.</p>
{dib_final()}
<div class="datos">
<div class="dato">Largo<b>{CM(CL)} cm</b></div><div class="dato">Fondo<b>{CM(CA)} cm</b></div>
<div class="dato">Alto (cerrada)<b>{CM(CP + 2 * T)} cm</b></div><div class="dato">Piezas<b>{len(g.piezas())} + acrílico</b></div></div>
<h2>Así va por dentro</h2>
{dib_corte()}
<p class="ley">De abajo hacia arriba: piso, compartimiento de la electrónica (4 cm), repisa sacable sobre 2 listones, bandeja-pastillero con sus separadores y tapa con ventana.</p>
</section>

<section class="hoja">
<h2>Las {len(g.piezas())} piezas de trupán (3 mm)</h2>
<p class="ley"><span class="chip" style="background:#F3E4C8;border-color:#C0392B"></span>rojo = el láser corta · negro = el láser graba (el logo del frente y los días en el piso del pastillero)</p>
<table><tr><th>#</th><th>Forma</th><th>Pieza y medida</th><th>Para qué sirve</th></tr>{filas}</table>
<p class="ley">Además: <b>acrílico transparente de 2 mm, de {CM(CL - 30)} × {CM(CA - 30)} cm</b>, para la ventana de la tapa.</p>
</section>

<section class="hoja">
<h2>Antes de armar</h2>
<ul>
<li><b>Material:</b> cola sintética (blanca), cinta de embalaje, una escuadra, lija fina (#220), silicona caliente, silicona transparente y pegamento epóxico.</li>
<li><b>Ferretería:</b> 2 bisagras chicas (de 2–3 cm) y 1 broche de cierre, como el del cofre de referencia.</li>
<li>Lija suave los bordes quemados por el láser y limpia el polvo antes de pegar.</li>
<li>Que el taller pruebe <b>un separador largo con uno corto</b> antes de cortar todo: deben encajar a mano, sin forzar.</li>
<li>Arma todo <b>en seco</b> primero, sin cola, para ver que encaje. Recién después pega.</li>
</ul>
<div class="nota"><b>Regla de oro:</b> las paredes van <b>sobre</b> el piso. El frente y la parte de atrás son las piezas largas, y los costados van <b>entre</b> ellas.</div>
<p class="ley"><span class="chip" style="background:{NUEVO[0]}"></span>en celeste: lo que pegas en ese paso.</p>
<h2>Armado paso a paso</h2>
{''.join(pasos[:3])}
</section>

<section class="hoja">
{''.join(pasos[3:6])}
</section>

<section class="hoja">
{''.join(pasos[6:])}
<h2>Revisión final</h2>
<ul>
<li>La tapa cierra plana y el acrílico <b>no toca</b> los separadores.</li>
<li>Con la tapa cerrada, una pastilla no pasa de un hueco a otro.</li>
<li>La bandeja sale y entra sin trabarse.</li>
<li>El cable USB entra por el costado izquierdo hasta el ESP32.</li>
<li>Con todo cerrado: el LED se ve, el pulsador se presiona bien y el buzzer se escucha.</li>
</ul>
<div class="nota">Si el taller usa un trupán más grueso o más delgado que 3 mm, avísale antes de cortar. Las medidas se recalculan cambiando <b>T</b> en <code>generar_caja.py</code>.</div>
</section>
</body></html>'''


if __name__ == '__main__':
    open('memora-caja-manual.html', 'w', encoding='utf-8').write(html())
    edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    ruta = os.path.abspath('memora-caja-manual.html').replace('\\', '/')
    subprocess.run([edge, '--headless', '--disable-gpu', '--no-pdf-header-footer',
                    f'--print-to-pdf={os.path.abspath("memora-caja-manual.pdf")}', f'file:///{ruta}'], check=True)
    print('listo')
