# Сверх-промт для создания 2D спрайт-листа с твоим лицом

**Цель:** Сгенерировать структурированную сетку (спрайт-лист) 2D-персонажа-боксера в точности, как на `image_11.png`, но с лицом, соответствующим загруженному эталонному фото лица.

**Входные данные:**

* **Референсное изображение (Reference Image):** Тебе необходимо загрузить свою фотографию в систему генерации.
* **Промт (текст ниже).**
* **ControlNet:** Для сохранения точных поз и макета, как на `image_11.png`, тебе потребуется использовать ControlNet (Canny или OpenPose). Дополнительно, для сходства лица, нужен ControlNet-плагин для замены лица (например, InsightFace).

---

### Текстовый Промт (Text-to-Image / Image-to-Image)

Скопируйте и вставьте этот текст в поле промта вашей системы генерации:

```text
2D comic vector illustration style, cel-shaded coloring, clean line art. A full body male boxer with an athletic build, perfectly mirroring the structured sprite sheet layout of image_11.png on a transparent background. The character’s face is an exact likeness of the provided face reference image. Character wears a white t-shirt with a box logo, red and black trim boxing shorts, black boots, and red boxing gloves. All figures are side-view or corrected rear-view for anatomical accuracy, especially in Row 2, Poses 3a and 3b. The grid structure is:
Row 1: Four walking forward in-stance poses (labeled 4a, 4b, 4c, 4d).
Row 2: Left-facing stance (2a), left jab (2b), right-facing stance rear-view (corrected 3a), right punch rear-view (corrected 3b).
Row 3: Sequential jump sequence: crouch (6a), takeoff (6b), mid-air (6c), landing (6d).
Row 4: Four walking backward casual poses (labeled 5a, 5b, 5c, 5d).
All poses are clean, high resolution, sharp details, with small labels (4a, 4b, etc.) clearly below each figure. The white background is removed and is fully transparent.