# Termdex

Từ điển thuật ngữ công nghệ tiếng Việt, chạy hoàn toàn trên trình duyệt. Không backend, không cơ sở dữ liệu và không cần bước build.

## Chạy thử trên máy

Từ thư mục dự án, chạy một máy chủ HTTP tĩnh:

```bash
python3 -m http.server 8000
```

Mở `http://localhost:8000`. Không mở `index.html` trực tiếp bằng `file://`, vì trình duyệt chặn `fetch()` tệp JSON theo cách đó.

## Đăng lên GitHub Pages

1. Đưa toàn bộ các tệp trong repository lên nhánh `main` (hoặc nhánh bạn muốn dùng).
2. Trong repository, mở **Settings → Pages**.
3. Ở **Build and deployment**, chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`, rồi lưu.
4. Chờ GitHub Pages công bố địa chỉ website. Mỗi lần cập nhật và push các tệp JSON, trang sẽ lấy dữ liệu mới.

Trang dùng đường dẫn tương đối, vì vậy có thể chạy tại domain gốc hoặc URL dạng `username.github.io/repository/`.

## Cấu trúc dữ liệu

- `data/index.json` liệt kê các tệp JSON để tải.
- Mỗi tệp chủ đề chứa `meta` và mảng `items`.
- Một mục gồm `id`, `title`, `category`, `tags`, `content` và `example`.

Ví dụ:

```json
{
  "id": "web-api",
  "title": "API",
  "category": "Lập trình",
  "tags": ["tích hợp", "web"],
  "content": "Giải thích ngắn gọn bằng tiếng Việt.",
  "example": "Một ví dụ sử dụng trong thực tế."
}
```

Để thêm một tệp chủ đề mới, đặt tệp trong `data/` rồi thêm tên tệp vào mảng `files` của `data/index.json`. Nếu chỉ thêm mục vào tệp sẵn có, không cần đổi mã giao diện.

## Tính năng hiện có

- Tìm kiếm tức thì có debounce, không phân biệt dấu và chịu được một số lỗi gõ nhẹ.
- Lọc đồng thời theo chủ đề và thẻ.
- Chia sẻ truy vấn bằng URL: `?q=...&cat=...&tag=...`.
- Trạng thái đang tải, không có kết quả và lỗi tải JSON; có thể thử lại.
- Sao chép nhanh tên thuật ngữ; phím `/` đưa con trỏ tới ô tìm kiếm.
- Responsive, không phụ thuộc framework hay thư viện JavaScript bên ngoài.
