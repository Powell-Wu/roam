# imagegen 生成提示词

四次调用均使用 `image_gen.imagegen`，不是程序绘制。透明图集设置 `transparent_background: true`，三张场景设置 `false`。参考路径仅用于角色/美术一致性，未要求复制其他作品。

## 四枚新章

参考：固定提交7b944b9的 `public/roam-pixel-seals-alpha-v1.webp` 与 `public/art-cooperate.webp`。旧协作图已保留在本目录baseline子目录；旧章参考副本保留在references子目录。

> Create ONE transparent square sprite atlas for Roam, a sunny two-person city-walking game. This is a new artwork in the SAME crisp charming retro pixel-art ink-stamp style as the attached transparent six-stamp atlas. The other reference only establishes the friendly adventurous mood; do not draw character portraits. The final square image is an EXACT 2 columns x 2 rows equal-cell grid, four SEPARATE stamps, each centered fully inside its own quadrant with 10% transparent margin. NO grid lines, NO solid background, NO paper, NO checkerboard, NO lettering, NO numerals. Use real transparent alpha everywhere outside each stamp. Keep shapes simple and legible when one quadrant is downscaled to 128x128. Flat navy #17354d, forest green #376f62, warm gold #f1c76b, orange #ed643b, very limited palette, bold clean stepped pixel contours, little to no texture, no thin hairlines, no gradient. Top-left index 0, 'Three walks together': a circular navy stamped badge with two bootprints and a curved path connecting exactly three large landmark dots; clear distinctive silhouette. Top-right index 1, 'In sync events': a hexagonal forest-green badge showing two hands meeting in a friendly high-five, with a small sparkle; no extra hands. Bottom-left index 2, 'Made our own card': a warm orange square stamp with scalloped/stepped corners, one hand holding a small blank playing card and a pen beside it, bold symbol clearly reads as making a card. Bottom-right index 3, 'Thirty-two discoveries': a golden compass/star rosette with a navy magnifying glass over a tiny city window grid and three little stars, no numbers. Consistent stroke density, same visual weight, completely independent non-touching cells, no shadow outside stamps. Produce polished original GAME UI COLLECTIBLE assets, not a presentation mockup.

## 三张场景的公共前缀

参考：固定提交7b944b9的 `public/art-cooperate.webp` 与 `public/art-talk.webp`，已保留在本目录baseline子目录。实际每次提交的提示词为下面公共前缀加对应场景后缀。

> Create a polished original 3:4 portrait illustration for Roam, a sunny two-person city-walking card game. Match the attached reference's charming detailed retro PIXEL ART: clean stepped pixel edges, simple readable clusters, warm sunlight, pale sandstone streets, blue sky, leafy green plants, subtle teal magical hint symbols. SAME two adult friends as references: short dark-brown-haired man in open blue shirt over white tee and navy trousers with dark backpack; long wavy brown-haired woman in cream baseball cap, terracotta/orange top, light blue jeans, white trainers, tan backpack. No lettering, numerals, logos, frame, HUD, card border or watermark. This must be art only. Faces natural and friendly, anatomy correct. IMPORTANT UI SAFE COMPOSITION: the game crops a WIDE horizontal slice from the middle of this portrait; BOTH faces, their hands, and the main shared action must appear BETWEEN 30% and 60% of image height, centrally grouped; keep them relatively small enough to fit this middle band, leave pleasant simpler sky and architecture above and lower street/furniture below. Avoid tiny fussy detail. Limited harmonious navy, sky blue, green, warm cream, amber and terracotta palette. Do not add more people.

### improv 场景后缀

> Scene: 'Street-corner improv stage'. The two friends at a sunny little street corner pretend to be storytellers. Woman on left makes a small playful bird shape with both hands close to chest while the man on right responds with one expressive open palm and a friendly smile. The story action is immediately readable in the shared middle safe band. Behind them an empty pale stone low wall, green climbing vine and tiny cafe awning; a few teal sparkle/speech hint shapes high near the hands (blank, no text). No actual stage, microphone or large raised arms. Warm spontaneous quiet fun.

### shapes 场景后缀

> Scene: 'Collecting city shapes'. The two friends pause at a sunny street window. Woman on left points at a round reflection in a shop window while man on right holds a SMALL cream shape-finding card close between their faces and points to a geometric shadow on the window. The shared action and faces sit in the middle safe band. Distinct circle reflection, square windowpanes and a triangular patch of sunlight make the city visually playful. Soft architecture, no signs/words, no people behind the window. Focus on their cooperation and discovering ordinary shapes, no giant camera or phone.

### postcard 场景后缀

> Scene: 'A note for our next walk'. Two friends sit side by side at a small pale stone outdoor public table in a green pocket park, facing slightly toward each other. Their upper bodies, faces, one little blank cream postcard being passed between hands, and a short pencil all grouped in the middle safe band. Woman smiles as she passes the small postcard to the man, who receives it with one hand; the other hands rest naturally on table. A terracotta plant pot, leafy tree and soft city roofs behind them, calm sunny afternoon. Postcard has no marks or text, no paper flying, no envelopes covering faces.
