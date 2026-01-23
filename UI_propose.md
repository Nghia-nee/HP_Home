# UI PROPOSAL – HP HOME

**Project name:** HP Home
**Tagline:** *HP Home – Phòng trọ & Căn hộ giá tốt TP.HCM*

---

## 1. Mục tiêu UI

* Hiển thị tốt trên **mobile và desktop** (mobile-first)
* Giao diện **đơn giản – ít chữ – dễ bấm**
* Điều hướng rõ ràng theo luồng:

```
Giá → Quận → Phường → Danh sách phòng
```

* Tránh dead-end UX: **không hiển thị button nếu không có phòng**
* Dễ mở rộng thêm quận/phường trong tương lai

---

## 2. Nguyên tắc thiết kế

* **Mobile-first**
* Button dạng **panel / card lớn** (dễ bấm)
* Không hiển thị dữ liệu rỗng
* Điều hướng bằng **route (URL)**, không chỉ đổi state

---

## 3. Cấu trúc tổng thể (Layout)

### 3.1 Header (hiển thị trên mọi trang)

**Vị trí:** Top – fixed hoặc static

**Thành phần:**

* Logo công ty (bên trái)
* Tên công ty: **HP Home**
* Tiêu ngữ: *Phòng trọ & Căn hộ giá tốt TP.HCM*

---

## 4. Trang Home (Trang chính)

### 4.1 Section: Chọn mức giá

Hiển thị 2 panel button lớn:

* **Dưới 4 triệu**
* **Trên 4 triệu**

**Hành vi:**

* Click → chuyển route theo mức giá

Ví dụ:

```
/price/under-4m
/price/over-4m
```

---

### 4.2 Section: Chọn quận

Danh sách panel button (dynamic):

* Tân Phú
* Tân Bình
* (có thể mở rộng thêm trong tương lai)

**Điều kiện hiển thị:**

* Chỉ hiển thị quận nếu `roomCount > 0`

**Hành vi:**

* Click → chuyển sang trang quận

Ví dụ:

```
/price/under-4m/tan-binh
```

---

## 5. Trang Quận – Chọn Phường

### 5.1 Danh sách phường

Hiển thị dạng grid các button:

* Phường 1
* Phường 2
* ...
* Phường 15

**Điều kiện hiển thị:**

* Chỉ render phường nếu phường đó có ít nhất 1 phòng phù hợp filter

**Hành vi:**

* Click → chuyển sang trang danh sách phòng

Ví dụ:

```
/price/under-4m/tan-binh/phuong-1
```

---

## 6. Trang Danh sách Phòng (Room Listing)

### 6.1 Room Card

Mỗi phòng hiển thị dưới dạng card:

**Thành phần:**

* Image carousel (3–5 ảnh)
* Giá phòng
* Danh sách tag (badge)

**Ví dụ tag:**

* Ban công
* Duplex (có gác)
* Máy lạnh
* Gần chợ

---

### 6.2 Tag hiển thị

* Tag hiển thị dưới dạng **badge**
* Một phòng có thể có **nhiều tag cùng lúc**

---

## 7. Responsive Behavior

### 7.1 Mobile

* 1 cột
* Button full-width
* Card xếp dọc

### 7.2 Desktop

* Grid 2–3 cột
* Button panel lớn
* Khoảng cách rộng hơn

---

## 8. Điều hướng & Routing

UI sử dụng routing rõ ràng, dễ SEO và debug:

```
/price/:priceRange
/price/:priceRange/:district
/price/:priceRange/:district/:ward
```

---

## 9. Tương tác với Backend (ở mức UI cần biết)

UI **không xử lý logic lọc phức tạp**, backend trả dữ liệu đã lọc sẵn.

### Ví dụ:

* Lấy danh sách quận có phòng:

```
GET /districts?priceRange=under-4m
```

* Lấy danh sách phường có phòng:

```
GET /wards?district=tan-binh&priceRange=under-4m
```

* Lấy danh sách phòng:

```
GET /rooms?district=tan-binh&ward=phuong-1&priceRange=under-4m
```

---

## 10. Mở rộng trong tương lai

* Thêm tag filter nâng cao
* Trang chi tiết phòng
* Tìm kiếm theo keyword
* Bản đồ (map view)

---

## 11. Kết luận

UI này được thiết kế để:

* Đơn giản cho người dùng phổ thông
* Dễ triển khai với backend nhẹ
* Phù hợp deploy trên AWS Free Tier
* Dễ mở rộng mà không cần thay đổi cấu trúc lớn

---

**End of UI Proposal**
