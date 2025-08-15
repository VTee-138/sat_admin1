import React from "react";
import { Button, InputAdornment, MenuItem, TextField } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Person3Icon from "@mui/icons-material/Person3";
import PasswordIcon from "@mui/icons-material/Password";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import NextPlanIcon from "@mui/icons-material/NextPlan";

export default function UserForm({
  formData,
  handleChangeInputUser,
  handleInsertUser,
  isEditing,
  handleUpdateUser,
}) {
  return (
    <div className="py-4 sm:py-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg mb-6 sm:mb-8 px-[6rem]">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
        {isEditing
          ? "Cập nhật thông tin người dùng"
          : "Tạo tài khoản người dùng"}
      </h2>

      {/* Email và Tên người dùng */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Email *"
          name="email"
          value={formData?.email}
          className="w-full"
          onChange={handleChangeInputUser}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
              </InputAdornment>
            ),
          }}
          variant="standard"
          size="small"
        />
        <TextField
          label="Tên người dùng *"
          name="fullName"
          value={formData?.fullName}
          onChange={handleChangeInputUser}
          className="w-full"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person3Icon />
              </InputAdornment>
            ),
          }}
          variant="standard"
          size="small"
        />
      </div>

      {/* Password và Role */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Password *"
          name="password"
          value={formData?.password}
          className="w-full"
          onChange={handleChangeInputUser}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PasswordIcon />
              </InputAdornment>
            ),
          }}
          variant="standard"
          size="small"
        />
        <TextField
          select
          label="Role *"
          name="role"
          value={
            formData?.role === 1 ? "Admin" : formData?.role === 0 ? "User" : ""
          }
          onChange={handleChangeInputUser}
          className="w-full"
          variant="standard"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AdminPanelSettingsIcon />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            shrink: true,
          }}
        >
          {["Admin", "User"].map((option, key) => (
            <MenuItem key={key} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </div>

      {/* Số ngày hết hạn */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          type="number"
          label="Số ngày hết hạn *"
          name="expireAt"
          value={formData?.expireAt}
          onChange={handleChangeInputUser}
          className="w-[49%] md:col-span-2"
          variant="standard"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <NextPlanIcon />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{ shrink: true }}
        />
      </div>

      {/* Button */}
      <div className="flex justify-center">
        {isEditing ? (
          <Button
            variant="contained"
            component="label"
            className="w-full sm:w-auto px-6 py-2 sm:py-3"
            startIcon={<CloudUploadIcon />}
            onClick={handleUpdateUser}
          >
            Cập nhật tài khoản
          </Button>
        ) : (
          <Button
            variant="contained"
            component="label"
            className="w-full sm:w-auto px-6 py-2 sm:py-3"
            startIcon={<CloudUploadIcon />}
            onClick={handleInsertUser}
          >
            Tạo tài khoản
          </Button>
        )}
      </div>
    </div>
  );
}
