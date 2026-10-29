// Dữ liệu hư cấu chỉ dùng cho demo, DataGrid không phụ thuộc vào các field này
export interface Student {
  studentId: string;
  fullName: string;
  faculty: string;
  gpa: number;
  email?: string;
}

export const students: Student[] = [
  { studentId: 'SV001', fullName: 'Nguyễn Văn An', faculty: 'Hệ thống Thông tin', gpa: 3.45, email: 'an.nv@example.edu.vn' },
  { studentId: 'SV002', fullName: 'Trần Thị Bích', faculty: 'Khoa học Máy tính', gpa: 3.8, email: 'bich.tt@example.edu.vn' },
  { studentId: 'SV003', fullName: 'Lê Minh Châu', faculty: 'Kỹ thuật Phần mềm', gpa: 2.95 },
  { studentId: 'SV004', fullName: 'Phạm Quốc Dũng', faculty: 'Hệ thống Thông tin', gpa: 3.12, email: 'dung.pq@example.edu.vn' },
  { studentId: 'SV005', fullName: 'Hoàng Thu Hà', faculty: 'Mạng máy tính', gpa: 3.67, email: 'ha.ht@example.edu.vn' },
  { studentId: 'SV006', fullName: 'Đỗ Gia Huy', faculty: 'Khoa học Máy tính', gpa: 2.5 },
  { studentId: 'SV007', fullName: 'Vũ Ngọc Lan', faculty: 'Kỹ thuật Phần mềm', gpa: 3.91, email: 'lan.vn@example.edu.vn' },
  { studentId: 'SV008', fullName: 'Bùi Đức Long', faculty: 'An toàn Thông tin', gpa: 3.25, email: 'long.bd@example.edu.vn' },
  { studentId: 'SV009', fullName: 'Đặng Khánh Linh', faculty: 'Hệ thống Thông tin', gpa: 3.58 },
  { studentId: 'SV010', fullName: 'Ngô Thanh Phong', faculty: 'Mạng máy tính', gpa: 2.78, email: 'phong.nt@example.edu.vn' },
  { studentId: 'SV011', fullName: 'Dương Mỹ Quyên', faculty: 'An toàn Thông tin', gpa: 3.33, email: 'quyen.dm@example.edu.vn' },
  { studentId: 'SV012', fullName: 'Lý Hoàng Sơn', faculty: 'Khoa học Máy tính', gpa: 3.05 },
  { studentId: 'SV013', fullName: 'Trịnh Bảo Trâm', faculty: 'Kỹ thuật Phần mềm', gpa: 3.72, email: 'tram.tb@example.edu.vn' },
  { studentId: 'SV014', fullName: 'Mai Xuân Trường', faculty: 'Hệ thống Thông tin', gpa: 2.88, email: 'truong.mx@example.edu.vn' },
  { studentId: 'SV015', fullName: 'Hồ Thị Uyên', faculty: 'Mạng máy tính', gpa: 3.49 },
  { studentId: 'SV016', fullName: 'Châu Anh Vũ', faculty: 'An toàn Thông tin', gpa: 3.15, email: 'vu.ca@example.edu.vn' },
  { studentId: 'SV017', fullName: 'Tạ Hải Yến', faculty: 'Khoa học Máy tính', gpa: 3.62, email: 'yen.th@example.edu.vn' },
  { studentId: 'SV018', fullName: 'Kiều Minh Đạt', faculty: 'Kỹ thuật Phần mềm', gpa: 2.25 },
];
