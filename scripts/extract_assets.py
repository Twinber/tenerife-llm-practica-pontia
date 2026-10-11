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
            (0, 'walk', [(29, 145), (309, 415), (563, 682), (773, 889), (1038, 1140), (1227, 1345)]),
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
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
        canvas_h=400,
        anchor_x=140,
        anchor_y=390,
        actor_name='frutero',
        out_dir='frontend/public/assets/img/sprites'
    )

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
    print("\n¡Extracción y normalización de todos los actores completada con éxito!")
