#!/usr/bin/env python3
"""
Extractor de sprites transparentes para la aventura gráfica de Twinber.
Extrae cada frame de Twinber, Paco y los objetos del inventario eliminando el fondo gris mediante flood-fill.
"""
from PIL import Image, ImageDraw
import os

def flood_remove_bg(crop_img, tol=30):
    im = crop_img.convert('RGBA')
    w, h = im.size
    bg = im.getpixel((0, 0))[:3]
    mask = Image.new('L', (w, h), 0)
    pixels = im.load()
    mask_pixels = mask.load()
    
    for x in range(w):
        for y in range(h):
            p = pixels[x, y]
            if sum(abs(p[i] - bg[i]) for i in range(3)) <= tol:
                mask_pixels[x, y] = 255

    # Inundar desde las 4 esquinas
    for pt in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        if mask_pixels[pt[0], pt[1]] == 255:
            ImageDraw.floodfill(mask, pt, 128)
            
    for x in range(w):
        for y in range(h):
            if mask_pixels[x, y] == 128:
                pixels[x, y] = (0, 0, 0, 0)
                
    # Auto-crop al contenido no transparente con padding de 2px
    bbox = im.getbbox()
    if bbox:
        im = im.crop((max(0, bbox[0]-2), max(0, bbox[1]-2), min(w, bbox[2]+2), min(h, bbox[3]+2)))
    return im

def extract_twinber():
    sheet = Image.open('frontend/public/assets/img/sprite_twinber_sheet.jpg').convert('RGB')
    w, h = sheet.size
    row_h = h // 3
    out_dir = 'frontend/public/assets/img/sprites'
    os.makedirs(out_dir, exist_ok=True)
    
    # Fila 0: 6 frames walk
    walk_boxes = [(29, 145), (309, 415), (563, 682), (773, 889), (1038, 1140), (1227, 1345)]
    for i, (x1, x2) in enumerate(walk_boxes):
        crop = sheet.crop((max(0, x1-10), 0, min(w, x2+10), row_h))
        sprite = flood_remove_bg(crop)
        sprite.save(f'{out_dir}/twinber_walk_{i}.png')
        
    # Fila 1: 4 frames idle
    idle_boxes = [(146, 236), (475, 567), (799, 927), (1123, 1241)]
    for i, (x1, x2) in enumerate(idle_boxes):
        crop = sheet.crop((max(0, x1-10), row_h, min(w, x2+10), row_h * 2))
        sprite = flood_remove_bg(crop)
        sprite.save(f'{out_dir}/twinber_idle_{i}.png')

    # Fila 2: 4 frames talk
    talk_boxes = [(147, 269), (476, 614), (805, 935), (1128, 1221)]
    for i, (x1, x2) in enumerate(talk_boxes):
        crop = sheet.crop((max(0, x1-10), row_h * 2, min(w, x2+10), h))
        sprite = flood_remove_bg(crop)
        sprite.save(f'{out_dir}/twinber_talk_{i}.png')
    print("Twinber sprites extracted successfully!")

def extract_paco():
    sheet = Image.open('frontend/public/assets/img/sprite_paco_sheet.jpg').convert('RGB')
    w, h = sheet.size
    row_h = h // 2
    out_dir = 'frontend/public/assets/img/sprites'
    os.makedirs(out_dir, exist_ok=True)
    
    # Fila 0: 4 frames idle
    idle_boxes = [(66, 266), (362, 561), (660, 834), (956, 1158)]
    for i, (x1, x2) in enumerate(idle_boxes):
        crop = sheet.crop((max(0, x1-10), 0, min(w, x2+10), row_h))
        sprite = flood_remove_bg(crop)
        sprite.save(f'{out_dir}/paco_idle_{i}.png')

    # Fila 1: 4 frames talk
    talk_boxes = [(66, 269), (363, 582), (659, 867), (957, 1117)]
    for i, (x1, x2) in enumerate(talk_boxes):
        crop = sheet.crop((max(0, x1-10), row_h, min(w, x2+10), h))
        sprite = flood_remove_bg(crop)
        sprite.save(f'{out_dir}/paco_talk_{i}.png')
    print("Paco sprites extracted successfully!")

def extract_items():
    sheet = Image.open('frontend/public/assets/img/items_inventory_sheet.jpg').convert('RGB')
    w, h = sheet.size
    cell_w = w // 4
    cell_h = h // 2
    out_dir = 'frontend/public/assets/img/items'
    os.makedirs(out_dir, exist_ok=True)
    
    names = [
        ["item_monedas", "item_pasaporte", "item_album", "item_gofio"],
        ["item_comanda", "item_billete", "item_platano", "item_brujula"]
    ]
    
    for r in range(2):
        for c in range(4):
            # Recortar celda evitando el texto inferior (últimos 70 px de la celda)
            x1 = c * cell_w
            y1 = r * cell_h
            x2 = (c + 1) * cell_w
            y2 = (r + 1) * cell_h - 70
            crop = sheet.crop((x1, y1, x2, y2))
            sprite = flood_remove_bg(crop, tol=25)
            # Redimensionar limpiamente a 48x48 o mantener proporción
            sprite.save(f'{out_dir}/{names[r][c]}.png')
    print("Item icons extracted successfully!")

if __name__ == '__main__':
    extract_twinber()
    extract_paco()
    extract_items()
