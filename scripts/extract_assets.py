#!/usr/bin/env python3
"""
Pipeline Canónico de Extracción y Normalización de Sprites (Zero-Jitter Engine)
=============================================================================
Reglas de Normalización para Animaciones 2D sin Desplazamientos Laterales:
1. Lienzo Fijo Uniforme (Canvas Uniformity):
   Todos los frames de un personaje (caminata, reposo, diálogo) deben compartir
   exactamente el mismo ancho y alto de lienzo transparente (RGBA).
2. Punto de Anclaje de Contacto con el Suelo (Ground Foot Anchor):
   - Eje X: El centro de gravedad horizontal de los pies (el 15% inferior de píxeles)
     se fija exactamente en el centro horizontal del lienzo (canvas_w // 2).
   - Eje Y: La suela de los zapatos (píxel inferior del personaje) se alinea a una
     línea de tierra constante (canvas_h - margen_inferior).
3. Eliminación de Jitter:
   Al gesticular con las manos o mover la boca en la animación de hablar, el cuerpo y
   los pies permanecen fijos al milímetro sin bamboleo ni desplazamiento lateral.
"""
from PIL import Image, ImageDraw
import os

def flood_remove_bg(crop_img, tol=30):
    """Elimina el fondo neutro mediante flood-fill desde las esquinas."""
    im = crop_img.convert('RGBA')
    w, h = im.size
    bg = im.getpixel((2, 2))[:3]
    mask = Image.new('L', (w, h), 0)
    pixels = im.load()
    mask_pixels = mask.load()
    
    for x in range(w):
        for y in range(h):
            p = pixels[x, y]
            if sum(abs(p[i] - bg[i]) for i in range(3)) <= tol:
                mask_pixels[x, y] = 255

    # Inundar desde las 4 esquinas
    for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if mask_pixels[pt[0], pt[1]] == 255:
            ImageDraw.floodfill(mask, pt, 128)
            
    for x in range(w):
        for y in range(h):
            if mask_pixels[x, y] == 128:
                pixels[x, y] = (0, 0, 0, 0)
    return im

def extract_aligned_actor(sheet_path, num_rows, rows_config, canvas_w, canvas_h, anchor_x, anchor_y, actor_name, out_dir):
    """
    Extrae y centra cada frame de animación sobre un lienzo fijo uniforme,
    alineando el punto de contacto de los pies con precisión milimétrica.
    """
    sheet = Image.open(sheet_path).convert('RGB')
    w, h = sheet.size
    row_h = h // num_rows
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"\n[ACTOR: {actor_name.upper()}] Normalizando sprites -> Lienzo: {canvas_w}x{canvas_h} | Anclaje: ({anchor_x}, {anchor_y})")
    
    for row_idx, anim_name, boxes in rows_config:
        row_crop = sheet.crop((0, row_idx * row_h, w, (row_idx + 1) * row_h))
        row_clean = flood_remove_bg(row_crop)
        row_pix = row_clean.load()
        
        for i, (x1, x2) in enumerate(boxes):
            # 1. Recopilar píxeles opacos del frame
            pts = []
            for x in range(max(0, x1 - 10), min(w, x2 + 10)):
                for y in range(row_h):
                    if row_pix[x, y][3] > 10:
                        pts.append((x, y))
                        
            if not pts:
                print(f"  [ALERTA] Frame vacío: {anim_name}_{i}")
                continue
                
            min_x = min(p[0] for p in pts)
            max_x = max(p[0] for p in pts)
            min_y = min(p[1] for p in pts)
            max_y = max(p[1] for p in pts)
            
            # 2. Extraer recorte ajustado del sprite
            tight_sprite = row_clean.crop((min_x, min_y, max_x + 1, max_y + 1))
            fw, fh = tight_sprite.size
            
            # 3. Calcular centro de gravedad horizontal de los pies (el 15% inferior de la silueta)
            feet_thresh = max_y - int((max_y - min_y) * 0.15)
            feet_pts = [p for p in pts if p[1] >= feet_thresh]
            if not feet_pts:
                feet_pts = pts
            feet_cx = sum(p[0] for p in feet_pts) / len(feet_pts)
            
            # 4. Desplazamiento exacto para clavar los pies en (anchor_x, anchor_y)
            offset_x = int(round(anchor_x - (feet_cx - min_x)))
            offset_y = int(round(anchor_y - fh))
            
            # 5. Componer sobre lienzo fijo transparente
            canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
            canvas.paste(tight_sprite, (offset_x, offset_y), tight_sprite)
            
            out_file = f"{out_dir}/{actor_name}_{anim_name}_{i}.png"
            canvas.save(out_file)
            print(f"  ✓ {actor_name}_{anim_name}_{i}.png | Sprite: {fw}x{fh} -> Offset: ({offset_x}, {offset_y})")

def extract_twinber():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_twinber_sheet.jpg',
        num_rows=3,
        rows_config=[
            (1, 'idle', [(146, 236), (475, 567), (799, 927), (1123, 1241)]),
            (2, 'talk', [(147, 269), (476, 614), (805, 935), (1128, 1221)])
        ],
        canvas_w=192,
        canvas_h=256,
        anchor_x=96,
        anchor_y=250,
        actor_name='twinber',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_paco():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_paco_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(66, 266), (362, 561), (660, 834), (956, 1158)]),
            (1, 'talk', [(66, 269), (363, 582), (659, 867), (957, 1117)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='paco',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_nieves():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_nieves_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(85, 261), (429, 605), (773, 947), (1118, 1290)]),
            (1, 'talk', [(86, 259), (430, 625), (774, 947), (1118, 1290)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='nieves',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_chano():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_chano_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(258, 403), (478, 623), (716, 855), (939, 1085)]),
            (1, 'talk', [(248, 400), (475, 674), (713, 875), (947, 1096)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='chano',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_candido():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_candido_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(64, 257), (362, 553), (661, 848), (960, 1153)]),
            (1, 'talk', [(62, 254), (362, 564), (661, 855), (960, 1152)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='candido',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_manolo():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_manolo_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(51, 254), (344, 549), (628, 846), (940, 1145)]),
            (1, 'talk', [(51, 256), (345, 624), (644, 848), (941, 1185)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='manolo',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_herminia():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_herminia_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(65, 216), (363, 514), (660, 841), (958, 1109)]),
            (1, 'talk', [(65, 216), (362, 551), (661, 811), (959, 1109)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='herminia',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_morales():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_morales_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(126, 247), (451, 575), (790, 939), (1126, 1252)]),
            (1, 'talk', [(126, 252), (446, 666), (776, 905), (1112, 1238)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='morales',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_yeray():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_yeray_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(77, 274), (378, 573), (665, 842), (968, 1166)]),
            (1, 'talk', [(73, 275), (378, 593), (660, 887), (966, 1169)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='yeray',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_socorrista():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_socorrista_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(27, 227), (326, 527), (627, 879), (926, 1127)]),
            (1, 'talk', [(31, 227), (331, 524), (632, 879), (929, 1126)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='socorrista',
        out_dir='frontend/public/assets/img/sprites'
    )

def extract_frutero():
    extract_aligned_actor(
        sheet_path='frontend/public/assets/img/sprite_frutero_sheet.jpg',
        num_rows=2,
        rows_config=[
            (0, 'idle', [(76, 281), (420, 626), (728, 965), (1106, 1307)]),
            (1, 'talk', [(82, 279), (421, 637), (764, 967), (1109, 1309)])
        ],
        canvas_w=280,
        canvas_h=460,
        anchor_x=140,
        anchor_y=450,
        actor_name='frutero',
        out_dir='frontend/public/assets/img/sprites'
    )

def refine_tanausu():
    for anim in ['idle', 'talk']:
        for i in range(4):
            im = Image.open(f'frontend/public/assets/img/sprites/yeray_{anim}_{i}.png').convert('RGBA')
            w, h = im.size
            pix = im.load()
            for y in range(h):
                for x in range(w):
                    r, g, b, a = pix[x, y]
                    if a < 20: continue
                    if 40 <= y <= 170 and 110 <= x <= 165:
                        if 40 < r < 140 and 25 < g < 100 and b < 80 and r >= g:
                            f = 0.52
                            pix[x, y] = (int(r * f), int(g * f), int(b * f), a)
                        elif 136 <= y <= 160 and 126 <= x <= 152:
                            if (y >= 144 or abs(x - 139) > 7) and r > 105 and g > 55:
                                pix[x, y] = (int(r * 0.40), int(g * 0.35), int(b * 0.30), a)
                    if 165 <= y <= 295:
                        if g > 55 and g > b + 12 and (g >= r - 15) and not (r > 150 and g > 100 and b > 70):
                            lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255.0
                            new_r = min(255, int(220 * lum + 35))
                            new_g = min(255, int(95 * lum + 10))
                            new_b = min(255, int(45 * lum + 5))
                            pix[x, y] = (new_r, new_g, new_b, a)
                    if 285 <= y <= 415 and 90 <= x <= 190:
                        if r > 60 and g > 55 and b > 40 and abs(r - g) < 35 and r > b:
                            lum = (r + g + b) / 3 / 255.0
                            new_r = min(255, int(60 * lum + 15))
                            new_g = min(255, int(75 * lum + 18))
                            new_b = min(255, int(105 * lum + 25))
                            pix[x, y] = (new_r, new_g, new_b, a)
                    if y >= 140 and 165 <= x <= 200:
                        if r > 50 and g > 35 and r > g + 10 and r > b + 25:
                            lum = (r + g + b) / 3 / 255.0
                            val = min(255, int(210 * lum + 25))
                            pix[x, y] = (val, min(255, val + 5), min(255, val + 15), a)
            im.save(f'frontend/public/assets/img/sprites/tanausu_{anim}_{i}.png')

def refine_operario():
    for anim in ['idle', 'talk']:
        for i in range(4):
            im = Image.open(f'frontend/public/assets/img/sprites/morales_{anim}_{i}.png').convert('RGBA')
            w, h = im.size
            pix = im.load()
            for y in range(h):
                for x in range(w):
                    r, g, b, a = pix[x, y]
                    if a < 20: continue
                    if 110 <= y <= 175 and 100 <= x <= 165:
                        if r > 100 and g > 100 and b > 100:
                            lum = (r + g + b) / 3 / 255.0
                            pix[x, y] = (int(30 * lum + 15), int(45 * lum + 20), int(75 * lum + 35), a)
                        elif 40 <= r <= 90 and 40 <= g <= 90 and 60 <= b <= 120:
                            pix[x, y] = (int(r * 0.7), int(g * 0.75), int(b * 0.85), a)
                    if 228 <= y <= 345:
                        is_jacket = abs(r - g) < 28 and abs(g - b) < 28 and r > 65
                        is_skin = (r > 150 and g > 90 and b > 70 and r > g + 30)
                        if is_jacket and not is_skin:
                            lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255.0
                            if y <= 250 and abs(x - 140) > 25:
                                pix[x, y] = (int(25 * lum + 10), int(35 * lum + 15), int(60 * lum + 25), a)
                            else:
                                new_r = min(255, int(215 * lum + 35))
                                new_g = min(255, int(40 * lum + 10))
                                new_b = min(255, int(45 * lum + 10))
                                pix[x, y] = (new_r, new_g, new_b, a)
                    if 345 <= y <= 430:
                        if abs(r - g) < 25 and abs(g - b) < 25:
                            lum = (r + g + b) / 3 / 255.0
                            pix[x, y] = (int(35 * lum + 10), int(40 * lum + 12), int(50 * lum + 15), a)
            im.save(f'frontend/public/assets/img/sprites/operario_{anim}_{i}.png')

def refine_guardian():
    for anim in ['idle', 'talk']:
        for i in range(4):
            im = Image.open(f'frontend/public/assets/img/sprites/candido_{anim}_{i}.png').convert('RGBA')
            w, h = im.size
            pix = im.load()
            for y in range(h):
                for x in range(w):
                    r, g, b, a = pix[x, y]
                    if a < 20: continue
                    if 40 <= y <= 135:
                        if r > 100 and g > 75 and b > 45 and r > b + 25:
                            lum = (r + g + b) / 3 / 255.0
                            pix[x, y] = (int(35 * lum + 15), int(42 * lum + 20), int(65 * lum + 30), a)
                    if 215 <= y <= 375:
                        is_shirt = abs(r - g) < 25 and abs(g - b) < 25 and r > 90
                        is_skin = (r > 150 and g > 90 and b > 70 and r > g + 35)
                        if is_shirt and not is_skin:
                            lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255.0
                            new_r = min(255, int(185 * lum + 25))
                            new_g = min(255, int(155 * lum + 20))
                            new_b = min(255, int(120 * lum + 15))
                            pix[x, y] = (new_r, new_g, new_b, a)
                    if y >= 210 and 165 <= x <= 200:
                        if r > 65 and g > 40 and r > g + 15:
                            lum = (r + g + b) / 3 / 255.0
                            new_r = min(255, int(225 * lum + 30))
                            new_g = min(255, int(180 * lum + 20))
                            new_b = min(255, int(60 * lum + 10))
                            pix[x, y] = (new_r, new_g, new_b, a)
                    if 415 <= y <= 455:
                        if a > 50:
                            lum = (r + g + b) / 3 / 255.0
                            pix[x, y] = (int(65 * lum + 15), int(45 * lum + 10), int(35 * lum + 8), a)
            im.save(f'frontend/public/assets/img/sprites/guardian_{anim}_{i}.png')

if __name__ == '__main__':
    extract_twinber()
    extract_paco()
    extract_nieves()
    extract_chano()
    extract_candido()
    extract_manolo()
    extract_herminia()
    extract_morales()
    extract_yeray()
    extract_socorrista()
    extract_frutero()
    refine_tanausu()
    refine_operario()
    refine_guardian()
    print("\n¡Extracción y normalización de todos los actores completada con éxito!")
