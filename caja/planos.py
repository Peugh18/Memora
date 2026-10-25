"""Planos con medidas de cada pieza (para revisar y para el taller).

Uso: python planos.py  -> memora-caja-planos.pdf
"""
import os
import subprocess

import generar_caja as g

T = g.T
CM = lambda mm: f'{mm / 10:.2f}'.rstrip('0').rstrip('.').replace('.', ',')
AZUL = '#0E6E7E'


class Plano:
    def __init__(self, w, h, ancho=330, alto=150):
        self.w, self.h = w, h
        self.e = min(ancho / w, alto / h)
        self.ox, self.oy = 70, 34
        self.W, self.H = ancho + 140, h * self.e + 80
        self.s = []

    def X(self, x): return self.ox + x * self.e
    def Y(self, y): return self.oy + y * self.e

    def _txt(self, x, y, t, anchor='middle'):
        self.s.append(f'<text x="{x:.1f}" y="{y:.1f}" font-size="10.5" fill="{AZUL}" font-weight="700" '
                      f'text-anchor="{anchor}" stroke="#fff" stroke-width="3" paint-order="stroke">{t}</text>')

    def _l(self, x1, y1, x2, y2, w=.8, dash=''):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.s.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{AZUL}" stroke-width="{w}"{d}/>')

    def h_(self, x1, x2, y, t=None, lado=1):
        """Cota horizontal entre x1 y x2, dibujada en la altura y (mm de la pieza); lado -1 = arriba."""
        yy = self.Y(y) + lado * 14
        a, b = self.X(x1), self.X(x2)
        self._l(a, self.Y(y), a, yy + lado * 3, .5, '2 2'); self._l(b, self.Y(y), b, yy + lado * 3, .5, '2 2')
        self._l(a, yy, b, yy)
        for x in (a, b):
            self._l(x - 3, yy + 3, x + 3, yy - 3)
        self._txt((a + b) / 2, yy + (11 if lado > 0 else -4), (t or CM(x2 - x1)) + ' cm' if t is None or t[-1].isdigit() else t)

    def v_(self, y1, y2, x, t=None, lado=-1):
        """Cota vertical entre y1 y y2, en la posición x; lado -1 = a la izquierda."""
        xx = self.X(x) + lado * 14
        a, b = self.Y(y1), self.Y(y2)
        self._l(self.X(x), a, xx + lado * 3, a, .5, '2 2'); self._l(self.X(x), b, xx + lado * 3, b, .5, '2 2')
        self._l(xx, a, xx, b)
        for y in (a, b):
            self._l(xx - 3, y + 3, xx + 3, y - 3)
        self._txt(xx + lado * 4, (a + b) / 2 + 4, (t or CM(abs(y2 - y1))) + ' cm' if t is None or t[-1].isdigit() else t,
                  'end' if lado < 0 else 'start')

    def nota(self, x, y, t):
        self._txt(self.X(x), self.Y(y), t)

    def svg(self, dibujar):
        c, gr = dibujar(0, 0)
        pieza = (f'<g transform="translate({self.ox},{self.oy}) scale({self.e})">'
                 f'<path d="{c}" fill="#F3E4C8" fill-rule="evenodd" stroke="#C0392B" stroke-width="{1 / self.e:.3f}"/>{gr}</g>')
        return f'<svg viewBox="0 0 {self.W:.0f} {self.H:.0f}" width="100%">{pieza}{"".join(self.s)}</svg>'


def cotas(num, w, h):
    p = Plano(w, h)
    p.h_(0, w, h)
    p.v_(0, h, 0)
    yc = g.C_PARED - g.ALTO_ELECTRONICA / 2
    if num == '2':
        p.h_(0, 20, 0, lado=-1); p.v_(0, 20, w, lado=1)
        p.nota(w / 2, h / 2 + 3, f'ventana {CM(w - 40)} × {CM(h - 40)} cm')
    elif num == '3':
        p.h_(0, 25, 0, lado=-1)
        p.nota(w / 2 + 15, h / 2 + 3, 'agujero Ø 2,5 cm, centrado en el alto')
    elif num == '4':
        p.h_(T, T + g.HUECO[0], 0, lado=-1)
        p.v_(T, T + g.HUECO[1], w, lado=1)
        p.nota(w / 2, h + 26 + 12, 'adelante (fila mañana)')
    elif num == '5':
        p.h_(0, 55, yc, lado=-1)
        p.h_(0, w / 2, 0, lado=-1)
        p.h_(w - 60 - 1.5, w - 50 + 1.5, yc - 12, lado=-1)
        p.v_(yc, h, w, lado=1)
        p.v_(0, 21, (w - 80) / 2 - 4)
        p.nota(55, yc + 11, 'LED Ø 0,52')
        p.nota(w / 2, yc + 14, 'pulsador Ø 1,25')
        p.nota(w - 55, yc + 14, 'buzzer: 9 × Ø 0,3')
    elif num in ('7', '8'):
        p.h_(0, w / 2, 0, lado=-1)
        p.nota(w / 2, 12 + 14, 'muesca Ø 2,4')
        if num == '7':
            p.v_(yc, h, w / 2 + 8, lado=1)
            p.nota(w / 2, yc - 9, 'USB 1,6 × 1,2')
    elif num == '13':
        pass
    elif num in ('15', '18'):
        largo = num == '15'
        pos = [i * (g.HUECO[0] + T) - T - .25 for i in range(1, g.DIAS)] if largo else \
              [j * (g.HUECO[1] + T) - T - .25 for j in range(1, g.TOMAS)]
        borde = 0 if largo else h
        p.h_(0, pos[0], borde, lado=-1 if largo else 1)
        if len(pos) > 1:
            p.h_(pos[0], pos[1], h if largo else 0, f'cada {CM(pos[1] - pos[0])} cm', lado=1 if largo else -1)
        return p, f'Ranuras de 0,3 cm de ancho y {CM(h / 2)} cm de hondo, ' + ('hacia arriba' if largo else 'hacia abajo')
    return p, ''


def html():
    grupos = []
    for nombre, w, h, dib in g.piezas():
        num, resto = nombre.split(' ', 1)
        base = resto.split(' (')[0]
        if grupos and grupos[-1][1] == base and grupos[-1][2:4] == [w, h]:
            grupos[-1][5] += 1
        else:
            grupos.append([num, base, w, h, dib, 1, resto])
    tarjetas = ''
    for num, base, w, h, dib, n, resto in grupos:
        nums = f'{num}–{int(num) + n - 1}' if n > 1 else num
        tarjetas += (f'<div class="t"><h3><span>{nums}</span> {resto} <em>× {n}</em></h3>'
                     f'<p>{CM(w)} × {CM(h)} cm · trupán 3 mm</p><p class="x">{cotas(num, w, h)[1]}</p>{cotas(num, w, h)[0].svg(dib)}</div>')
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Caja Memora: planos</title><style>
@page {{ size: A4; margin: 12mm; }}
body {{ font-family: "Segoe UI", Arial, sans-serif; color: #1F2D33; margin: 0; font-size: 10.5pt; }}
h1 {{ font-size: 18pt; color: #0A4A66; margin: 0 0 2px; }} .sub {{ margin: 0 0 10px; color: #4A5A61; }}
.g {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }}
.t {{ border: 1px solid #DDE5E8; border-radius: 8px; padding: 6px 8px; page-break-inside: avoid; }}
.t h3 {{ margin: 0; font-size: 11.5pt; color: #0A4A66; }} .t h3 span {{ color: #0E8FA3; }} .t h3 em {{ font-style: normal; color: #0E6E7E; font-size: 10pt; }}
.t p {{ margin: 0 0 2px; color: #0E6E7E; font-weight: 600; }} .t p.x {{ color: #1F2D33; font-weight: 400; font-size: 9.5pt; }}
</style></head><body>
<h1>Caja Memora: planos con medidas</h1>
<p class="sub">Todas las medidas en centímetros. Rojo = corte, negro = grabado. Caja armada: {CM(g.C_L)} × {CM(g.C_A)} × {CM(g.C_PARED + 2 * T)} cm. Acrílico aparte: {CM(g.C_L - 30)} × {CM(g.C_A - 30)} cm, 2 mm.</p>
<div class="g">{tarjetas}</div></body></html>'''


if __name__ == '__main__':
    open('memora-caja-planos.html', 'w', encoding='utf-8').write(html())
    edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    ruta = os.path.abspath('memora-caja-planos.html').replace('\\', '/')
    subprocess.run([edge, '--headless', '--disable-gpu', '--no-pdf-header-footer',
                    f'--print-to-pdf={os.path.abspath("memora-caja-planos.pdf")}', f'file:///{ruta}'], check=True)
    print('listo')
