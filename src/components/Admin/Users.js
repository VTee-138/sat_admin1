import React, { useEffect, useState } from "react";
import { Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import UserForm from "./UserForm";
import {
  activePremium,
  createUser,
  deleteUser,
  getUsers,
} from "../../services/UserService";
import { Tooltip } from "@mui/material";
import { calculateExpireAt } from "../../common/Utils";
import dayjs from "dayjs";

const configDate = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh", // hoặc remove nếu dùng UTC
};

export default function Users() {
  // ]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
    fullName: "",
    expireAt: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;
  const [isEditing, setIsEditing] = useState(null);
  const [isSearch, setIsSearch] = useState(false);
  const [listUsers, setListUsers] = useState([]);
  const examsPerPage = 5;
  const indexOfLastExam = currentPage * examsPerPage;
  const [searchQuery, setSearchQuery] = useState("");

  const handleFetch = async () => {
    try {
      const response = await getUsers(currentPage, limit, searchQuery);
      setListUsers(response?.data);
      setTotalPages(response?.totalPages);
      setCurrentPage(response?.currentPage);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [currentPage]);

  const handleEditUser = (user) => {
    setIsEditing(true);
    setFormData({ ...user, expireAt: calculateExpireAt(user?.expireAt) });
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await deleteUser(id);
      toast.success(res?.message);
      setListUsers(listUsers.filter((user) => user?._id !== id));
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  const handleInsertUser = async () => {
    if (validateForm()) {
      try {
        const res = await createUser(formData);
        if (res && res.data) {
          setListUsers([res.data, ...listUsers]);
          handleFetch();
          toast.success(res?.message);
          setFormData({
            email: "",
            password: "",
            role: "",
            name: "",
            expireAt: 0,
          });
        }
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(message);
      }
    }
  };

  const handleUpdateUser = async () => {
    if (validateForm()) {
      try {
        const res = await createUser(formData);
        if (res && res.data) {
          setListUsers(
            listUsers.map((e) => (e._id === res.data?._id ? res.data : e))
          );
          handleFetch();
          toast.success(res?.message);
          setFormData({
            email: "",
            password: "",
            role: "",
            name: "",
          });
        }
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(message);
      }
    }
  };
  const validateForm = () => {
    if (!formData.email) {
      toast.error("Vui lòng nhập email");
      return false;
    }

    if (!formData.password && !isEditing) {
      toast.error("Vui lòng nhập password");
      return false;
    }

    if (!formData.fullName) {
      toast.error("Vui lòng nhập name");
      return false;
    }

    if (![0, 1].includes(formData.role)) {
      toast.error("Vui lòng nhập role");
      return false;
    }

    if (formData.expireAt <= 0) {
      toast.error("Vui lòng nhập ngày hết hạn");
      return false;
    }

    return true;
  };

  const handleChangeInputUser = (event) => {
    let { name, value } = event.target;
    if (name === "role") {
      const role = value === "Admin" ? 1 : 0;
      setFormData({
        ...formData,
        [name]: role,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    if (searchQuery) {
      setIsSearch(true);
    } else {
      setIsSearch(false);
    }
    setCurrentPage(1); // Reset page on search
    handleFetch(); // Fetch data with query
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (searchQuery) {
        setIsSearch(true);
      } else {
        setIsSearch(false);
      }
      handleSearch(); // Trigger search when Enter is pressed
    }
  };

  const handleTogglePremium = async (id, premium) => {
    try {
      const res = await activePremium(id, !premium);
      toast.success(res.message);
      setListUsers(
        listUsers.map((user) =>
          user?._id === id
            ? {
                ...user,
                premium: !user?.premium,
              }
            : user
        )
      );
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">
        Quản Lý Người Dùng
      </h2>

      {/* user Form */}
      <UserForm
        isEditing={isEditing}
        formData={formData}
        handleInsertUser={handleInsertUser}
        handleChangeInputUser={handleChangeInputUser}
        handleUpdateUser={handleUpdateUser}
      />

      {/* Search Input */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          className="w-full sm:w-80 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tìm kiếm
        </button>
      </div>

      {/* user Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">
                    ID
                  </th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">
                    Email
                  </th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">
                    Tên
                  </th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">
                    Vai trò
                  </th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">
                    Ngày hết hạn
                  </th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">
                    Ngày tạo
                  </th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {listUsers.length > 0 ? (
                  listUsers.map((user, index) => (
                    <tr
                      key={user?._id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <Tooltip title={user?._id} placement="top">
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          {user?._id?.slice(0, 5)}...{user?._id?.slice(-5)}
                        </td>
                      </Tooltip>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm break-all">
                        {user?.email}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        {user?.fullName}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user?.role === 1
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user?.role === 1 ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        {new Date(user?.expireAt).toLocaleDateString(
                          "vi-VN",
                          configDate
                        )}
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        {new Date(user?.createdAt).toLocaleDateString(
                          "vi-VN",
                          configDate
                        )}
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2 h-full min-h-[40px]">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user?._id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between p-4 items-center gap-2">
          <span className="text-sm">
            Trang {isSearch ? "1 / 1" : `${currentPage} / ${totalPages}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || isSearch}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors text-sm"
            >
              Trước
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => (p < totalPages ? p + 1 : p))
              }
              disabled={currentPage === totalPages || isSearch}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
