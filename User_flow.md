# USER FLOW – HP HOME

Mục tiêu tài liệu này là mô tả **luồng hành vi người dùng (User Flow)** rõ ràng để developer / AI khác có thể triển khai UI + API **đúng ý đồ**, không suy diễn.

---

## 1. Tổng quan User Flow

Luồng chính của người dùng:

```
Home
 → Chọn mức giá
   → Chọn quận
     → Chọn phường
       → Xem danh sách phòng
```

Nguyên tắc:

* Mỗi bước **chỉ hiển thị lựa chọn có dữ liệu**
* Tránh click vào trang rỗng (no room)
* Điều hướng bằng URL (route-based)

---

## 2. Flow chi tiết từng bước

### 2.1 Bước 1 – Truy cập Home Page

**URL:** `/`

**UI hiển thị:**

* Header: Logo + tên công ty + tagline
* 2 panel button lớn:

  * `Dưới 4 triệu`
  * `Trên 4 triệu`

**User action:**

* User click chọn **1 mức giá**

**System behavior:**

* Điều hướng sang trang chọn quận theo mức giá

---

### 2.2 Bước 2 – Chọn mức giá

**Ví dụ URL:**

```
/price/under-4m
```

**UI hiển thị:**

* Danh sách quận (panel button)

**Điều kiện hiển thị:**

* Chỉ hiển thị quận nếu có ít nhất 1 phòng thuộc mức giá đã chọn

**User action:**

* User chọn 1 quận (ví dụ: Tân Bình)

**System behavior:**

* Điều hướng sang trang quận

---

### 2.3 Bước 3 – Chọn quận

**Ví dụ URL:**

```
/price/under-4m/tan-binh
```

**UI hiển thị:**

* Grid các button phường (Phường 1 → Phường 15)

**Điều kiện hiển thị:**

* Chỉ render phường nếu phường đó có phòng phù hợp filter (giá + quận)

**User action:**

* User click chọn 1 phường

**System behavior:**

* Điều hướng sang trang danh sách phòng

---

### 2.4 Bước 4 – Xem danh sách phòng

**Ví dụ URL:**

```
/price/under-4m/tan-binh/phuong-1
```

**UI hiển thị:**

* Danh sách Room Card

**Mỗi Room Card bao gồm:**

* Image carousel (3–5 ảnh)
* Giá phòng
* Tag (badge): Ban công, Duplex, Máy lạnh, ...

**User action:**

* User xem phòng
* (Optional – future) click vào phòng để xem chi tiết

---

## 3. Hành vi đặc biệt & Edge Cases

### 3.1 Không có dữ liệu

* Nếu **một quận không có phòng** → không hiển thị button quận
* Nếu **một phường không có phòng** → không hiển thị button phường

→ Tránh dead click và UX xấu

---

### 3.2 Responsive behavior

**Mobile:**

* 1 cột
* Button full width
* Card xếp dọc

**Desktop:**

* Grid 2–3 cột
* Button dạng panel lớn

---

## 4. Mapping User Flow → Backend (ở mức logic)

### 4.1 Load quận theo mức giá

```
GET /districts?priceRange=under-4m
```

→ Trả về danh sách quận + roomCount

---

### 4.2 Load phường theo quận + giá

```
GET /wards?district=tan-binh&priceRange=under-4m
```

→ Chỉ trả phường có room

---

### 4.3 Load phòng theo phường

```
GET /rooms?district=tan-binh&ward=phuong-1&priceRange=under-4m
```

---

## 5. Kết luận

User Flow này được thiết kế để:

* Đơn giản cho người dùng phổ thông
* Dễ code cho frontend
* Giảm logic xử lý ở UI
* Phù hợp với backend nhẹ và AWS Free Tier

---

**End of User Flow Document**
