import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  Users,
  Database,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Custom hook useDebounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook cho IndexedDB operations
const useIndexedDB = () => {
  const openDB = useCallback(() => {
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
  }, []);

  return { openDB };
};

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    bietDanh: "",
    caLamViec: "fulltime",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const { openDB } = useIndexedDB();

  // Debounce search term với delay 300ms
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered employees
  const filteredEmployees = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return employees;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    return employees.filter(
      (employee) =>
        employee.bietDanh.toLowerCase().includes(searchLower) ||
        employee.caLamViec.toLowerCase().includes(searchLower)
    );
  }, [employees, debouncedSearchTerm]);

  // Pagination calculations - PHẢI ĐỊNH NGHĨA TRƯỚC KHI SỬ DỤNG
  const totalPages = useMemo(() => {
    return Math.ceil(filteredEmployees.length / itemsPerPage);
  }, [filteredEmployees.length, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return startIndex + itemsPerPage;
  }, [startIndex, itemsPerPage]);

  // Memoized paginated employees
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, startIndex, endIndex]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Pagination handlers - BÂY GIỜ MỚI ĐỊNH NGHĨA SAU KHI totalPages ĐÃ CÓ
  const goToPage = useCallback(
    (page) => {
      const newPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Initialize with sample data
  const initializeData = useCallback(async () => {
    try {
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
            { bietDanh: "Nguyễn Thành Công", caLamViec: "Part-time Công" },
            { bietDanh: "Nguyễn Thành Phát", caLamViec: "fulltime" },
            { bietDanh: "Nguyễn Tấn Huy", caLamViec: "fulltime" },
            { bietDanh: "Phạm Thùy Tiên", caLamViec: "fulltime" },
            { bietDanh: "Trương Thị Tuyết Mai", caLamViec: "Part-time Mai" },
            { bietDanh: "Trần Hữu Dân", caLamViec: "fulltime" },
            { bietDanh: "Trần Nguyễn Diu Quyên", caLamViec: "fulltime" },
            { bietDanh: "datdoan", caLamViec: "" },
         
          ];

          sampleData.forEach((employee) => {
            store.add(employee);
          });
        }
      };
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }, [openDB]);

  // Load all employees with loading state
  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await openDB();
      const transaction = db.transaction(["employees"], "readonly");
      const store = transaction.objectStore("employees");
      const request = store.getAll();

      request.onsuccess = () => {
        setEmployees(request.result);
        setIsLoading(false);
      };

      request.onerror = () => {
        console.error("Error loading employees:", request.error);
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Error loading employees:", error);
      setIsLoading(false);
    }
  }, [openDB]);

  // Add new employee
  const addEmployee = useCallback(async () => {
    if (!newEmployee.bietDanh.trim()) return;

    try {
      const db = await openDB();
      const transaction = db.transaction(["employees"], "readwrite");
      const store = transaction.objectStore("employees");

      await store.add(newEmployee);

      transaction.oncomplete = () => {
        loadEmployees();
        setNewEmployee({ bietDanh: "", caLamViec: "fulltime" });
        setShowAddForm(false);
      };

      transaction.onerror = () => {
        console.error("Error adding employee:", transaction.error);
      };
    } catch (error) {
      console.error("Error adding employee:", error);
    }
  }, [newEmployee, openDB, loadEmployees]);

  // Delete employee
  const deleteEmployee = useCallback(
    async (maNhanVien) => {
      try {
        const db = await openDB();
        const transaction = db.transaction(["employees"], "readwrite");
        const store = transaction.objectStore("employees");

        await store.delete(maNhanVien);

        transaction.oncomplete = () => {
          loadEmployees();
        };

        transaction.onerror = () => {
          console.error("Error deleting employee:", transaction.error);
        };
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    },
    [openDB, loadEmployees]
  );

  // Optimized generateRandomData
  const generateRandomData = useCallback(async () => {
    if (
      !confirm(
        "Bạn có muốn tạo 10,000 bản ghi ngẫu nhiên? Quá trình này có thể mất vài giây."
      )
    ) {
      return;
    }

    setIsGenerating(true);

    const firstNames = [
      "Nguyễn",
      "Trần",
      "Lê",
      "Phạm",
      "Hoàng",
      "Huỳnh",
      "Phan",
      "Vũ",
      "Võ",
      "Đặng",
      "Bùi",
      "Đỗ",
      "Hồ",
      "Ngô",
      "Dương",
      "Lý",
      "Mai",
      "Đinh",
      "Tô",
      "Lưu",
      "Đào",
      "Cao",
      "Kiều",
      "Ông",
      "Hà",
      "Tạ",
      "Chu",
      "Thái",
      "Triệu",
    ];

    const middleNames = [
      "Văn",
      "Thị",
      "Minh",
      "Thanh",
      "Quang",
      "Hữu",
      "Đức",
      "Thành",
      "Tấn",
      "Xuân",
      "Thu",
      "Hoàng",
      "Ngọc",
      "Bảo",
      "Kim",
      "Gia",
      "Tuấn",
      "Anh",
      "Công",
      "Như",
      "Thúy",
      "Hồng",
      "Lan",
      "Phương",
      "Hương",
      "Linh",
      "Trang",
      "Yến",
      "My",
      "Hạnh",
    ];

    const lastNames = [
      "An",
      "Bình",
      "Cường",
      "Dũng",
      "Em",
      "Phong",
      "Giang",
      "Hạnh",
      "Linh",
      "Khánh",
      "Long",
      "Mai",
      "Nam",
      "Oanh",
      "Phúc",
      "Quân",
      "Sơn",
      "Tùng",
      "Uyên",
      "Vân",
      "Yến",
      "Huy",
      "Thảo",
      "Phát",
      "Hằng",
      "Tiến",
      "Lộc",
      "Hoa",
      "Nhung",
      "Duy",
      "Khôi",
      "Thắng",
      "Hiền",
      "Nga",
      "Trúc",
      "Bích",
      "Kiệt",
      "Đạt",
      "Hảo",
      "Đức",
    ];

    const workTypes = [
      "fulltime",
      "part-time",
      "Part-time Sáng",
      "Part-time Chiều",
      "Part-time Tối",
      "Thực tập",
      "Hợp đồng",
      "Freelance",
      "Remote",
      "Tạm thời",
      "Theo ca",
      "",
    ];

    try {
      const batchSize = 1000;
      const totalRecords = 10000;
      let completedRecords = 0;

      for (
        let batchIndex = 0;
        batchIndex < Math.ceil(totalRecords / batchSize);
        batchIndex++
      ) {
        const recordsInBatch = Math.min(
          batchSize,
          totalRecords - completedRecords
        );

        // Tạo tất cả dữ liệu TRƯỚC KHI mở transaction
        const employeesData = [];
        for (let i = 0; i < recordsInBatch; i++) {
          const firstName =
            firstNames[Math.floor(Math.random() * firstNames.length)];
          const middleName =
            middleNames[Math.floor(Math.random() * middleNames.length)];
          const lastName =
            lastNames[Math.floor(Math.random() * lastNames.length)];
          const workType =
            workTypes[Math.floor(Math.random() * workTypes.length)];

          employeesData.push({
            bietDanh: `${firstName} ${middleName} ${lastName}`,
            caLamViec: workType,
          });
        }

        // Transaction processing
        await new Promise((resolve, reject) => {
          openDB()
            .then((db) => {
              const transaction = db.transaction(["employees"], "readwrite");
              const store = transaction.objectStore("employees");

              transaction.oncomplete = () => {
                completedRecords += recordsInBatch;
                console.log(
                  `Batch ${
                    batchIndex + 1
                  } hoàn thành: ${completedRecords}/${totalRecords}`
                );
                resolve();
              };

              transaction.onerror = () => {
                console.error("Transaction error:", transaction.error);
                reject(new Error(`Transaction error: ${transaction.error}`));
              };

              transaction.onabort = () => {
                console.error("Transaction aborted");
                reject(new Error("Transaction aborted"));
              };

              // Add tất cả employees liên tiếp KHÔNG CÓ AWAIT
              employeesData.forEach((employee) => {
                store.add(employee);
              });
            })
            .catch(reject);
        });

        // Yield control mỗi 2 batch
        if (batchIndex % 2 === 0 && batchIndex > 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      setIsGenerating(false);
      loadEmployees();
      alert(`Đã tạo thành công ${totalRecords} bản ghi ngẫu nhiên!`);
    } catch (error) {
      setIsGenerating(false);
      console.error("Error during bulk insert:", error);
      alert("Có lỗi xảy ra: " + error.message);
    }
  }, [openDB, loadEmployees]);

  // Clear all data
  const clearAllData = useCallback(async () => {
    if (
      !confirm(
        "Bạn có chắc muốn xóa TẤT CẢ dữ liệu? Hành động này không thể hoàn tác!"
      )
    ) {
      return;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(["employees"], "readwrite");
      const store = transaction.objectStore("employees");

      await store.clear();

      transaction.oncomplete = () => {
        loadEmployees();
        alert("Đã xóa tất cả dữ liệu!");
      };

      transaction.onerror = () => {
        console.error("Error clearing data:", transaction.error);
      };
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  }, [openDB, loadEmployees]);

  // Handler cho search input
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handler cho form inputs
  const handleNewEmployeeChange = useCallback((field, value) => {
    setNewEmployee((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeData();
      await loadEmployees();
    };
    init();
  }, [initializeData, loadEmployees]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                Quản Lý Nhân Viên
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateRandomData}
                disabled={isGenerating || isLoading}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                title="Tạo 10,000 bản ghi ngẫu nhiên"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    <span>Tạo 10K Data</span>
                  </>
                )}
              </button>

              <button
                onClick={clearAllData}
                disabled={isGenerating || isLoading}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                title="Xóa tất cả dữ liệu"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Xóa Tất Cả</span>
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                disabled={isGenerating || isLoading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm NV</span>
              </button>
            </div>
          </div>

          {/* Search với debounce */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc ca làm việc..."
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={isGenerating || isLoading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            {searchTerm !== debouncedSearchTerm && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator when generating */}
        {isGenerating && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-purple-600 animate-spin" />
              <div className="flex-1">
                <p className="text-purple-800 font-medium">
                  Đang tạo 10,000 bản ghi ngẫu nhiên...
                </p>
                <p className="text-purple-600 text-sm">
                  Vui lòng đợi, quá trình này có thể mất vài giây. Không reload
                  trang!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && !isGenerating && (
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
                    handleNewEmployeeChange("bietDanh", e.target.value)
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
                    handleNewEmployeeChange("caLamViec", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fulltime">Fulltime</option>
                  <option value="part-time">Part-time</option>
                  <option value="Part-time Sáng">Part-time Sáng</option>
                  <option value="Part-time Chiều">Part-time Chiều</option>
                  <option value="Part-time Tối">Part-time Tối</option>
                  <option value="Thực tập">Thực tập</option>
                  <option value="Hợp đồng">Hợp đồng</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Remote">Remote</option>
                  <option value="Tạm thời">Tạm thời</option>
                  <option value="Theo ca">Theo ca</option>
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
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Danh Sách Nhân Viên ({filteredEmployees.length} /{" "}
                {employees.length})
                {searchTerm && (
                  <span className="text-sm text-gray-500 ml-2">
                    - Tìm kiếm: "{debouncedSearchTerm}"
                  </span>
                )}
              </h2>
              {filteredEmployees.length > 0 && (
                <p className="text-sm text-gray-500">
                  Hiển thị {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredEmployees.length)} của{" "}
                  {filteredEmployees.length} bản ghi
                </p>
              )}
            </div>

            {/* Items per page selector */}
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                Hiển thị:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span className="text-sm text-gray-600">bản ghi</span>
            </div>
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
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {isGenerating
                        ? "Đang tạo dữ liệu..."
                        : searchTerm
                        ? "Không tìm thấy nhân viên nào"
                        : "Chưa có dữ liệu"}
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((employee) => (
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
                              : employee.caLamViec === "Remote"
                              ? "bg-blue-100 text-blue-800"
                              : employee.caLamViec === "Thực tập"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.caLamViec || "Chưa xác định"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteEmployee(employee.maNhanVien)}
                          disabled={isGenerating || isLoading}
                          className="text-red-600 hover:text-red-900 disabled:text-red-300 transition-colors"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page info */}
                  <div className="text-sm text-gray-700">
                    Trang <span className="font-medium">{currentPage}</span>{" "}
                    trong <span className="font-medium">{totalPages}</span>{" "}
                    trang
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center space-x-2">
                    {/* First page */}
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>

                    {/* Previous page */}
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(
                          1,
                          currentPage - Math.floor(maxVisiblePages / 2)
                        );
                        let endPage = Math.min(
                          totalPages,
                          startPage + maxVisiblePages - 1
                        );

                        // Adjust start page if we're near the end
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(
                            1,
                            endPage - maxVisiblePages + 1
                          );
                        }

                        // Add first page and ellipsis if needed
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => goToPage(1)}
                              className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span
                                key="ellipsis1"
                                className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                        }

                        // Add visible pages
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => goToPage(i)}
                              className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                                i === currentPage
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        // Add last page and ellipsis if needed
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span
                                key="ellipsis2"
                                className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => goToPage(totalPages)}
                              className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next page */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Last page */}
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Trang cuối"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Go to page input */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Đi tới:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          goToPage(page);
                        }
                      }}
                      className="border border-gray-300 rounded px-2 py-1 w-16 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
