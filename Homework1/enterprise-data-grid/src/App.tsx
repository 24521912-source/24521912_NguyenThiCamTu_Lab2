import { useState } from 'react';
import { DataGrid } from './components/DataGrid';
import { students, type Student } from './data/students';
import type { ColumnDef } from './types/dataGrid';

const columns: ColumnDef<Student>[] = [
  { header: 'MSSV', accessorKey: 'studentId', sortable: true },
  { header: 'Họ tên', accessorKey: 'fullName', sortable: true },
  { header: 'Khoa', accessorKey: 'faculty' },
  { header: 'GPA', accessorKey: 'gpa', sortable: true },
  { header: 'Email', accessorKey: 'email' },
];

function App() {
  const [lastSelected, setLastSelected] = useState<Student | null>(null);

  return (
    <>
      <a className="skip-link" href="#main">
        Bỏ qua đến nội dung chính
      </a>
      <header className="app-header">
        <h1>Enterprise Data-Grid</h1>
        <p>Bảng dữ liệu có sắp xếp, tìm kiếm, phân trang và chọn dòng bằng bàn phím.</p>
      </header>
      <main id="main" className="app-main" tabIndex={-1}>
        <section aria-labelledby="students-heading">
          <h2 id="students-heading">Danh sách sinh viên</h2>
          <DataGrid data={students} columns={columns} onRowSelect={setLastSelected} ariaLabel="Danh sách sinh viên" />
          {/* onRowSelect không báo khi bỏ chọn, nên chỉ hiển thị lần chọn gần nhất */}
          <p role="status">
            {lastSelected
              ? `Lần chọn gần nhất: ${lastSelected.fullName} (${lastSelected.studentId})`
              : 'Chưa chọn sinh viên nào.'}
          </p>
        </section>
      </main>
      <footer className="app-footer">
        <p>Homework 1 — Web Application Development 2026, UIT. Dữ liệu hư cấu.</p>
      </footer>
    </>
  );
}

export default App;
