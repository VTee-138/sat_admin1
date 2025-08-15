import React from "react";
import {
  Button,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Person3Icon from "@mui/icons-material/Person3";
import PasswordIcon from "@mui/icons-material/Password";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ArticleIcon from "@mui/icons-material/Article";
import LinkIcon from "@mui/icons-material/Link";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import QuizIcon from "@mui/icons-material/Quiz";
import MultiSearchInput from "./MultiSearchInput";

export default function AssessmentForm({
  formData,
  handleChangeInputAssessment,
  handleInsertAssessment,
  isEditing,
  handleUpdateAssessment,
  upLoadImageAssessment,
  imageRefDoc,
  childExamIDs,
  setChildExamIDs,
  selectedExams,
  setSelectedExams,
  handleCancelEdit,
}) {
  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            {isEditing ? "Cập Nhật Bài Thi" : "Tạo Bài Thi Mới"}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {isEditing
              ? "Chỉnh sửa thông tin bài thi để cập nhật nội dung"
              : "Tạo bài thi mới với đề thi và hình ảnh minh họa"}
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white/70 backdrop-blur-sm shadow-2xl rounded-3xl border border-white/50 overflow-hidden">
          <div className="p-8 sm:p-12">
            {/* Title Input */}
            <div className="mb-8">
              <Typography
                variant="subtitle1"
                className="text-gray-700 font-semibold mb-3 text-base"
              >
                Tên bài thi *
              </Typography>
              <TextField
                name="title"
                value={formData?.title || ""}
                onChange={handleChangeInputAssessment}
                placeholder="Nhập tên bài thi..."
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ArticleIcon className="text-blue-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    "&:hover fieldset": {
                      borderColor: "#3b82f6",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#1d4ed8",
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-8">
              <Typography
                variant="subtitle1"
                className="text-gray-700 font-semibold mb-3 text-base"
              >
                Hình ảnh bài thi
              </Typography>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={upLoadImageAssessment}
                  ref={imageRefDoc}
                  style={{ display: "none" }}
                />
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => imageRefDoc.current?.click()}
                  sx={{
                    borderRadius: "12px",
                    borderColor: "#3b82f6",
                    color: "#3b82f6",
                    "&:hover": {
                      borderColor: "#1d4ed8",
                      backgroundColor: "rgba(59, 130, 246, 0.04)",
                    },
                  }}
                >
                  Chọn ảnh
                </Button>
                {/* {formData?.imgUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={formData.imgUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <Typography variant="body2" color="success.main">
                      ✓ Đã tải ảnh
                    </Typography>
                  </div>
                )} */}
              </div>
            </div>

            {/* Multi Search Input */}
            <div className="mb-8">
              <MultiSearchInput
                childExamIDs={childExamIDs}
                setChildExamIDs={setChildExamIDs}
                selectedExams={selectedExams}
                setSelectedExams={setSelectedExams}
              />
            </div>

            {/* Total Time and Total Questions */}
            <div className="mb-8">
              <Typography
                variant="subtitle1"
                className="text-gray-700 font-semibold mb-4 text-base"
              >
                Thông tin tổng quan
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Time */}
                <TextField
                  name="totalTime"
                  value={formData?.totalTime || 0}
                  onChange={handleChangeInputAssessment}
                  label="Tổng thời gian (phút)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon className="text-orange-500" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(243, 244, 246, 0.8)",
                      },
                    },
                  }}
                />

                {/* Total Questions */}
                <TextField
                  name="totalQuestion"
                  value={formData?.totalQuestion || 0}
                  onChange={handleChangeInputAssessment}
                  label="Tổng số câu hỏi"
                  type="number"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <QuizIcon className="text-green-500" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(243, 244, 246, 0.8)",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-center gap-4 pt-6">
              {isEditing && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleCancelEdit}
                  sx={{
                    borderRadius: "20px",
                    padding: "16px 48px",
                    borderColor: "#6b7280",
                    color: "#6b7280",
                    "&:hover": {
                      borderColor: "#4b5563",
                      backgroundColor: "rgba(107, 114, 128, 0.04)",
                    },
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    transition: "all 0.3s ease",
                    minWidth: "200px",
                  }}
                >
                  Hủy
                </Button>
              )}
              <Button
                variant="contained"
                size="large"
                startIcon={<CloudUploadIcon />}
                onClick={
                  isEditing ? handleUpdateAssessment : handleInsertAssessment
                }
                sx={{
                  borderRadius: "20px",
                  padding: "16px 48px",
                  background: isEditing
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  "&:hover": {
                    background: isEditing
                      ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
                      : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    transform: "translateY(-2px)",
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  },
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  transition: "all 0.3s ease",
                  minWidth: "200px",
                }}
              >
                {isEditing ? "Cập Nhật Bài Thi" : "Tạo Bài Thi"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
