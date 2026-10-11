// Dữ liệu Tỉnh/Thành phố, Quận/Huyện, Phường/Xã Việt Nam chuẩn hoá phục vụ chọn địa chỉ
export const VIETNAM_LOCATIONS = [
  {
    name: "Hà Nội",
    districts: [
      { name: "Ba Đình", wards: ["Phúc Xá", "Trúc Bạch", "Vĩnh Phúc", "Cống Vị", "Liễu Giai", "Nguyễn Trung Trực", "Quán Thánh", "Điện Biên", "Đội Cấn", "Ngọc Hà", "Kim Mã", "Giảng Võ", "Thành Công"] },
      { name: "Hoàn Kiếm", wards: ["Phan Chu Trinh", "Hàng Bạc", "Hàng Gai", "Hàng Bông", "Cửa Đông", "Cửa Nam", "Đồng Xuân", "Hàng Buồm", "Hàng Đào", "Hàng Mã", "Hàng Trống", "Lý Thái Tổ", "Tràng Tiền"] },
      { name: "Đống Đa", wards: ["Cát Linh", "Văn Miếu", "Quốc Tử Giám", "Láng Thượng", "Ô Chợ Dừa", "Văn Chương", "Hàng Bột", "Nam Đồng", "Trung Phụng", "Khâm Thiên", "Phương Mai", "Kim Liên", "Quang Trung", "Trung Liệt", "Phương Liên", "Thịnh Quang", "Trung Tự", "Láng Hạ", "Ngã Tư Sở"] },
      { name: "Cầu Giấy", wards: ["Dịch Vọng", "Dịch Vọng Hậu", "Mai Dịch", "Nghĩa Đô", "Nghĩa Tân", "Quan Hoa", "Trung Hòa", "Yên Hòa"] },
      { name: "Hai Bà Trưng", wards: ["Bạch Đằng", "Bách Khoa", "Bạch Mai", "Cầu Dền", "Đống Mác", "Đồng Nhân", "Đồng Tâm", "Lê Đại Hành", "Minh Khai", "Nguyễn Du", "Phạm Đình Hổ", "Phố Huế", "Quỳnh Lôi", "Quỳnh Mai", "Thanh Lương", "Thanh Nhàn", "Trương Định", "Vĩnh Tuy"] },
      { name: "Hoàng Mai", wards: ["Đại Kim", "Định Công", "Giáp Bát", "Hoàng Liệt", "Hoàng Văn Thụ", "Lĩnh Nam", "Mai Động", "Tân Mai", "Thanh Trì", "Thịnh Liệt", "Trần Phú", "Tương Mai", "Vĩnh Hưng", "Yên Sở"] },
      { name: "Thanh Xuân", wards: ["Hạ Đình", "Khương Đình", "Khương Mai", "Khương Trung", "Kim Giang", "Nhân Chính", "Phương Liệt", "Thanh Xuân Bắc", "Thanh Xuân Nam", "Thanh Xuân Trung", "Thượng Đình"] },
      { name: "Tây Hồ", wards: ["Bưởi", "Nhật Tân", "Phú Thượng", "Quảng An", "Thụy Khuê", "Tứ Liên", "Xuân La", "Yên Phụ"] },
      { name: "Nam Từ Liêm", wards: ["Cầu Diễn", "Đại Mỗ", "Mễ Trì", "Mỹ Đình 1", "Mỹ Đình 2", "Phú Đô", "Phương Canh", "Tây Mỗ", "Trung Văn", "Xuân Phương"] },
      { name: "Bắc Từ Liêm", wards: ["Cổ Nhuế 1", "Cổ Nhuế 2", "Đông Ngạc", "Đức Thắng", "Liên Mạc", "Minh Khai", "Phú Diễn", "Phúc Diễn", "Tây Tựu", "Thụy Phương", "Thượng Cát", "Xuân Đỉnh", "Xuân Tảo"] },
      { name: "Hà Đông", wards: ["Biên Giang", "Đồng Mai", "Dương Nội", "Hà Cầu", "Kiến Hưng", "La Khê", "Mộ Lao", "Nguyễn Trãi", "Phú La", "Phú Lãm", "Phú Lương", "Phúc La", "Quang Trung", "Vạn Phúc", "Văn Quán", "Yên Nghĩa", "Yết Kiêu"] },
      { name: "Long Biên", wards: ["Bồ Đề", "Cự Khối", "Đức Giang", "Gia Thụy", "Giang Biên", "Long Biên", "Ngọc Lâm", "Ngọc Thụy", "Phúc Đồng", "Phúc Lợi", "Sài Đồng", "Thạch Bàn", "Thượng Thanh", "Việt Hưng"] },
      { name: "Gia Lâm", wards: ["Thị trấn Trâu Quỳ", "Thị trấn Yên Viên", "Bát Tràng", "Cổ Bi", "Đa Tốn", "Đặng Xá", "Dương Quang", "Dương Xá", "Kiêu Kỵ", "Ninh Hiệp", "Phù Đổng", "Yên Thường"] },
      { name: "Đông Anh", wards: ["Thị trấn Đông Anh", "Bắc Hồng", "Cổ Loa", "Dục Tú", "Đại Mạch", "Đông Hội", "Hải Bối", "Kim Chung", "Kim Nỗ", "Mai Lâm", "Nam Hồng", "Nguyên Khê", "Tàm Xá", "Tiên Dương", "Uy Nỗ", "Vân Hà", "Vân Nội", "Việt Hùng", "Vĩnh Ngọc", "Xuân Canh"] }
    ]
  },
  {
    name: "Hồ Chí Minh",
    districts: [
      { name: "Quận 1", wards: ["Bến Nghé", "Bến Thành", "Cầu Kho", "Cầu Ông Lãnh", "Cô Giang", "Đa Kao", "Nguyễn Cư Trinh", "Nguyễn Thái Bình", "Phạm Ngũ Lão", "Tân Định"] },
      { name: "Quận 3", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Võ Thị Sáu"] },
      { name: "Quận 4", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 6", "Phường 8", "Phường 9", "Phường 10", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 18"] },
      { name: "Quận 5", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"] },
      { name: "Quận 6", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"] },
      { name: "Quận 7", wards: ["Bình Thuận", "Phú Mỹ", "Phú Thuận", "Tân Hưng", "Tân Kiểng", "Tân Phong", "Tân Phú", "Tân Quy", "Tân Thuận Đông", "Tân Thuận Tây"] },
      { name: "Quận 8", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16"] },
      { name: "Quận 10", wards: ["Phường 1", "Phường 2", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"] },
      { name: "Quận 11", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16"] },
      { name: "Quận 12", wards: ["An Phú Đông", "Đông Hưng Thuận", "Hiệp Thành", "Tân Chánh Hiệp", "Tân Hưng Thuận", "Tân Thới Hiệp", "Tân Thới Nhất", "Thạnh Lộc", "Thạnh Xuân", "Thới An", "Trung Mỹ Tây"] },
      { name: "Bình Thạnh", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 6", "Phường 7", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 17", "Phường 19", "Phường 21", "Phường 22", "Phường 24", "Phường 25", "Phường 26", "Phường 27", "Phường 28"] },
      { name: "Tân Bình", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"] },
      { name: "Tân Phú", wards: ["Hiệp Tân", "Hòa Thạnh", "Phú Thạnh", "Phú Thọ Hòa", "Phú Trung", "Sơn Kỳ", "Tân Quý", "Tân Sơn Nhì", "Tân Thành", "Tây Thạnh"] },
      { name: "Phú Nhuận", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 13", "Phường 15", "Phường 17"] },
      { name: "Gò Vấp", wards: ["Phường 1", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 17"] },
      { name: "Bình Tân", wards: ["An Lạc", "An Lạc A", "Bình Hưng Hòa", "Bình Hưng Hòa A", "Bình Hưng Hòa B", "Bình Trị Đông", "Bình Trị Đông A", "Bình Trị Đông B", "Tân Tạo", "Tân Tạo A"] },
      { name: "TP. Thủ Đức", wards: ["An Khánh", "An Lợi Đông", "An Phú", "Bình Chiểu", "Bình Thọ", "Hiệp Bình Chánh", "Hiệp Bình Phước", "Hiệp Phú", "Linh Chiểu", "Linh Đông", "Linh Tây", "Linh Trung", "Linh Xuân", "Long Bình", "Long Phước", "Long Thạnh Mỹ", "Long Trường", "Phú Hữu", "Phước Bình", "Phước Long A", "Phước Long B", "Tam Bình", "Tam Phú", "Tăng Nhơn Phú A", "Tăng Nhơn Phú B", "Thạnh Mỹ Lợi", "Thảo Điền", "Thủ Thiêm", "Trường Thạnh", "Trường Thọ"] },
      { name: "Bình Chánh", wards: ["Thị trấn Tân Túc", "An Phú Tây", "Bình Chánh", "Bình Hưng", "Bình Lợi", "Đa Phước", "Hưng Long", "Lê Minh Xuân", "Phạm Văn Hai", "Phong Phú", "Quy Đức", "Tân Kiên", "Tân Nhựt", "Tân Quý Tây", "Vĩnh Lộc A", "Vĩnh Lộc B"] },
      { name: "Hóc Môn", wards: ["Thị trấn Hóc Môn", "Bà Điểm", "Đông Thạnh", "Nhị Bình", "Tân Hiệp", "Tân Thới Nhì", "Tân Xuân", "Thới Tam Thôn", "Trung Chánh", "Xuân Thới Đông", "Xuân Thới Sơn", "Xuân Thới Thượng"] }
    ]
  },
  {
    name: "Lâm Đồng",
    districts: [
      { name: "TP. Đà Lạt", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Tà Nung", "Trạm Hành", "Xuân Thọ", "Xuân Trường"] },
      { name: "TP. Bảo Lộc", wards: ["Phường 1", "Phường 2", "B'Lao", "Lộc Phát", "Lộc Tiến", "Lộc Sơn", "Đam B'ri", "Lộc Châu", "Lộc Nga", "Lộc Thanh"] },
      { name: "Đức Trọng", wards: ["Thị trấn Liên Nghĩa", "Bình Thạnh", "Đà Loan", "Hiệp An", "Hiệp Thạnh", "Liên Hiệp", "Ninh Gia", "Ninh Loan", "Phú Hội", "Tà Hine", "Tà Năng", "Tân Hội", "Tân Thành"] },
      { name: "Đơn Dương", wards: ["Thị trấn Thạnh Mỹ", "Thị trấn D'Ran", "Ka Đô", "Ka Đơn", "Lạc Lâm", "Lạc Xuân", "Pró", "Quảng Lập", "Tu Tra"] },
      { name: "Lạc Dương", wards: ["Thị trấn Lạc Dương", "Đạ Chais", "Đạ Nhim", "Đạ Sar", "Đưng K'Nớ", "Lát"] },
      { name: "Lâm Hà", wards: ["Thị trấn Đinh Văn", "Thị trấn Nam Ban", "Đan Phượng", "Gia Lâm", "Hoài Đức", "Liên Hà", "Mê Linh", "Nam Hà", "Phúc Thọ", "Phi Tô", "Tân Hà", "Tân Thanh", "Tân Văn"] },
      { name: "Bảo Lâm", wards: ["Thị trấn Lộc Thắng", "B'Lá", "Lộc An", "Lộc Bắc", "Lộc Bảo", "Lộc Đức", "Lộc Lâm", "Lộc Nam", "Lộc Ngãi", "Lộc Phú", "Lộc Quảng", "Lộc Tân", "Lộc Thành", "Tân Lạc"] },
      { name: "Di Linh", wards: ["Thị trấn Di Linh", "Bảo Thuận", "Đinh Lạc", "Đinh Trang Hòa", "Đinh Trang Thượng", "Gia Bắc", "Gia Hiệp", "Gung Ré", "Hòa Bắc", "Hòa Nam", "Hòa Ninh", "Hòa Trung", "Liên Đầm", "Sơn Điền", "Tam Bố", "Tân Châu", "Tân Lâm", "Tân Nghĩa", "Tân Thượng"] }
    ]
  },
  {
    name: "Đà Nẵng",
    districts: [
      { name: "Hải Châu", wards: ["Hải Châu 1", "Hải Châu 2", "Thạch Thang", "Thanh Bình", "Thuận Phước", "Hoà Cường Bắc", "Hoà Cường Nam", "Hoà Thuận Đông", "Hoà Thuận Tây", "Nam Dương", "Phước Ninh", "Bình Hiên", "Bình Thuận"] },
      { name: "Thanh Khê", wards: ["Tam Thuận", "Thanh Khê Tây", "Thanh Khê Đông", "Xuân Hà", "Tân Chính", "Chính Gián", "Vĩnh Trung", "Thạc Gián", "An Khê", "Hoà Khê"] },
      { name: "Sơn Trà", wards: ["An Hải Bắc", "An Hải Đông", "An Hải Tây", "Mân Thái", "Nại Hiên Đông", "Phước Mỹ", "Thọ Quang"] },
      { name: "Ngũ Hành Sơn", wards: ["Hoà Hải", "Hoà Quý", "Khuê Mỹ", "Mỹ An"] },
      { name: "Cẩm Lệ", wards: ["Hoà An", "Hoà Phát", "Hoà Thọ Đông", "Hoà Thọ Tây", "Hoà Xuân", "Khuê Trung"] },
      { name: "Liên Chiểu", wards: ["Hoà Hiệp Bắc", "Hoà Hiệp Nam", "Hoà Khánh Bắc", "Hoà Khánh Nam", "Hoà Minh"] },
      { name: "Hòa Vang", wards: ["Hòa Bắc", "Hòa Châu", "Hòa Khương", "Hòa Liên", "Hòa Nhơn", "Hòa Ninh", "Hòa Phong", "Hòa Phú", "Hòa Phước", "Hòa Sơn", "Hòa Tiến"] }
    ]
  },
  {
    name: "Cần Thơ",
    districts: [
      { name: "Ninh Kiều", wards: ["An Bình", "An Cư", "An Hoà", "An Khánh", "An Nghiệp", "An Phú", "Cái Khế", "Hưng Lợi", "Tân An", "Thới Bình", "Xuân Khánh"] },
      { name: "Bình Thủy", wards: ["An Thới", "Bình Thủy", "Bùi Hữu Nghĩa", "Long Hoà", "Long Tuyền", "Thới An Đông", "Trà An", "Trà Nóc"] },
      { name: "Cái Răng", wards: ["Ba Láng", "Hưng Phú", "Hưng Thạnh", "Lê Bình", "Phú Thứ", "Tân Phú", "Yên Đỗ"] },
      { name: "Ô Môn", wards: ["Châu Văn Liêm", "Long Hưng", "Phước Thới", "Thới An", "Thới Hoà", "Thới Long"] },
      { name: "Thốt Nốt", wards: ["Tân Hưng", "Tân Lộc", "Thạnh Hoà", "Thới Thuận", "Thuận An", "Thuận Hưng", "Trung Kiên", "Trung Nhứt"] }
    ]
  },
  {
    name: "Đồng Nai",
    districts: [
      { name: "TP. Biên Hòa", wards: ["An Bình", "An Hoà", "Bình Đa", "Bửu Hoà", "Bửu Long", "Hiệp Hoà", "Hoá An", "Hoà Bình", "Hố Nai", "Long Bình", "Long Bình Tân", "Phước Tân", "Quang Vinh", "Quyết Thắng", "Tam Hiệp", "Tam Hoà", "Tam Phước", "Tân Biên", "Tân Hạnh", "Tân Hiệp", "Tân Hoà", "Tân Mai", "Tân Phong", "Tân Tiến", "Tân Vạn", "Thanh Bình", "Thống Nhất", "Trảng Dài", "Trung Dũng"] },
      { name: "TP. Long Khánh", wards: ["Bảo Vinh", "Bàu Sen", "Phú Bình", "Suối Tre", "Xuân An", "Xuân Bình", "Xuân Hòa", "Xuân Lập", "Xuân Tân", "Xuân Thanh", "Xuân Trung"] },
      { name: "Long Thành", wards: ["Thị trấn Long Thành", "An Phước", "Bàu Cạn", "Bình An", "Bình Sơn", "Cẩm Đường", "Lộc An", "Long An", "Long Đức", "Phước Bình", "Phước Thái", "Tam An", "Tân Hiệp"] }
    ]
  },
  {
    name: "Bình Dương",
    districts: [
      { name: "TP. Thủ Dầu Một", wards: ["Chánh Mỹ", "Chánh Nghĩa", "Định Hoà", "Hiệp An", "Hiệp Thành", "Hoà Phú", "Phú Cường", "Phú Hoà", "Phú Lợi", "Phú Mỹ", "Phú Tân", "Phú Thọ", "Tân An", "Tương Bình Hiệp"] },
      { name: "TP. Dĩ An", wards: ["An Bình", "Bình An", "Bình Thắng", "Dĩ An", "Đông Hoà", "Tân Bình", "Tân Đông Hiệp"] },
      { name: "TP. Thuận An", wards: ["An Phú", "An Thạnh", "Bình Chuẩn", "Bình Hoà", "Bình Nhâm", "Hưng Định", "Lái Thiêu", "Thuận Giao", "Vĩnh Phú"] },
      { name: "TP. Tân Uyên", wards: ["Bạch Đằng", "Khánh Bình", "Phú Chánh", "Tân Hiệp", "Tân Phước Khánh", "Tân Vĩnh Hiệp", "Thái Hòa", "Thạnh Hội", "Thạnh Phước", "Uyên Hưng", "Vĩnh Tân"] }
    ]
  },
  {
    name: "Tiền Giang",
    districts: [
      { name: "TP. Mỹ Tho", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Tân Long"] },
      { name: "Châu Thành", wards: ["Thị trấn Tân Hiệp", "Bàn Long", "Bình Đức", "Dưỡng Điềm", "Điềm Hy", "Đông Hoà", "Kim Sơn", "Long An", "Long Định", "Long Hưng", "Nhị Bình", "Phú Phong", "Song Thuận", "Tam Hiệp", "Thân Cửu Nghĩa", "Thạnh Phú", "Vĩnh Kim"] }
    ]
  },
  {
    name: "Bến Tre",
    districts: [
      { name: "TP. Bến Tre", wards: ["Phường An Hội", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phú Khương", "Phú Tân", "Bình Phú", "Mỹ Thạnh An", "Nhơn Thạnh", "Phú Nhuận", "Sơn Đông"] },
      { name: "Châu Thành", wards: ["Thị trấn Châu Thành", "An Hiệp", "An Hóa", "An Khánh", "Giao Long", "Hữu Định", "Phú An Hòa", "Phú Đức", "Phú Túc", "Quới Sơn", "Quới Thành", "Tân Thạch", "Tam Phước", "Tiên Long", "Tiên Thủy", "Tường Đa"] },
      { name: "Chợ Lách", wards: ["Thị trấn Chợ Lách", "Hòa Nghĩa", "Hưng Khánh Trung B", "Long Thới", "Phú Phụng", "Phú Sơn", "Sơn Định", "Tân Thiềng", "Vĩnh Bình", "Vĩnh Thành", "Vĩnh Hòa"] }
    ]
  },
  {
    name: "Đồng Tháp",
    districts: [
      { name: "TP. Cao Lãnh", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 6", "Phường 11", "Mỹ Phú", "Hòa Thuận", "Hòa An", "Mỹ Tân", "Mỹ Trà", "Tịnh Thới", "Tân Thuận Đông", "Tân Thuận Tây"] },
      { name: "TP. Sa Đéc", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Tân Quy Đông", "Tân Khánh Đông", "Tân Phú Đông", "Tân Quy Tây"] },
      { name: "Huyện Cao Lãnh", wards: ["Thị trấn Mỹ Thọ", "Ba Sao", "Bình Hàng Tây", "Bình Hàng Trung", "Bình Thạnh", "Gáo Giồng", "Mỹ Hiệp", "Mỹ Hội", "Mỹ Long", "Mỹ Thọ", "Mỹ Xương", "Nhị Mỹ", "Phong Mỹ", "Phương Thịnh", "Phương Trà", "Tân Hội Trung", "Tân Nghĩa"] }
    ]
  },
  {
    name: "Hải Phòng",
    districts: [
      { name: "Hồng Bàng", wards: ["Hoàng Văn Thụ", "Minh Khai", "Phan Bội Châu", "Quán Toan", "Sở Dầu", "Thượng Lý", "Trại Chuối", "Hùng Vương"] },
      { name: "Ngô Quyền", wards: ["Cầu Đất", "Cầu Tre", "Đằng Giang", "Đông Khê", "Đồng Quốc Bình", "Gia Viên", "Lạc Viên", "Lạch Tray", "Lê Lợi", "Máy Chai", "Máy Tơ", "Vạn Mỹ"] },
      { name: "Lê Chân", wards: ["An Biên", "An Dương", "Cát Dài", "Đông Hải", "Dư Hàng", "Dư Hàng Kênh", "Hàng Kênh", "Hồ Nam", "Kênh Dương", "Lam Sơn", "Niệm Nghĩa", "Nghĩa Xá", "Trần Nguyên Hãn", "Vĩnh Niệm"] }
    ]
  },
  {
    name: "Khánh Hòa",
    districts: [
      { name: "TP. Nha Trang", wards: ["Lộc Thọ", "Ngọc Hiệp", "Phước Hải", "Phước Hòa", "Phước Long", "Phước Tân", "Phước Tiến", "Phương Sài", "Phương Sơn", "Tân Lập", "Vạn Thắng", "Vạn Thạnh", "Vĩnh Hải", "Vĩnh Hòa", "Vĩnh Nguyên", "Vĩnh Phước", "Vĩnh Thọ", "Vĩnh Trường", "Xương Huân"] },
      { name: "TP. Cam Ranh", wards: ["Ba Ngòi", "Cam Linh", "Cam Lộc", "Cam Lợi", "Cam Nghĩa", "Cam Phú", "Cam Phúc Nam", "Cam Phúc Bắc", "Cam Thuận"] }
    ]
  },
  {
    name: "Đắk Lắk",
    districts: [
      { name: "TP. Buôn Ma Thuột", wards: ["Tân An", "Tân Hòa", "Tân Lập", "Tân Lợi", "Tân Thành", "Tân Tiến", "Thắng Lợi", "Thành Công", "Thành Nhất", "Thống Nhất", "Tự An"] }
    ]
  },
  {
    name: "Kiên Giang",
    districts: [
      { name: "TP. Rạch Giá", wards: ["An Bình", "An Hòa", "Rạch Sỏi", "Vĩnh Bảo", "Vĩnh Hiệp", "Vĩnh Lạc", "Vĩnh Lợi", "Vĩnh Quang", "Vĩnh Thanh", "Vĩnh Thanh Vân", "Vĩnh Thông"] },
      { name: "TP. Phú Quốc", wards: ["Dương Đông", "An Thới", "Bãi Thơm", "Cửa Cạn", "Cửa Dương", "Dương Tơ", "Gành Dầu", "Hàm Ninh", "Thổ Châu"] }
    ]
  },
  {
    name: "Bà Rịa - Vũng Tàu",
    districts: [
      { name: "TP. Vũng Tàu", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Thắng Nhất", "Thắng Nhì", "Thắng Tam", "Rạch Dừa", "Nguyễn An Ninh"] },
      { name: "TP. Bà Rịa", wards: ["Kim Dinh", "Long Hương", "Long Tâm", "Long Toàn", "Phước Hưng", "Phước Hiệp", "Phước Nguyên", "Phước Trung"] }
    ]
  },
  {
    name: "Thừa Thiên Huế",
    districts: [
      { name: "TP. Huế", wards: ["An Cựu", "An Đông", "An Hòa", "An Tây", "Đông Ba", "Gia Hội", "Hương An", "Hương Hồ", "Hương Long", "Hương Sơ", "Hương Vinh", "Kim Long", "Phú Hậu", "Phú Hội", "Phú Nhuận", "Phú Thượng", "Phước Vĩnh", "Phường Đúc", "Tây Lộc", "Thuận Hòa", "Thuận Lộc", "Thủy Biều", "Thủy Vân", "Thủy Xuân", "Trường An", "Vĩnh Ninh", "Vỹ Dạ", "Xuân Phú"] }
    ]
  }
];

// Danh sách đầy đủ 63 tỉnh/thành phố Việt Nam
export const ALL_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", 
  "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", 
  "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", 
  "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", 
  "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", 
  "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", 
  "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", 
  "Tiền Giang", "Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

// Hàm hỗ trợ lấy danh sách quận huyện theo tỉnh thành
export function getDistrictsByProvince(provinceName) {
  if (!provinceName) return [];
  const found = VIETNAM_LOCATIONS.find((p) => p.name.toLowerCase() === provinceName.toLowerCase());
  if (found && found.districts) {
    return found.districts.map((d) => d.name);
  }
  // Nếu là tỉnh chưa có danh mục chi tiết, trả về các quận/huyện mặc định
  return [
    `TP. ${provinceName}`,
    `Thị xã trung tâm`,
    `Huyện Châu Thành`,
    `Huyện 1`,
    `Huyện 2`
  ];
}

// Hàm hỗ trợ lấy danh sách phường xã theo tỉnh và quận huyện
export function getWardsByDistrict(provinceName, districtName) {
  if (!provinceName || !districtName) return [];
  const foundProv = VIETNAM_LOCATIONS.find((p) => p.name.toLowerCase() === provinceName.toLowerCase());
  if (foundProv && foundProv.districts) {
    const foundDist = foundProv.districts.find((d) => d.name.toLowerCase() === districtName.toLowerCase());
    if (foundDist && foundDist.wards) {
      return foundDist.wards;
    }
  }
  return [
    `Phường 1`,
    `Phường 2`,
    `Phường 3`,
    `Thị trấn trung tâm`,
    `Xã 1`,
    `Xã 2`
  ];
}
