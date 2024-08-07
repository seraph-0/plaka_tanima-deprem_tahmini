import cv2
import numpy as np
from scipy.spatial import distance
import pytesseract
import re

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

try:
    # Open the image
    image = cv2.imread('uploads/input.jpg')

    # Resmin yüksekliğini ve genişliğini al
    height, width, _ = image.shape

    # Yeni genişlik ve yükseklik hesapla (16:9 formatı için)
    new_width = width
    new_height = int(new_width * 9 / 16)

    # Eğer yeni yükseklik mevcut yükseklikten büyükse, yeni yükseklik ve genişlik hesapla
    if new_height > height:
        new_height = height
        new_width = int(new_height * 16 / 9)

    # Kırpma alanının sol üst köşesini hesapla
    start_x = 0
    start_y = height - new_height

    # Kırpma alanını belirle
    crop_image = image[start_y:start_y + new_height, start_x:start_x + new_width]

    # Görüntüyü 1280x720 çözünürlüğüne yeniden boyutlandır
    resized_image = cv2.resize(crop_image, (1280, 720))

    # Resmin yüksekliğini ve genişliğini al
    height, width, _ = resized_image.shape

    # Gri tonlamalıya dönüştür
    gray = cv2.cvtColor(resized_image, cv2.COLOR_BGR2GRAY)

    # Median filtre uygula
    filtered_image = cv2.medianBlur(gray, 5)

    # Sobel X ve Sobel Y filtrelerini uygula
    sobel_x = cv2.Sobel(filtered_image, cv2.CV_64F, 0, 1, ksize=3)
    sobel_y = cv2.Sobel(filtered_image, cv2.CV_64F, 1, 0, ksize=3)

    # Sobel X ve Sobel Y filtrelerinin birleşimini hesapla
    sobel_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)

    # Sobel magnitude görüntüsünü normalize et ve uint8 formatına çevir
    sobel_magnitude = np.uint8(255 * sobel_magnitude / np.max(sobel_magnitude))

    # Eşik değeri ile beyaz bölgeleri belirle
    _, binary_image = cv2.threshold(sobel_magnitude, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Beyaz bölgeleri bulmak için kontur tespiti
    contours, _ = cv2.findContours(binary_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    filled_image = np.zeros_like(binary_image)

    cv2.drawContours(filled_image, contours, -1, (255, 255, 255), thickness=cv2.FILLED)

    # Büyük konturları (beyaz bölgeleri) maskeleme
    kernel = np.ones((35, 7), np.uint8)
    erosion = cv2.erode(filled_image, kernel, iterations=1)
    dilation = cv2.dilate(erosion, kernel, iterations=1)

    contours, _ = cv2.findContours(dilation, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # En büyük binary nesneyi bul
    largest_contour = max(contours, key=cv2.contourArea)

    # Yeni bir boş görüntü oluştur
    largest_contour_image = np.zeros_like(dilation)

    # En büyük binary nesneyi çiz
    cv2.drawContours(largest_contour_image, [largest_contour], -1, (255, 255, 255), thickness=cv2.FILLED)

    # OR işlemi uygula
    masked_image = cv2.bitwise_and(resized_image, resized_image, mask=largest_contour_image)

    # En büyük kontur bölgesini kes
    x, y, w, h = cv2.boundingRect(largest_contour)
    cropped_image = masked_image[y:y+h, x:x+w]

    gauss_image = cv2.GaussianBlur(cropped_image, (5,5),0)

    # K-means algoritması ile renk analizi yap
    Z = cropped_image.reshape((-1, 3))
    Z = np.float32(Z)

    # K-means kriterleri ve uygulaması
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    K = 2  # K-means için küme sayısı
    _, labels, centers = cv2.kmeans(Z, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

    # Merkezleri uint8'e çevir
    centers = np.uint8(centers)
    res = centers[labels.flatten()]
    result_image = res.reshape((cropped_image.shape))

    # Renk kümelerini ve yüzdelerini hesapla
    def calculate_color_percentages(labels, centers):
        # Her kümenin yüzdesini hesapla
        label_counts = np.bincount(labels)
        total_count = len(labels)
        percentages = label_counts / total_count * 100
        return percentages

    # Renk kümelerini ve yüzdelerini yazdır
    def print_color_percentages(centers, percentages):
        for i, (center, percent) in enumerate(zip(centers, percentages)):
            print(f"Küme {i}: Renk {center} - Yoğunluk % {percent:.2f}")

    # Renkleri sınıflandırma fonksiyonu
    def classify_color(center):
        # Renkler ve isimleri (BGR formatında)
        colors = {
            "Yeşil": [0, 170, 0],
            "Kırmızı": [0, 0, 170],
            "Mavi": [170, 0, 0],
            "Siyah": [0, 0, 0],
            "Beyaz": [170, 170, 170]
        }
        
        # En yakın rengi bul
        min_dist = float('inf')
        closest_color = None
        for color_name, color_value in colors.items():
            dist = distance.euclidean(center, color_value)
            if dist < min_dist:
                min_dist = dist
                closest_color = color_name
        return closest_color

    # Yoğunluk yüzdelerini hesapla ve yazdır
    percentages = calculate_color_percentages(labels.flatten(), centers)
    print_color_percentages(centers, percentages)

    # En yüksek ve en düşük yoğunluklu renkleri bul
    max_index = np.argmax(percentages)
    min_index = np.argmin(percentages)

    max_color = classify_color(centers[max_index])
    min_color = classify_color(centers[min_index])

    def print_plate_type(max_color, min_color):
        # Yüksek yoğunluklu renk için duruma göre yazdır
        if max_color == "Yeşil":
            return "Yeşil Plaka: Yurt Dışı Bağlantılı Plakala"
        elif (max_color == "Beyaz" and min_color == "Kırmızı") or (min_color == "Beyaz" and max_color == "Kırmızı"):
            return "Kırmızı-Beyaz Plaka: Üst Düzey Yönetici Plakası"
        elif max_color == "Mavi":
            return "Mavi Plaka: Polis Plakası"
        elif max_color == "Siyah" and min_color != "Beyaz":
            return "Siyah Plaka: Resmi Araç Plakası"
        elif max_color == "Beyaz" and min_color == "Siyah":
            return "Standart Plaka"
        else:
            return "Standart Plaka"
                
    def remove_non_digit_prefix(text):
        # İlk karakter sayı olana kadar baştaki karakterleri sil
        while len(text) > 0 and not text[0].isdigit():
            text = text[1:]
        return text

    # Plaka türünü belirleme
    plate_type = print_plate_type(max_color, min_color)

    plaka_kod = {
        "01": "Adana",
        "02": "Adıyaman",
        "03": "Afyonkarahisar",
        "04": "Ağrı",
        "05": "Amasya",
        "06": "Ankara",
        "07": "Antalya",
        "08": "Artvin",
        "09": "Aydın",
        "10": "Balıkesir",
        "11": "Bilecik",
        "12": "Bingöl",
        "13": "Bitlis",
        "14": "Bolu",
        "15": "Burdur",
        "16": "Bursa",
        "17": "Çanakkale",
        "18": "Çankırı",
        "19": "Çorum",
        "20": "Denizli",
        "21": "Diyarbakır",
        "22": "Edirne",
        "23": "Elazığ",
        "24": "Erzincan",
        "25": "Erzurum",
        "26": "Eskişehir",
        "27": "Gaziantep",
        "28": "Giresun",
        "29": "Gümüşhane",
        "30": "Hakkari",
        "31": "Hatay",
        "32": "Isparta",
        "33": "Mersin",
        "34": "İstanbul",
        "35": "İzmir",
        "36": "Kars",
        "37": "Kastamonu",
        "38": "Kayseri",
        "39": "Kırklareli",
        "40": "Kırşehir",
        "41": "Kocaeli",
        "42": "Konya",
        "43": "Kütahya",
        "44": "Malatya",
        "45": "Manisa",
        "46": "Kahramanmaraş",
        "47": "Mardin",
        "48": "Muğla",
        "49": "Muş",
        "50": "Nevşehir",
        "51": "Niğde",
        "52": "Ordu",
        "53": "Rize",
        "54": "Sakarya",
        "55": "Samsun",
        "56": "Siirt",
        "57": "Sinop",
        "58": "Sivas",
        "59": "Tekirdağ",
        "60": "Tokat",
        "61": "Trabzon",
        "62": "Tunceli",
        "63": "Şanlıurfa",
        "64": "Uşak",
        "65": "Van",
        "66": "Yozgat",
        "67": "Zonguldak",
        "68": "Aksaray",
        "69": "Bayburt",
        "70": "Karaman",
        "71": "Kırıkkale",
        "72": "Batman",
        "73": "Şırnak",
        "74": "Bartın",
        "75": "Ardahan",
        "76": "Iğdır",
        "77": "Yalova",
        "78": "Karabük",
        "79": "Kilis",
        "80": "Osmaniye",
        "81": "Düzce"
    }

    # pytesseract ile text çıkarımı
    text = pytesseract.image_to_string(gauss_image, config='--psm 10')
    
    # Harf ve sayılar dışında olan karakterleri temizle
    cleaned_text = re.sub(r'[^\w\s]', '', text)
    result_text = remove_non_digit_prefix(cleaned_text)

    # Format kontrolü için düzenli ifade
    pattern = r'^\d{2} [A-Za-z]{1,4} \d{1,4}$'
    pattern2 = r'^\d{2}[A-Za-z]{1,4}\d{1,4}$'

    sehir_kod = cleaned_text[:2]
    sehir = plaka_kod.get(sehir_kod)

    if re.fullmatch(pattern, result_text.strip()) or re.fullmatch(pattern2, result_text.strip()):
        #print("Tespit edilen Plaka:", result_text.strip())
        with open('output.txt', 'w', encoding='utf-8') as file:
            file.write("Tespit Edilen Plaka: " + result_text.strip() + "\n")
            file.write(f"Plaka, {sehir} şehrine aittir.\n")
            file.write(plate_type)
    else:
        #print("Üzgünüz Plaka tespit edilemedi.")
        with open('output.txt', 'w', encoding='utf-8') as file:
            file.write("Plaka Tespit Edilemedi.")

except Exception as e:
    with open('output.txt', 'w', encoding='utf-8') as file:
        file.write("Plaka Tespit Edilemedi.")

# Sonuçları göster
#cv2.imshow('Res2ult', median_image)
#cv2.imshow('Result', cropped_image)
#cv2.imshow('Res22lt', result_image)


#cv2.waitKey(0)  # Bir tuşa basılmasını bekler

# Tüm pencereleri kapat
#cv2.destroyAllWindows()