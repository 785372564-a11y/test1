# -*- coding: utf-8 -*-
"""把原 logo 底部两行文字替换为新公司名"""
import os
from PIL import Image, ImageDraw, ImageFont

SRC = r"C:\Users\Administrator\Desktop\长旅log.jpg"
DST = r"C:\Users\Administrator\Desktop\新旅建设集团有限公司_logo.png"

CN_TEXT = "新旅建设集团有限公司"
EN_TEXT = "XINLV CONSTRUCTION GROUP CO., LTD."

# 字体（Windows 自带）
CN_FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyhbd.ttc",   # 微软雅黑 Bold
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
]
EN_FONT_CANDIDATES = [
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\arial.ttf",
]

def pick(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("找不到中文/英文字体")

def main():
    img = Image.open(SRC).convert("RGB")
    W, H = img.size
    print(f"原图尺寸: {W}x{H}")

    # 用白色覆盖底部文字区（保留 C logo 不动）
    # 经验：原图 logo 大致占上 65%，文字在下 35%
    text_top = int(H * 0.62)
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, text_top), (W, H)], fill=(255, 255, 255))

    # 中文：占图宽约 60%，居中
    cn_font_path = pick(CN_FONT_CANDIDATES)
    cn_size = int(H * 0.085)
    cn_font = ImageFont.truetype(cn_font_path, cn_size)
    # 测量并自动微调到目标宽度
    target_w = int(W * 0.60)
    while True:
        bbox = draw.textbbox((0, 0), CN_TEXT, font=cn_font)
        if bbox[2] - bbox[0] <= target_w or cn_size <= 16:
            break
        cn_size -= 2
        cn_font = ImageFont.truetype(cn_font_path, cn_size)
    while True:
        bbox = draw.textbbox((0, 0), CN_TEXT, font=cn_font)
        if bbox[2] - bbox[0] >= target_w * 0.95 or cn_size >= 200:
            break
        cn_size += 2
        cn_font = ImageFont.truetype(cn_font_path, cn_size)

    # 英文
    en_font_path = pick(EN_FONT_CANDIDATES)
    en_size = max(14, int(cn_size * 0.42))
    en_font = ImageFont.truetype(en_font_path, en_size)

    # 间距
    gap = int(cn_size * 0.25)

    cn_bbox = draw.textbbox((0, 0), CN_TEXT, font=cn_font)
    en_bbox = draw.textbbox((0, 0), EN_TEXT, font=en_font)
    cn_w, cn_h = cn_bbox[2] - cn_bbox[0], cn_bbox[3] - cn_bbox[1]
    en_w, en_h = en_bbox[2] - en_bbox[0], en_bbox[3] - en_bbox[1]

    total_h = cn_h + gap + en_h
    avail_h = H - text_top
    block_top = text_top + (avail_h - total_h) // 2 - cn_bbox[1]

    cn_x = (W - cn_w) // 2 - cn_bbox[0]
    en_x = (W - en_w) // 2 - en_bbox[0]
    en_y = block_top + cn_h + gap - en_bbox[1] + cn_bbox[1]

    color = (60, 70, 80)  # 深灰蓝，匹配原稿
    draw.text((cn_x, block_top), CN_TEXT, font=cn_font, fill=color)
    draw.text((en_x, en_y), EN_TEXT, font=en_font, fill=color)

    img.save(DST, "PNG")
    print(f"已保存：{DST}")

if __name__ == "__main__":
    main()
