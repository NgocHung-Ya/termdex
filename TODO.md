# TODO — Termdex

- [x] **JSON và danh sách thuật ngữ:** Website tải dữ liệu thuật ngữ từ JSON trong repository và hiển thị danh sách dưới dạng card. Mỗi card trình bày thuật ngữ, phần giải thích tiếng Việt, ví dụ sử dụng, category và tags. Cấu trúc dự án static gồm trang chính, CSS, JavaScript và thư mục `data` chứa các file JSON độc lập.
- [x] **Tìm kiếm và lọc:** Ô tìm kiếm realtime có debounce để lọc thuật ngữ mà không tải lại trang. Bộ lọc theo category và tag có thể kết hợp với nội dung tìm kiếm.
- [x] **Chia sẻ trạng thái tra cứu:** Đồng bộ trạng thái tìm kiếm và category với URL query theo dạng `?q=...&cat=...` để chia sẻ kết quả; khôi phục trạng thái tra cứu từ URL query khi người dùng mở liên kết được chia sẻ.
- [x] **Trạng thái tải dữ liệu:** Hiển thị trạng thái giao diện rõ ràng khi đang tải dữ liệu, khi không có kết quả và khi lỗi tải JSON.
- [x] **Trải nghiệm responsive:** Giao diện responsive, nhẹ và tối ưu cho thao tác tra cứu nhanh trên desktop lẫn thiết bị di động.
- [x] **GitHub Pages:** Repository `NgocHung-Ya/termdex` ở chế độ public; workflow `.github/workflows/pages.yml` triển khai các tệp website tĩnh khi có push vào `main`, với artifact từ `index.html`, `assets/`, `css/`, `data/` và `js/`; xuất bản tại `https://ngochung-ya.github.io/termdex/`.
