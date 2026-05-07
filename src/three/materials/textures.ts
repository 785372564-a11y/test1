import * as THREE from 'three';

/** 程序化生成带肋钢筋法线贴图：横向连续斜肋 + 两条纵向贯通肋 */
export function makeRibbedSteelNormalMap(): THREE.Texture {
  const w = 256, h = 64;
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d')!;
  // 基础法线 (0.5, 0.5, 1.0) -> rgb(128,128,255)
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, w, h);
  // 斜向横肋：每 16px 一道，从左下到右上
  const ribCount = 16;
  for (let i = 0; i < ribCount; i++) {
    const x = (i / ribCount) * w;
    const grad = ctx.createLinearGradient(x - 6, 0, x + 6, 0);
    grad.addColorStop(0, 'rgb(80,128,220)');     // 左侧斜面 -X
    grad.addColorStop(0.5, 'rgb(128,128,255)');  // 顶部
    grad.addColorStop(1, 'rgb(176,128,220)');    // 右侧斜面 +X
    ctx.save();
    ctx.translate(x, h / 2);
    ctx.rotate(-Math.PI / 12); // 斜 15°
    ctx.fillStyle = grad;
    ctx.fillRect(-6, -h, 12, h * 2);
    ctx.restore();
  }
  // 纵向贯通肋（上下各一条）
  const longGrad = ctx.createLinearGradient(0, 0, 0, 6);
  longGrad.addColorStop(0, 'rgb(128,80,220)');
  longGrad.addColorStop(1, 'rgb(128,176,220)');
  ctx.fillStyle = longGrad;
  ctx.fillRect(0, h * 0.18, w, 4);
  const longGrad2 = ctx.createLinearGradient(0, h - 6, 0, h);
  longGrad2.addColorStop(0, 'rgb(128,80,220)');
  longGrad2.addColorStop(1, 'rgb(128,176,220)');
  ctx.fillStyle = longGrad2;
  ctx.fillRect(0, h * 0.78, w, 4);

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** 程序化生成混凝土法线/粗糙度贴图（轻微噪声） */
export function makeConcreteNormalMap(): THREE.Texture {
  const s = 256;
  const cvs = document.createElement('canvas');
  cvs.width = s; cvs.height = s;
  const ctx = cvs.getContext('2d')!;
  const img = ctx.createImageData(s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    img.data[i + 0] = 128 + n;
    img.data[i + 1] = 128 + n;
    img.data[i + 2] = 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}
