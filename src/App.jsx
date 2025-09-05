import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Users } from "lucide-react";

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    bietDanh: "",
    caLamViec: "fulltime",
  });

  // IndexedDB setup
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("EmployeeDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("employees")) {
          const store = db.createObjectStore("employees", {
            keyPath: "maNhanVien",
            autoIncrement: true,
          });
          store.createIndex("bietDanh", "bietDanh", { unique: false });
          store.createIndex("caLamViec", "caLamViec", { unique: false });
        }
      };
    });
  };

  // Initialize with sample data
  const initializeData = async () => {
    const db = await openDB();
    const transaction = db.transaction(["employees"], "readwrite");
    const store = transaction.objectStore("employees");

    // Check if data already exists
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        // Add sample data
        const sampleData = [
          { bietDanh: "Bùi Minh Quang", caLamViec: "fulltime" },
          { bietDanh: "Lê Quang Lộc", caLamViec: "fulltime" },
          { bietDanh: "Nguyễn Thành Công", caLamViec: "Part-time" },
          { bietDanh: "Nguyễn Thành Phát", caLamViec: "fulltime" },
          { bietDanh: "Nguyễn Tấn Huy", caLamViec: "fulltime" },
          { bietDanh: "Phạm Thùy Tiên", caLamViec: "fulltime" },
          { bietDanh: "Trương Thị Tuyết Mai", caLamViec: "Part-time" },
          { bietDanh: "Trần Hữu Dân", caLamViec: "fulltime" },
          { bietDanh: "Trần Nguyễn Diu Quyên", caLamViec: "fulltime" },
          { bietDanh: "datdoan", caLamViec: "" },
          { bietDanh: "Đào Tiến Lực", caLamViec: "fulltime" },
          { bietDanh: "HungNguyen", caLamViec: "fulltime" },
        ];

        sampleData.forEach((employee) => {
          store.add(employee);
        });
      }
    };
  };

  // Load all employees
  const loadEmployees = async () => {
    const db = await openDB();
    const transaction = db.transaction(["employees"], "readonly");
    const store = transaction.objectStore("employees");
    const request = store.getAll();

    request.onsuccess = () => {
      setEmployees(request.result);
    };
  };

  // Add new employee
  const addEmployee = async () => {
    if (!newEmployee.bietDanh.trim()) return;

    const db = await openDB();
    const transaction = db.transaction(["employees"], "readwrite");
    const store = transaction.objectStore("employees");

    await store.add(newEmployee);

    transaction.oncomplete = () => {
      loadEmployees();
      setNewEmployee({ bietDanh: "", caLamViec: "fulltime" });
      setShowAddForm(false);
    };
  };

  // Delete employee
  const deleteEmployee = async (maNhanVien) => {
    const db = await openDB();
    const transaction = db.transaction(["employees"], "readwrite");
    const store = transaction.objectStore("employees");

    await store.delete(maNhanVien);

    transaction.oncomplete = () => {
      loadEmployees();
    };
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.bietDanh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.caLamViec.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const init = async () => {
      await initializeData();
      await loadEmployees();
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                Quản Lý Nhân Viên
              </h1>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Thêm Nhân Viên</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc ca làm việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Thêm Nhân Viên Mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biệt Danh
                </label>
                <input
                  type="text"
                  value={newEmployee.bietDanh}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, bietDanh: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên nhân viên..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ca Làm Việc
                </label>
                <select
                  value={newEmployee.caLamViec}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      caLamViec: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fulltime">Fulltime</option>
                  <option value="part-time">Part-time</option>
                  <option value="">Chưa xác định</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={addEmployee}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Thêm
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Employee Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Danh Sách Nhân Viên ({filteredEmployees.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã NV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biệt Danh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ca Làm Việc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "Không tìm thấy nhân viên nào"
                        : "Chưa có dữ liệu"}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.maNhanVien} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{employee.maNhanVien}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.bietDanh}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.caLamViec === "fulltime"
                              ? "bg-green-100 text-green-800"
                              : employee.caLamViec.includes("Part-time")
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.caLamViec || "Chưa xác định"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteEmployee(employee.maNhanVien)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
