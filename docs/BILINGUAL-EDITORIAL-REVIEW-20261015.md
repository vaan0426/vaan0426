# Редакционен преглед и два езика — 15 октомври 2026

Проверени са осемте налични публикации. Българските текстове са преработени за ясна местна употреба, а английските следват същите резултати и ограничения. Добавени са кратки справки за дизайна, участниците и проследяването. Не са добавяни непосочени в източниците проценти на успех, процедури или обещания за лечение.

Езиковият бутон с икона на глобус и BG / EN е в основното меню на десетте активни страници, включително административния интерфейс. Изборът се помни в браузъра и може да се споделя с `?lang=en` или `?lang=bg`. Формите запазват избрания час, услугата и бележката. Не се използва външна услуга за превод на посетителските данни.

## Проверка на източниците

- Програми за родители: [Haglund и съавт.](https://link.springer.com/article/10.1186/s12889-026-28844-6). Изрично е отбелязано разминаването между общия брой участници в резюмето и основния текст; не е избрано произволно едно число.
- Сън и настроение: [Galling и съавт.](https://link.springer.com/article/10.1007/s00787-026-03146-9). Разграничени са симптоми и предотвратяване на диагноза; уточнено е, че не всички участници са тийнейджъри.
- Социални мрежи: [Singh и съавт.](https://jamanetwork.com/journals/jamapediatrics/fullarticle/2843720). Премахната е редакционната идея за домашно упражнение; текстът се придържа към наблюдателните резултати и измереното време след училище.
- Детска тревожност: [Elfström и съавт.](https://doi.org/10.1111/jcpp.14151). Разграничени са основният клиничен резултат, родителските въпросници и възрастовата подгрупа.
- Двойки: [Kernová и съавт.](https://link.springer.com/article/10.1186/s40359-025-03444-y). Уточнени са 15 изследвания в прегледа срещу шест в метаанализа и значението на размера на ефекта.
- След насилие: [Crespo и съавт.](https://pubmed.ncbi.nlm.nih.gov/41065656/). Датата е уточнена до 9 октомври 2025 г.; достъпът до научното резюме е обозначен.
- Фобии: [Francová и съавт.](https://pubmed.ncbi.nlm.nih.gov/40186999/). Посочени са реалната извадка, броят сесии и краткото проследяване, без измислена успеваемост; обозначено е използването на резюмето.
- Констелации: [Konkoly Thege и съавт.](https://research.rug.nl/en/publications/an-updated-systematic-review-on-the-effectiveness-of-family-const/). По-старият обзор е обозначен като контекст, с ограниченията и информацията за нежелани ефекти.

Редактираните паралелни текстове са запазени в `docs/editorial-reviewed-content-20261015.json`. Публикуваните данни са в `platform/news/articles.json`.

## Разнообразни илюстрации

Осeмте публикации използват осем различни изображения. Четири от предишните сцени са заменени с нови; старите файлове са запазени. Има и четири нови неизползвани резервни илюстрации. Каталогът `platform/news/image-catalog.json` пази тема, композиция, описание на двата езика и SHA-256.

Бъдещият издател допуска само подходящо неизползвано изображение и спира повторението по път, идентификатор, хеш и композиция. При изчерпване на подходящите резерви пропуска публикацията и записва причината. Генерирането на нови уникални изображения не е представено като неограничена автоматична услуга; библиотеката трябва да се допълва с нови сцени. Няма скрит платен API.

Всички осем нови изображения по-долу са създадени с вградения `image_gen` чрез умението imagegen. Референция само за стила: `platform/images/service-stress-anxiety-support-v2.png`. Сайтът зарежда оптимизирани JPEG 768×768; PNG оригиналите са запазени. Сцените са символични, не действителни участници или точните процедури от изследванията.

### parent-workshop-v2

- PNG: `platform/images/news-parent-workshop-v2.png`
- JPEG: `platform/images/news-parent-workshop-v2-optimized.jpg`
- Публикация: `roditelska-podkrepa-malki-polzi-metaanaliz-2026`

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: Wide view of a community parenting workshop: three distinct adult parents, a father with glasses, a mother with short auburn hair, and a darker-skinned mother, sitting around a round table exploring simple emotion cards with colored face icons, a female facilitator nearby. No children present. Warm sunlit community room, uncluttered boards with abstract color shapes only. Emphasize learning together, not a therapy couch.
```

### child-confidence-garden-v2

- PNG: `platform/images/news-child-confidence-garden-v2.png`
- JPEG: `platform/images/news-child-confidence-garden-v2-optimized.jpg`
- Публикация: `roditeli-detska-trevozhnost`

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: Outdoor garden scene, a child age six practicing riding a small bicycle slowly along a safe flat garden path, wearing a bicycle helmet, an attentive father crouching at a respectful distance and smiling with encouragement, mother watching from a bench. Quiet morning light, wildflowers and green leaves. No traffic, no danger, no text. Natural full-body framing showing growing confidence.
```

### couple-online-kitchen-v2

- PNG: `platform/images/news-couple-online-kitchen-v2.png`
- JPEG: `platform/images/news-couple-online-kitchen-v2-optimized.jpg`
- Публикация: `dvoiki-digitalna-podkrepa`

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: Two adults in their thirties, a woman with a short dark bob and a man with close-cropped hair, sitting together at a kitchen island with a tablet showing simple abstract unlettered exercise cards. They are practicing attentive conversation at home while preparing tea, one listens as the other gestures gently. Bright kitchen morning, olive plants, cream ceramics. No counselor, no therapy chairs, no text.
```

### constellation-evidence-desk-v2

- PNG: `platform/images/news-constellation-evidence-desk-v2.png`
- JPEG: `platform/images/news-constellation-evidence-desk-v2-optimized.jpg`
- Публикация: `konstelatsii-kakvo-znaem`

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: An overhead editorial still life: small plain wooden human figurines loosely arranged beside an open notebook with abstract unlettered lines, a magnifying glass, a stack of research papers with simple charts but absolutely no readable text, and an olive branch. Only the edge of an adult hand arranging a figure. An atmosphere of thoughtful evidence examination, warm wooden desk, teal pencil, gold sunlight. No mystical symbols, no magic, no glowing connections, no claims of healing.
```

### reserve-couple-city-walk-v1

- PNG: `platform/images/news-reserve-couple-city-walk-v1.png`
- JPEG: `platform/images/news-reserve-couple-city-walk-v1-optimized.jpg`
- Неизползван резерв за бъдеща подходяща публикация.

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: A wide city riverside walk in early autumn, an adult couple seen from three-quarter profile, both in simple modern coats, walking slowly and listening attentively to each other with open body language. Warm sunlight, muted teal river, ochre leaves, stone railing, generous environment and small full-body characters. No therapist, no table, no phone, no text.
```

### reserve-teen-art-studio-v1

- PNG: `platform/images/news-reserve-teen-art-studio-v1.png`
- JPEG: `platform/images/news-reserve-teen-art-studio-v1-optimized.jpg`
- Неизползван резерв за бъдеща подходяща публикация.

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: Three diverse teenagers in an art studio collaborating on a large abstract painting on a table, wearing casual muted teal, cream and burgundy clothes, short and braided hairstyles, laughing and concentrating together. Sunlit creative workshop, visible paints and pencils, no therapist, no phones, no lettering anywhere. Wide lively group composition with natural anatomy.
```

### reserve-woman-greenhouse-v1

- PNG: `platform/images/news-reserve-woman-greenhouse-v1.png`
- JPEG: `platform/images/news-reserve-woman-greenhouse-v1-optimized.jpg`
- Неизползван резерв за бъдеща подходяща публикация.

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: A hopeful adult woman with short curly dark hair and a cream blouse, seen in three-quarter view in a bright greenhouse, gently potting a small green plant at a wooden bench. Focus on capable hands and calm determined expression, warm golden light through leaves, muted teal pots. Symbolic illustration of personal agency and rebuilding everyday life, no violence, no injuries, no therapist, no text.
```

### reserve-flight-fear-airport-v1

- PNG: `platform/images/news-reserve-flight-fear-airport-v1.png`
- JPEG: `platform/images/news-reserve-flight-fear-airport-v1-optimized.jpg`
- Неизползван резерв за бъдеща подходяща публикация.

Точен промпт:

```text
Use case: illustration-story. Asset type: square editorial illustration for a psychology website. Input reference image: style only; do not copy its orange sweater, characters or composition. Match the warm hand-painted animated-film / graphic-novel medium, fine ink outlines, gouache paper texture, golden cream and ochre, muted teal and olive. Create a distinct scene and diverse natural characters. Thematic symbolic artwork, not study participants and not a representation of a tested intervention. Full composition contained in frame and readable at thumbnail size. No text, no numbers, no logo, no watermark. Scene: A quiet wide airport departure lounge, an adult woman with straight shoulder-length hair sitting upright near a large window with an airplane in the distance. She is looking thoughtfully at the view, hands resting naturally on her knees, travel bag beside her, a supportive companion seated at a little distance. Calm reflective mood, no disaster, no thought bubbles, no panic spectacle. Warm amber sunlight, teal seats, creamy architectural shapes. No signage, no text.
```
