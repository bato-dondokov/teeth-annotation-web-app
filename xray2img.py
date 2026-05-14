import os
import json

import numpy as np
import cv2

from ultralytics import YOLO
from config import OBB_SCALE


class Xray2Teeth():
    """
    Class for detecting teeth on an X-ray image.
    Uses a pre-trained YOLO model to identify tooth locations and 
    handles the cropping of individual teeth for further annotation.

    ---
    Класс для обнаружения зубов на рентгеновском снимке.
    Использует предобученную модель YOLO для обнаружения зубов 
    и управляет процессом обрезки отдельных зубов для последующей разметки.
    """


    def __init__(self, model_path):
        """
        Initializes a new instance of the detection class.

        Args:
            model_path (str): The file path to the pre-trained detection model (e.g., a .pt or .onnx file).

        ---
        Создает экземпляр класса.

        Args:
            model_path (str): Путь до модели обнаружения (например, файл .pt или .onnx).
        """
        self.MODEL = YOLO(model_path)


    def get_obbs(self, model, xray_file, xray_shape):
        """
        Extracts oriented bounding boxes (OBBs) from an X-ray image using the detection model 
        and denormalizes them.

        Args:
            model (ultralytics.models.yolo.model.YOLO): The YOLO detection model instance.
            xray_file (str): Path to the X-ray image file.
            xray_shape (numpy.ndarray): Dimensions (height, width) of the original image.

        Returns:
            obbs (numpy.ndarray): Array of denormalized oriented bounding boxes in pixel coordinates.

        ---
        Получает OBB (ориентированные ограничивающие рамки) из рентгеновского снимка 
        с помощью модели обнаружения и денормализует их.

        Args:
            model (ultralytics.models.yolo.model.YOLO): Модель обнаружения YOLO.
            xray_file (str): Путь до рентгеновского снимка.
            xray_shape (numpy.ndarray): Размеры оригинального снимка (высота, ширина).

        Returns:
            obbs (numpy.ndarray): Массив денормализованных OBB в пиксельных координатах.
        """
        results = model.predict(source=xray_file, 
                                        conf=0.25, 
                                        save=False,
                                        show=False)
        norm_obbs = results[0].obb.xyxyxyxyn.numpy()
        obbs = (norm_obbs * np.array(xray_shape)).astype(np.int32)
        return obbs


    def scale_obbs(self, obb, scale):
        """
        Scales an oriented bounding box (OBB) relative to its center.

        Args:
            obb (numpy.ndarray): The original OBB coordinates.
            scale (float): Scaling factor (e.g., 1.1 for a 10% increase).

        Returns:
            new_points (numpy.ndarray): Coordinates of the scaled OBB.
            center (tuple): The (cx, cy) coordinates of the OBB's center point.

        ---
        Масштабирует ориентированную ограничивающую рамку (OBB) относительно её центра.

        Args:
            obb (numpy.ndarray): Координаты исходной OBB.
            scale (float): Параметр масштабирования (например, 1.1 для увеличения на 10%).

        Returns:
            new_points (numpy.ndarray): Координаты масштабированной OBB.
            center (tuple): Координаты (cx, cy) центральной точки OBB.
        """
        cx,cy = np.mean(obb, axis=0).astype(int)
        scale = np.sqrt(scale)

        new_points = []
        for x, y in obb:
            new_x = cx + scale * (x - cx)
            new_y = cy + scale * (y - cy)
            new_points.append((new_x, new_y))
        new_points = np.array(new_points, dtype=int)
        return new_points, (cx, cy)
    

    def crop_xray(self, xray, obb, scale):
        """
        Crops the X-ray image using a bounding box derived from OBB coordinates
        with an additional 1.5x margin.

        Note: This implementation performs an axis-aligned crop (not rotated) 
        based on the min/max extents of the OBB.

        Args:
            xray (numpy.ndarray): The original full-size X-ray image.
            obb (numpy.ndarray): Oriented bounding box coordinates (points).

        Returns:
            cropped_xray (numpy.ndarray): The cropped image fragment.

        ---
        Обрезает рентгеновский снимок по границам OBB с дополнительным 
        коэффициентом расширения 1.5.

        Примечание: Данная реализация выполняет обрезку по осям координат 
        (без поворота) на основе минимальных и максимальных границ OBB.

        Args:
            xray (numpy.ndarray): Исходное полноразмерное изображение.
            obb (numpy.ndarray): Координаты ориентированной ограничивающей рамки.

        Returns:
            cropped_xray (numpy.ndarray): Обрезанный фрагмент снимка.
        """
        x1 = obb[:, 0].min()
        y1 = obb[:, 1].min()
        x2 = obb[:, 0].max()
        y2 = obb[:, 1].max()

        center_x = int((x1 + x2) / 2)
        center_y = int((y1 + y2) / 2)
        
        new_x1 = center_x + int((x1 - center_x) * scale)
        new_y1 = center_y + int((y1 - center_y) * scale)
        new_x2 = center_x + int((x2 - center_x) * scale)
        new_y2 = center_y + int((y2 - center_y) * scale)

        if new_x1 < 0:
            new_x1 = 0
        if new_y1 < 0:
            new_y1 = 0
        if new_x2 > xray.shape[1]:
            new_x2 = xray.shape[1]
        if new_y2 > xray.shape[0]:
            new_y2 = xray.shape[0]

        cropped_xray = xray[new_y1:new_y2, new_x1:new_x2]
        return cropped_xray


    def process(self):
        if self.XRAY_FILE:
            """
            Executes the full tooth detection and processing pipeline:
                1) Creates a copy of the original image for subsequent cropping.
                2) Detects and scales the oriented bounding boxes (OBBs).
                3) Draws detection boxes on the visualization image and crops the copy.
                4) Saves the resulting tooth images to the specified directory.

            ---
            Запускает процесс обнаружения зубов на снимке:
                1) Копирует исходный снимок для дальнейшей обрезки;
                2) Получает и масштабирует OBB;
                3) Рисует на снимке рамки и обрезает копию снимка;
                4) Сохраняет полученные изображения.
            """
            self.XRAY_IMG = cv2.imread(self.XRAY_FILE)
            xray_shape = np.array(self.XRAY_IMG.shape)[1::-1]

            xray_file = os.path.basename(self.XRAY_FILE)
            if xray_file.lower().endswith((".jpg", ".png")):
                xray_dir = os.path.join(self.TEETH_DIR, xray_file[:-4])
            if xray_file.lower().endswith(".jpeg"):
                xray_dir = os.path.join(self.TEETH_DIR, xray_file[:-5])
            obbs = self.get_obbs(self.MODEL, self.XRAY_FILE, xray_shape)
            obbs_to_save = {str(i): arr.tolist() for i, arr in enumerate(obbs)}
            if obbs.size < 1:
                return False
            for i, obb in enumerate(obbs):
                xray = self.XRAY_IMG.copy()
                xray_for_crop = self.XRAY_IMG.copy()
                obb_img = cv2.polylines(
                    img=xray,
                    pts=[obb],
                    isClosed=True,
                    color=(255, 255, 0),
                    thickness=2
                )

                scaled_obb, center = self.scale_obbs(obb, OBB_SCALE)
                scaled_obb_img = cv2.polylines(
                    img=xray_for_crop,
                    pts=[scaled_obb],
                    isClosed=True,
                    color=(255, 255, 0),
                    thickness=2
                )
                
                cropped_img = self.crop_xray(
                    scaled_obb_img, 
                    obb,
                    OBB_SCALE
                )
                obbs_dir = os.path.join(xray_dir, str(i))
                os.makedirs(obbs_dir, exist_ok=True)

                obb_file_name = os.path.join(obbs_dir, f'{i}.png')
                obb_cropped_file_name = os.path.join(obbs_dir, f'{i}-cropped.png')
                cv2.imwrite(obb_file_name, obb_img)
                cv2.imwrite(obb_cropped_file_name, cropped_img)
            with open(os.path.join(xray_dir, "obbs.json"), 'w', encoding='utf-8') as f:
                json.dump(obbs_to_save, f, indent=4)
            return True
        else: return False